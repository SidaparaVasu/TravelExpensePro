from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from django.core.exceptions import ValidationError
from django.db.models import Q

from apps.travel.models.application import TravelApplication
from apps.expenses.models import *
from apps.master_data.models.travel import GradeEntitlementMaster
from apps.master_data.models.geography import CityCategoriesMaster
from apps.master_data.models.approval import DAIncidentalMaster  
from apps.travel.models.application import TripDetails         


# -----------------------------------------------------------
# Utility
# -----------------------------------------------------------

def _to_decimal(val) -> Decimal:
    try:
        return Decimal(str(val))
    except:
        return Decimal("0")


def _date_from_str(v) -> Optional[date]:
    if not v:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, datetime):
        return v.date()
    try:
        return datetime.strptime(str(v), "%Y-%m-%d").date()
    except:
        return None


def _get_expense_type_code(etype) -> str:
    """Return expense type code from instance or raw value."""
    if hasattr(etype, "code"):
        return etype.code.lower()
    return str(etype).lower()


# --------------------------------------------------------------------
# DA MASTER FETCH
# --------------------------------------------------------------------

def _get_da_rates_for_grade(grade_name: str):
    """
    Fetch DA & incidental rates from master, grouped by city category.
    The TR provides employee_grade = "B-2A", which matches GradeMaster.name.
    """
    today = date.today()
    result = {}

    # Fetch all DA rows for grade & active date range
    rows = DAIncidentalMaster.objects.filter(
        grade__name=grade_name,
        is_active=True,
        effective_from__lte=today
    ).filter(
        Q(effective_to__isnull=True) | Q(effective_to__gte=today)
    )

    if not rows.exists():
        # Master data missing → validation error
        raise ValidationError({
            "da_master": [f"DA/Incidental master data not found for grade '{grade_name}'."]
        })

    for r in rows:
        cat = r.city_category.name  # "A", "B", "C"
        result[cat] = {
            "full": _to_decimal(r.da_full_day),
            "half": _to_decimal(r.da_half_day),
            "inc_full": _to_decimal(r.incidental_full_day),
            "inc_half": _to_decimal(r.incidental_half_day),
        }

    return result

# --------------------------------------------------------------------
# MAIN: DA CALCULATION WITH FIXED DATE EXTRACTION
# --------------------------------------------------------------------

def calculate_da_breakdown(tr: TravelApplication) -> List[Dict[str, Any]]:
    """
    Calculate DA/Incidental for each day of travel.
    FIX: Travel dates extracted from TripDetails if TR doesn't have start_date / end_date.
    """

    # ---------- Extract travel dates ----------
    start = _date_from_str(getattr(tr, "start_date", None))
    end = _date_from_str(getattr(tr, "end_date", None))

    # Fallback to TripDetails table
    if not start or not end:
        trips = tr.trip_details.all()
        if trips.exists():
            start = _date_from_str(trips.order_by("departure_date").first().departure_date)
            end = _date_from_str(trips.order_by("-return_date").first().return_date)

    if not start or not end:
        return []  # cannot calculate

    # ---------- Grade ----------
    grade_code = getattr(getattr(tr, "employee", None), "grade", None) or "B-3"
    da_master = _get_da_rates_for_grade(grade_code)

    # ---------- City Category (default B) ----------
    trips = tr.trip_details.all()
    cat = "B"
    if trips.exists():
        first_trip = trips.first()
        trip_cat = first_trip.get_city_category()
        if trip_cat:
            cat = trip_cat

    if cat not in da_master:
        cat = list(da_master.keys())[0]

    daily_rates = da_master[cat]

    # ---------- Build breakdown ----------
    results = []
    curr = start
    while curr <= end:
        # NOTE: Duration logic can be enhanced later.
        duration_hours = 24

        if duration_hours > 12:
            da = daily_rates["full"]
            inc = daily_rates["inc_full"]
        elif duration_hours >= 8:
            da = daily_rates["half"]
            inc = daily_rates["inc_half"]
        else:
            da = Decimal("0")
            inc = Decimal("0")

        results.append({
            "date": curr,
            "duration_hours": duration_hours,
            "eligible": da > 0,
            "da": da,
            "incidental": inc
        })

        curr += timedelta(days=1)

    return results


# --------------------------------------------------------------------
# DUPLICATE CLAIM CHECK
# --------------------------------------------------------------------

def check_duplicate_claim(tr: TravelApplication):
    return ExpenseClaim.objects.filter(travel_application=tr).exists()


# --------------------------------------------------------------------
# MAIN VALIDATION
# --------------------------------------------------------------------

def validate_claim_payload(
    payload: Dict[str, Any],
    tr: Optional[TravelApplication] = None,
    travel_application: Optional[TravelApplication] = None
):
    """
    Core validation function.
    Supports both 'tr' and 'travel_application' for compatibility.
    """

    # Normalization: accept either argument name
    if travel_application is not None and tr is None:
        tr = travel_application

    errors = {}
    warnings = {}
    computed = {}

    # 1 — Get TR
    if not tr:
        tr_id = payload.get("travel_application_id")
        tr = TravelApplication.objects.filter(id=tr_id).first()

    if not tr:
        errors["travel_request"] = ["Travel application not found."]
        return {"errors": errors, "warnings": warnings, "computed": computed}

    # 2 — Validate TR status for claim
    if tr.status != "completed":
        errors["travel_request.status"] = [
            f"Claims allowed only when travel is completed. Current status: {tr.status}"
        ]
        return {"errors": errors, "warnings": warnings, "computed": computed}

    # 3 — Prevent duplicate claims
    if check_duplicate_claim(tr):
        errors["duplicate"] = ["Claim already submitted for this travel."]
        return {"errors": errors, "warnings": warnings, "computed": computed}

    # 4 — DA Breakdown
    breakdown = calculate_da_breakdown(tr)
    if not breakdown:
        # warnings["trip_dates"] = ["Travel dates missing in TravelApplication/TripDetails."]
        warnings.setdefault("trip_dates", []).append(
            "Travel dates missing in TravelApplication/TripDetails."
        )

    if not breakdown:
        errors.setdefault("da_master", []).append(
            "DA / Incidental master data not configured for this grade and city category."
        )
        return {"errors": errors, "warnings": warnings, "computed": {}}

    total_da = sum([row["da"] for row in breakdown])
    total_inc = sum([row["incidental"] for row in breakdown])

    computed["da_breakdown"] = breakdown
    computed["total_da"] = _to_decimal(total_da)
    computed["total_incidental"] = _to_decimal(total_inc)

    # 5 — Expenses
    items = payload.get("items", [])
    total_exp = Decimal("0")

    for idx, item in enumerate(items):
        prefix = f"items[{idx}]"

        # expense_type is FK instance after serializer
        etype = item.get("expense_type")
        code = _get_expense_type_code(etype)

        # date
        if not item.get("expense_date"):
            errors.setdefault(f"{prefix}.expense_date", []).append("Expense date required.")

        # amount
        amt = _to_decimal(item.get("amount", 0))
        if amt < 0:
            errors.setdefault(f"{prefix}.amount", []).append("Amount cannot be negative.")
        total_exp += amt

        # receipt rules
        has_receipt = item.get("has_receipt", True)
        if code in ("hotel", "flight", "train", "taxi") and not has_receipt:
            warnings.setdefault(f"{prefix}.receipt", []).append(
                "Receipt missing for required expense type."
            )

        # distance-based rules
        if etype.is_distance_based:
            if not item.get("distance_km"):
                errors.setdefault(f"{prefix}.distance_km", []).append("Distance (km) required.")
            else:
                dist = _to_decimal(item["distance_km"])
                if dist <= 0:
                    errors.setdefault(f"{prefix}.distance_km", []).append("Invalid distance.")

    computed["total_expenses"] = total_exp

    # 6 — Advance
    adv = Decimal("0")
    
    # Sum all booking advances
    all_trips = tr.trip_details.all()
    for trip in all_trips:
        for b in trip.bookings.all():
            adv += _to_decimal(b.estimated_cost or 0)

    # Add "other expenses" advance from TravelApplication
    adv += _to_decimal(tr.advance_amount or 0)

    computed["advance_received"] = adv

    # 7 — Final total
    gross = computed["total_da"] + computed["total_incidental"] + computed["total_expenses"]
    final_amt = gross - adv

    computed["gross_total"] = gross
    computed["final_amount"] = final_amt

    computed["policy_summary"] = {
        "da_rates_source": "master",
        "per_km_rate_no_receipt": "15",
    }

    return {"errors": errors, "warnings": warnings, "computed": computed}


# --------------------------------------------------------------------
# PREPARE FINAL OBJECT (before saving)
# --------------------------------------------------------------------

def compute_claim_totals_and_prepare(
    payload,
    tr: TravelApplication = None,
    travel_application: TravelApplication = None
):
    """
    Supports both 'tr' and 'travel_application' for compatibility.
    """

    # Normalization
    if travel_application is not None and tr is None:
        tr = travel_application

    result = validate_claim_payload(payload, tr=tr)

    if result["errors"]:
        return result

    computed = result["computed"]
    items = payload.get("items", [])

    prepared_items = []
    for item in items:
        amt = _to_decimal(item["amount"])
        prepared_items.append({
            "expense_type": item["expense_type"],
            "expense_date": _date_from_str(item.get("expense_date")),
            "amount": amt,
            "has_receipt": item.get("has_receipt", True),
            "receipt_file": item.get("receipt_file"),
            "is_self_certified": item.get("is_self_certified", False),
            "self_certified_reason": item.get("self_certified_reason", ""),
            "distance_km": item.get("distance_km"),
            "vendor_name": item.get("vendor_name", ""),
            "bill_number": item.get("bill_number", ""),
            "city_category": item.get("city_category", ""),
            "remarks": item.get("remarks", "")
        })

    return {
        **result,
        "items_prepared": prepared_items,
        "total_da": computed["total_da"],
        "total_incidental": computed["total_incidental"],
        "total_expenses": computed["total_expenses"],
        "advance_received": computed["advance_received"],
        "final_amount": computed["final_amount"],
    }
