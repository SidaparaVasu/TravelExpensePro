from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.response_formatter import success_response, error_response
from datetime import datetime, timedelta
from django.utils import timezone


class RealTimeValidationView(APIView):
    """Real-time validation as user types"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        validation_type = request.data.get('type')

        validators = {
            'booking': self.validate_booking,
            'dates': self.validate_dates,
            'duplicate': self.validate_duplicate,
            'entitlement': self.validate_entitlement,
            'advance_booking': self.validate_advance_booking_dynamic,
        }

        validator = validators.get(validation_type)
        if not validator:
            return error_response('Invalid validation type', status_code=400)

        return validator(request)

    # -------------------------------------------------------------
    # BOOKING VALIDATION
    # -------------------------------------------------------------
    def validate_booking(self, request):
        from apps.travel.business_logic.validators import check_booking_entitlement
        from apps.master_data.models import TravelModeMaster, TravelSubOptionMaster, CityCategoriesMaster

        mode_id = request.data.get('mode_id')
        sub_option_id = request.data.get('sub_option_id')
        city_category_id = request.data.get('city_category_id')
        estimated_cost = request.data.get('estimated_cost', 0)

        try:
            mode = TravelModeMaster.objects.get(id=mode_id)
            sub = TravelSubOptionMaster.objects.get(id=sub_option_id)
            city = CityCategoriesMaster.objects.get(id=city_category_id)

            is_allowed, max_amount, message = check_booking_entitlement(
                request.user, mode, sub, city
            )

            warnings = []

            if is_allowed and max_amount and estimated_cost > max_amount:
                warnings.append({
                    "field": "estimated_cost",
                    "message": f"Amount ₹{estimated_cost} exceeds entitlement ₹{max_amount}",
                    "severity": "warning"
                })

            # Special case – flight above 10k
            if mode.name.lower() == "flight" and estimated_cost > 10000:
                warnings.append({
                    "field": "estimated_cost",
                    "message": "CEO approval required for flights above ₹10,000",
                    "severity": "info"
                })

            return success_response({
                "is_valid": is_allowed,
                "max_amount": float(max_amount) if max_amount else None,
                "warnings": warnings,
                "message": message
            })

        except Exception as e:
            return error_response(str(e), status_code=400)

    # -------------------------------------------------------------
    # DATE VALIDATION
    # -------------------------------------------------------------
    def validate_dates(self, request):
        departure = request.data.get("departure_date")
        return_date = request.data.get("return_date")

        errors, warnings = [], []
        try:
            dep = datetime.strptime(departure, "%Y-%m-%d").date()
            ret = datetime.strptime(return_date, "%Y-%m-%d").date()
            today = datetime.now().date()

            if ret < dep:
                errors.append({"field": "return_date", "message": "Return date cannot be before departure"})

            if dep < today:
                errors.append({"field": "departure_date", "message": "Departure date cannot be in the past"})

            if dep > today + timedelta(days=365):
                warnings.append({"field": "departure_date", "message": "Travel more than 1 year ahead", "severity": "warning"})

            duration = (ret - dep).days
            if duration > 90:
                errors.append({"field": "return_date", "message": "Max travel duration is 90 days"})

            return success_response({
                "is_valid": len(errors) == 0,
                "duration_days": duration,
                "errors": errors,
                "warnings": warnings
            })

        except ValueError:
            return error_response("Invalid date format (YYYY-MM-DD)", status_code=400)

    # -------------------------------------------------------------
    # DUPLICATE TRAVEL CHECK
    # -------------------------------------------------------------
    def validate_duplicate(self, request):
        from apps.travel.business_logic.validators import validate_duplicate_travel_request

        try:
            dep = datetime.strptime(request.data.get("departure_date"), "%Y-%m-%d").date()
            ret = datetime.strptime(request.data.get("return_date"), "%Y-%m-%d").date()

            validate_duplicate_travel_request(request.user, dep, ret)
            return success_response({"has_duplicate": False})

        except Exception as e:
            return success_response({"has_duplicate": True, "message": str(e)})

    # -------------------------------------------------------------
    # ENTITLEMENT CHECK
    # -------------------------------------------------------------
    def validate_entitlement(self, request):
        from apps.master_data.models import GradeEntitlementMaster, TravelSubOptionMaster

        try:
            sub_option = TravelSubOptionMaster.objects.get(id=request.data.get("sub_option_id"))

            ent = GradeEntitlementMaster.objects.filter(
                grade=request.user.grade,
                sub_option=sub_option,
                city_category_id=request.data.get("city_category_id"),
                is_allowed=True
            ).first()

            if ent:
                return success_response({
                    "is_entitled": True,
                    "max_amount": float(ent.max_amount) if ent.max_amount else None
                })

            return success_response({
                "is_entitled": False,
                "message": f"Not entitled to {sub_option.name}"
            })

        except Exception as e:
            return error_response(str(e))

    # -------------------------------------------------------------
    # ADVANCE BOOKING VALIDATION (NEW DYNAMIC VERSION)
    # -------------------------------------------------------------
    def validate_advance_booking_dynamic(self, request):
        """
        Reads rules from TravelPolicyMaster and ApprovalMatrix.
        No hardcoding of 7 or 3 days.
        """
        from apps.master_data.models import (
            TravelModeMaster,
            TravelPolicyMaster,
            ApprovalMatrix
        )

        try:
            departure_str = request.data.get("departure_date")
            mode_id = request.data.get("mode_id")

            if not departure_str or not mode_id:
                return error_response("departure_date and mode_id are required", 400)

            dep = datetime.strptime(departure_str, "%Y-%m-%d").date()
            today = timezone.now().date()
            days_ahead = (dep - today).days

            mode = TravelModeMaster.objects.get(id=mode_id)

            # ---------------------------------------
            # 1) Try TravelPolicyMaster
            # ---------------------------------------
            policy = TravelPolicyMaster.objects.filter(
                policy_type="advance_booking",
                travel_mode=mode,
                is_active=True
            ).order_by("-effective_from").first()

            required_days = None

            if policy:
                # For flights they use {"days": 7}, trains {"hours": 72}
                params = policy.rule_parameters or {}
                required_days = params.get("days") or (params.get("hours") / 24 if params.get("hours") else None)

            # ---------------------------------------
            # 2) Fallback to ApprovalMatrix
            # ---------------------------------------
            if required_days is None:
                rule = ApprovalMatrix.objects.filter(
                    travel_mode=mode,
                    employee_grade=request.user.grade,
                    is_active=True,
                ).order_by("min_amount").first()

                if rule:
                    required_days = rule.advance_booking_required_days

            # Still no rule? then nothing to validate
            if not required_days:
                return success_response({
                    "is_valid": True,
                    "meets_requirement": True,
                    "message": "No advance booking rule configured"
                })

            required_days = int(required_days)

            # ---------------------------------------
            # FINAL VALIDATION
            # ---------------------------------------
            if days_ahead < required_days:
                return success_response({
                    "is_valid": False,
                    "meets_requirement": False,
                    "days_ahead": days_ahead,
                    "required_days": required_days,
                    "severity": "warning",
                    "message": f"{mode.name} must be booked {required_days} days in advance. You have {days_ahead} days."
                })

            return success_response({
                "is_valid": True,
                "meets_requirement": True,
                "days_ahead": days_ahead,
                "required_days": required_days,
                "severity": "success",
                "message": "Advance booking requirement satisfied"
            })

        except Exception as e:
            return error_response(str(e))
