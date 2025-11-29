import io
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
from django.http import FileResponse
from django.db.models import Q, Sum

from apps.expenses.serializers import *
from apps.travel.serializers.travel_serializers import TravelApplicationSerializer
from apps.expenses.models import *
from apps.master_data.models.approval import ApprovalMatrix
from apps.master_data.models.travel import TravelModeMaster
from utils.pagination import StandardResultsSetPagination
from utils.response_formatter import *

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# -------------------------
# Validate endpoint
# -------------------------
class ClaimValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = ClaimValidateSerializer(data=request.data)
            # Use raise_exception to let DRF handle ValidationError -> 400 with detail
            serializer.is_valid(raise_exception=False)

            if serializer.errors:
                return error_response(data=serializer.errors, message="Validation failed")

            validation_output = getattr(serializer, "_validation_output", {"errors": {}, "warnings": {}, "computed": {}})
            return success_response(message="Validation successful", data=validation_output)
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")


# -------------------------
# Submit endpoint
# -------------------------
class ClaimSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = ClaimSubmitSerializer(data=request.data)
            serializer.is_valid(raise_exception=False)
            if serializer.errors:
                return error_response(data=serializer.errors, message="Validation failed")

            with transaction.atomic():
                claim = serializer.save()

            return success_response(message="Claim submitted successfully", data={"claim_id": claim.id})
        except serializers.ValidationError as ve:
            return error_response(data=ve.detail, message="Validation failed")
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")


# -------------------------------------------------------
# My Claims: List + Create (create via ClaimSubmit serializer)
# -------------------------------------------------------
class ClaimListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET: list claims for the authenticated user (non-staff).
        Staff users can see all claims.
        Supports filters: status, from_date, to_date, search.
        """
        try:
            qs = ExpenseClaim.objects.select_related("employee", "status", "travel_application").all()

            if not request.user.is_staff:
                qs = qs.filter(employee=request.user)

            # filters
            status_q = request.query_params.get("status")
            ffrom = request.query_params.get("from_date")
            tto = request.query_params.get("to_date")
            search = request.query_params.get("search")

            if status_q:
                qs = qs.filter(status__code=status_q)
            if ffrom:
                qs = qs.filter(created_on__date__gte=ffrom)
            if tto:
                qs = qs.filter(created_on__date__lte=tto)
            if search:
                qs = qs.filter(
                    Q(travel_application__travel_request_id__icontains=search) |
                    Q(id__icontains=search)
                )

            qs = qs.order_by("-created_on")

            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(qs, request)
            serializer = ClaimListSerializer(page, many=True, context={"request": request})
            
            return paginated_response(serializer_data=serializer.data, paginator=paginator, message="Claims retrieved")
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")

    def post(self, request):
        """
        POST: submit a claim. Uses ClaimSubmitRequestSerializer from existing business logic.
        """
        try:
            serializer = ClaimSubmitRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=False)
            if serializer.errors:
                return error_response(data=serializer.errors, message="Validation failed")

            claim = serializer.save()
            return success_response(message="Claim submitted successfully", data={"claim_id": claim.id})
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")

# -------------------------
# Claim detail
# -------------------------
class ClaimDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, claim_id):
        try:
            claim = ExpenseClaim.objects.select_related("employee", "status", "travel_application").filter(id=claim_id).first()
            if not claim:
                return error_response(data={"claim": ["Claim not found"]}, message="Claim not found")

            # permission checks: owner or staff
            if claim.employee != request.user and not request.user.is_staff:
                return error_response(data={"permission": ["You cannot view this claim"]}, message="Forbidden")

            serializer = ClaimDetailSerializer(claim, context={"request": request})
            return success_response(message="Claim detail retrieved", data=serializer.data)
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")
        
# -------------------------
# Claim list (with filters + pagination)
# -------------------------
class ClaimListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            qs = ExpenseClaim.objects.select_related("employee", "status", "travel_application").all()

            # Restrict for non-staff/non-finance
            if not (user.is_staff or user.groups.filter(name__in=["Finance", "TravelDesk"]).exists()):
                qs = qs.filter(employee=user)

            # Filters
            status_q = request.query_params.get("status")
            from_date = request.query_params.get("from")
            to_date = request.query_params.get("to")
            if status_q:
                qs = qs.filter(status__code=status_q)
            if from_date:
                qs = qs.filter(submitted_on__date__gte=from_date)
            if to_date:
                qs = qs.filter(submitted_on__date__lte=to_date)

            qs = qs.order_by("-submitted_on")

            # Pagination
            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(qs, request)
            serializer = ExpenseClaimSerializer(page, many=True, context={"request": request})
            return paginated_response(serializer_data=serializer.data, paginator=paginator, message="Success")
        except Exception as ex:
            tb = traceback.format_exc()
            return error_response(data={"detail": str(ex), "trace": tb}, message="Unexpected error")

class ClaimReceiptUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, claim_id):
        """
        Upload one or multiple receipt files.
        Required fields:
            files[] : actual files
            items[] : matching ExpenseItem IDs
        """

        claim = ExpenseClaim.objects.filter(id=claim_id).first()
        if not claim:
            return error_response(data={"claim": ["Invalid claim ID"]}, message="Claim not found")

        # Permissions
        if claim.employee != request.user and not request.user.is_staff:
            return error_response(data={"permission": ["Not allowed"]}, message="Forbidden")

        files = request.FILES.getlist("files")
        items = request.data.getlist("items")

        if not files:
            return error_response(data=None, message="No files uploaded")
        if not items:
            return error_response(data=None, message="Missing 'items' mapping list")
        if len(files) != len(items):
            return error_response(data={"detail": "files count must match items count"}, message="Mismatch between files and items")

        updated_items = []

        with transaction.atomic():
            for file_obj, item_id in zip(files, items):
                exp_item = ExpenseItem.objects.filter(id=item_id, claim=claim).first()
                if not exp_item:
                    return error_response(message="Invalid item mapping", serializer_data={"item": [f"ExpenseItem {item_id} not found for claim {claim_id}"]})

                exp_item.receipt_file = file_obj
                exp_item.has_receipt = True
                exp_item.save()

                updated_items.append(exp_item.id)

        return success_response(message="Receipts uploaded successfully", data={"updated_items": updated_items})

# -------------------------
# Master endpoints (frontend)
# -------------------------
class ExpenseTypeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        types = ExpenseTypeMaster.objects.filter(is_active=True).order_by("name")
        data = ExpenseTypeMasterSerializer(types, many=True).data
        return success_response(message="Success", data=data)


class ClaimStatusListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sts = ClaimStatusMaster.objects.all().order_by("sequence")
        data = ClaimStatusMasterSerializer(sts, many=True).data
        return success_response(message="Success", data=data)

# -------------------------
# ClaimActionView — Approve / Reject
# -------------------------
class ClaimActionView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_claim_final_approver(self, tr):
        """
        Decide who should approve the claim:
        1. Last approver of travel application (highest approval_level & approved)
        2. Else: reporting manager
        3. If employee has no manager → auto-approve
        """

        # Try last approver from travel approval flow
        last_flow = tr.approval_flows.filter(
            status="approved"
        ).order_by("-approval_level", "-approved_at").first()

        if last_flow:
            return last_flow.approver

        # Fallback → reporting manager
        from apps.authentication.models.profiles import OrganizationalProfile
        profile = OrganizationalProfile.objects.filter(user=tr.employee).first()
        if profile and profile.reporting_manager:
            return profile.reporting_manager

        # No manager → auto approve
        return None

    def post(self, request, claim_id):
        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        remarks = serializer.validated_data.get("remarks", "")

        claim = ExpenseClaim.objects.select_related(
            "travel_application", "employee", "status"
        ).filter(id=claim_id).first()

        if not claim:
            return error_response(data=None, message="Claim not found")

        tr = claim.travel_application
        approver = self._get_claim_final_approver(tr)

        # Auto-approval scenario (self manager)
        if approver is None:
            return self._auto_handle(claim, request.user, action, remarks)
        
        # Permission check — only the approver can approve/reject
        if request.user != approver and not approver and not request.user.is_staff:
            return error_response(data=None, message="You are not authorized to act on this claim")
        
        return self._process_action(claim, request.user, action, remarks)
    
    # ----------------------------
    # Internal helpers
    # ----------------------------

    def _auto_handle(self, claim, user, action, remarks):
        """Auto approve or reject when no approver exists."""
        status_code = "approved" if action == "approve" else "rejected"
        status_obj = ClaimStatusMaster.objects.filter(code=status_code).first()

        claim.status = status_obj
        claim.save()

        flow = ClaimApprovalFlow.objects.filter(claim=claim, status="pending").first()
        if not flow:
            flow = ClaimApprovalFlow.objects.create(
                claim=claim,
                approver=user,
                sequence=1,
                status="pending"
            )

        flow.status = status_code
        flow.remarks = remarks or ("Auto-approved" if action == "approve" else "Auto-rejected")
        flow.approved_at = timezone.now()
        flow.save()

        return success_response(message=f"Claim {status_code}", data=None)

    def _process_action(self, claim, user, action, remarks):
        """Normal approval/rejection path."""
        with transaction.atomic():
            pending_flow = ClaimApprovalFlow.objects.filter(
                claim=claim,
                status="pending"
            ).first()

            if not pending_flow:
                return error_response(data=None, message="No pending approval exists")

            # Update existing row, do not create a new one
            pending_flow.status = "approved" if action == "approve" else "rejected"
            pending_flow.remarks = remarks
            pending_flow.approved_at = timezone.now()
            pending_flow.save()

            new_status_code = "approved" if action == "approve" else "rejected"
            new_status = ClaimStatusMaster.objects.filter(code=new_status_code).first()
            claim.status = new_status
            claim.save()

            return success_response(message=f"Claim {new_status_code}", data={"new_status": new_status.code})


class ClaimableTravelApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return travel applications that:
        1. belong to logged-in user
        2. have status = completed
        3. do NOT already have an ExpenseClaim
        """

        qs = (
            TravelApplication.objects.filter(
                employee=request.user,
                status="completed"
            )
            .exclude(expense_claim__isnull=False)  # exclude apps with existing claim
            .select_related("employee", "general_ledger")
            .prefetch_related("trip_details", "trip_details__from_location", "trip_details__to_location")
            .order_by("-created_at")
        )

        serializer = TravelApplicationSerializer(qs, many=True)
        return Response({
            "success": True,
            "message": "Claimable travel applications retrieved successfully",
            "data": serializer.data
        })


# -------------------------------------------------------
# Claim Reports - PDF
# -------------------------------------------------------
class ClaimReportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Generate PDF report for claims with filters.
        Returns: application/pdf stream
        """
        try:
            # permission: only staff/finance/admin can access
            if not (request.user.is_staff or request.user.groups.filter(name__in=["Finance"]).exists()):
                return Response(
                    error_response(
                        message="Forbidden",
                        serializer_data={"permission": ["Only finance/staff can generate reports"]}
                    ),
                    status=403
                )

            # validate filters
            serializer = ClaimReportFilterSerializer(data=request.query_params)
            serializer.is_valid(raise_exception=False)

            if serializer.errors:
                return Response(
                    error_response(
                        message="Invalid filters",
                        serializer_data=serializer.errors
                    ),
                    status=400
                )

            filters = serializer.validated_data

            qs = ExpenseClaim.objects.select_related(
                "employee", "status", "travel_application"
            ).all()

            # Apply filters
            if filters.get("employee"):
                qs = qs.filter(employee_id=filters["employee"])
            if filters.get("status"):
                qs = qs.filter(status__code=filters["status"])
            if filters.get("from_date"):
                qs = qs.filter(created_on__date__gte=filters["from_date"])
            if filters.get("to_date"):
                qs = qs.filter(created_on__date__lte=filters["to_date"])

            qs = qs.order_by("-created_on")[:1000]  # safety cap

            # Create PDF in-memory
            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4

            # Title
            p.setFont("Helvetica-Bold", 16)
            p.drawString(40, height - 60, "Expense Claims Report")
            p.setFont("Helvetica", 10)
            p.drawString(
                40,
                height - 80,
                f"Generated by: {request.user.get_full_name() or request.user.username} "
                f"on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            y = height - 110

            # Table header
            p.setFont("Helvetica-Bold", 9)
            p.drawString(40, y, "Claim ID")
            p.drawString(100, y, "TR ID")
            p.drawString(220, y, "Employee")
            p.drawString(340, y, "Status")
            p.drawString(420, y, "Final Amount")
            p.setFont("Helvetica", 9)
            y -= 18

            # Rows
            for claim in qs:
                if y < 80:
                    p.showPage()
                    y = height - 80

                p.drawString(40, y, str(claim.id))

                tr_id = getattr(claim.travel_application, "travel_request_id", "") or ""
                p.drawString(100, y, tr_id[:18])

                emp = claim.employee.get_full_name() or claim.employee.username
                p.drawString(220, y, emp[:18])

                status_label = claim.status.label if claim.status else ""
                p.drawString(340, y, status_label[:12])

                p.drawString(420, y, str(claim.final_amount_payable))
                y -= 16

            p.showPage()
            p.save()
            buffer.seek(0)

            filename = f"expense_claims_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
            return FileResponse(buffer, as_attachment=True, filename=filename)

        except Exception as ex:
            tb = traceback.format_exc()
            return Response(
                error_response(
                    message="Unexpected error",
                    serializer_data={"detail": str(ex), "trace": tb}
                ),
                status=500
            )