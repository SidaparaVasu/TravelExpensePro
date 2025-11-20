"""
ApprovalEngineV2

Purpose:
- Evaluate a TravelApplication and produce an ordered list of approvers
  honoring TravelPolicyMaster, ApprovalMatrix (if present), and TSF overrides.
- Designed to be drop-in for TravelApplicationSubmitView.

Output:
- build() -> list of ApproverEntry objects with attributes:
    .user, .level, .sequence, .is_required, .can_view, .can_approve

Notes:
- Does NOT auto-approve when approver == requester.
- Attempts to be resilient if some master models are not present.
"""

import logging
from types import SimpleNamespace
from decimal import Decimal
from django.utils import timezone

logger = logging.getLogger(__name__)

# Small helper class for final entries
class ApproverEntry:
    def __init__(self, user, level, sequence=0, is_required=True, can_view=True, can_approve=True):
        self.user = user
        self.level = level
        self.sequence = sequence
        self.is_required = is_required
        self.can_view = can_view
        self.can_approve = can_approve

    def to_dict(self):
        return {
            "user_id": getattr(self.user, "id", None),
            "level": self.level,
            "sequence": self.sequence,
            "is_required": self.is_required,
            "can_view": self.can_view,
            "can_approve": self.can_approve
        }

class ApprovalEngineV2:
    """
    ApprovalEngineV2
    Arguments:
      - travel_app : TravelApplication instance
      - request_user: User instance who is submitting (for role checks)
      - config (optional): dict to override default thresholds if needed
    """
    DEFAULTS = {
        "flight_amount_threshold": Decimal("10000"),  # TSF fallback if TravelPolicyMaster not present
        "own_car_distance_km": 150,                   # TSF fallback
    }

    def __init__(self, travel_app, request_user, config=None):
        self.travel_app = travel_app
        self.request_user = request_user
        self.config = self.DEFAULTS.copy()
        if config:
            self.config.update(config)

        # cache model references if available
        self._load_models()

    # ---------------------------
    # Model discovery / safety
    # ---------------------------
    def _load_models(self):
        """
        Try to import commonly expected master models and auth role models.
        If something isn't present, we set it to None and continue gracefully.
        """
        try:
            from apps.master_data.models import TravelPolicyMaster, ApprovalMatrix, TravelModeMaster, GradeMaster
            self.TravelPolicyMaster = TravelPolicyMaster
            self.ApprovalMatrix = ApprovalMatrix
            self.TravelModeMaster = TravelModeMaster
            self.GradeMaster = GradeMaster
        except Exception as e:
            # Not fatal — engine will fall back to built-in TSF rules
            logger.debug("Some master_data models not available: %s", e)
            self.TravelPolicyMaster = None
            self.ApprovalMatrix = None
            self.TravelModeMaster = None
            self.GradeMaster = None

        try:
            from apps.authentication.models import Role, UserRole
            self.Role = Role
            self.UserRole = UserRole
        except Exception as e:
            logger.debug("Authentication role models not available: %s", e)
            self.Role = None
            self.UserRole = None

    # ---------------------------
    # User / role helpers
    # ---------------------------
    def user_has_role(self, user, role_name):
        """
        Robust role check:
        - If user has attribute 'roles' (queryset or list), try that first.
        - Else fallback to UserRole join if available.
        Case-insensitive match on role name.
        """
        try:
            if hasattr(user, "roles"):
                # roles might be list or a Django related manager
                roles_attr = getattr(user, "roles")
                try:
                    # if it's a queryset-like
                    return roles_attr.filter(name__iexact=role_name).exists()
                except Exception:
                    # maybe it's a list of dicts or objects
                    for r in roles_attr:
                        if getattr(r, "name", str(r)).lower() == role_name.lower():
                            return True
                    return False
            if self.UserRole and self.Role:
                role = self.Role.objects.filter(name__iexact=role_name).first()
                if not role:
                    return False
                return self.UserRole.objects.filter(role=role, user=user, is_active=True).exists()
            # Last resort: check user.groups or user.is_superuser (not ideal)
            if hasattr(user, "groups"):
                try:
                    return user.groups.filter(name__iexact=role_name).exists()
                except Exception:
                    return False
            if getattr(user, "is_superuser", False) and role_name.lower() in ["admin", "superuser"]:
                return True
            return False
        except Exception as e:
            logger.exception("Error checking role for user %s: %s", getattr(user, "id", "unknown"), e)
            return False

    def find_user_for_role(self, role_name):
        """
        Find a user assigned to a role (first active one). Returns user or None.
        Tries:
          1. UserRole join (preferred)
          2. Role-based fallback (if some other mapping exists)
        """
        try:
            if self.UserRole and self.Role:
                role = self.Role.objects.filter(name__iexact=role_name).first()
                if not role:
                    return None
                ur = self.UserRole.objects.filter(role=role, is_active=True).order_by("-is_primary").first()
                if ur:
                    return ur.user
            # If no UserRole model, try scanning reporting structure or system admins
            # (best-effort)
            return None
        except Exception as e:
            logger.debug("find_user_for_role error: %s", e)
            return None

    # ---------------------------
    # Policy readers
    # ---------------------------
    def get_effective_policies(self, policy_type=None):
        """
        Returns list/queryset of active TravelPolicyMaster rules (if model present).
        If policy_type provided, filter by it.
        """
        if not self.TravelPolicyMaster:
            return []
        try:
            qs = self.TravelPolicyMaster.objects.filter(is_active=True)
            today = timezone.now().date()
            qs = qs.filter(effective_from__lte=today).filter(models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=today))
            if policy_type:
                qs = qs.filter(policy_type=policy_type)
            return list(qs)
        except Exception as e:
            logger.debug("Error fetching TravelPolicyMaster: %s", e)
            return []

    # ---------------------------
    # Booking / trip analysis
    # ---------------------------
    def _collect_bookings(self):
        """
        Returns a flat list of bookings across trip_details in the travel_app.
        """
        bookings = []
        try:
            for trip in getattr(self.travel_app, "trip_details").all():
                bookings.extend(list(trip.bookings.all()))
        except Exception as e:
            logger.debug("Error collecting bookings: %s", e)
        return bookings

    def _any_flight_above_threshold(self, bookings, threshold=None):
        if threshold is None:
            threshold = self.config["flight_amount_threshold"]
        for b in bookings:
            try:
                name = b.booking_type.name.lower()
                if "flight" in name:
                    cost = getattr(b, "estimated_cost", None)
                    if cost and Decimal(cost) > Decimal(threshold):
                        return True
            except Exception:
                continue
        return False

    def _any_own_car_over_distance(self, bookings, max_distance=None):
        if max_distance is None:
            max_distance = self.config["own_car_distance_km"]
        for b in bookings:
            try:
                name = b.booking_type.name.lower()
                if "car" in name:
                    distance = 0
                    details = getattr(b, "booking_details", {}) or {}
                    distance = details.get("distance_km") or details.get("distance") or 0
                    try:
                        if float(distance) > float(max_distance):
                            return True
                    except Exception:
                        continue
            except Exception:
                continue
        return False

    # ---------------------------
    # Matrix-based checks (if available)
    # ---------------------------
    def matrix_requires_ceo_for_amount(self, bookings):
        """
        If ApprovalMatrix (or similar) indicates CEO required for booking amounts,
        consult it. This is optional; if model is not present, returns None to indicate
        "no answer".
        """
        if not self.ApprovalMatrix:
            return None
        try:
            # Example ApprovalMatrix model may have fields: travel_mode, employee_grade, min_amount, max_amount, requires_ceo...
            # We'll attempt to evaluate bookings against matrix records:
            for b in bookings:
                try:
                    mode = getattr(b.booking_type, "id", None)
                    amt = getattr(b, "estimated_cost", None)
                    if amt is None:
                        continue
                    # Decorously attempt to find matrix rows for this mode & grade:
                    rows = self.ApprovalMatrix.objects.filter(is_active=True)
                    if mode:
                        rows = rows.filter(travel_mode=mode)
                    grade = getattr(self.travel_app.employee, "grade", None)
                    if grade and hasattr(rows, "filter"):
                        rows = rows.filter(employee_grade=grade)
                    # iterate candidate rows
                    for r in rows:
                        min_a = r.min_amount or Decimal("0")
                        max_a = r.max_amount or None
                        if Decimal(amt) >= Decimal(min_a) and (max_a is None or Decimal(amt) <= Decimal(max_a)):
                            # if matrix row explicitly requires CEO escalate, respect it
                            if getattr(r, "requires_ceo", False):
                                return True
                except Exception:
                    continue
            return False
        except Exception as e:
            logger.debug("matrix_requires_ceo_for_amount error: %s", e)
            return None

    # ---------------------------
    # Merge/dedupe/order helpers
    # ---------------------------
    def _dedupe_and_order(self, approver_entries):
        """
        Deduplicate by user.id, keep earliest sequence; if same user in multiple levels,
        merge attributes (is_required = OR, can_approve = OR), and renumber sequences.
        Returns ordered list of ApproverEntry.
        """
        final = []
        seen = {}

        for a in approver_entries:
            uid = getattr(a.user, "id", None)
            if uid is None:
                # keep but try to dedupe by object id
                uid = id(a.user)

            if uid not in seen:
                seen[uid] = a
                final.append(a)
            else:
                existing = seen[uid]
                # If current sequence is earlier, swap (maintain position in list)
                if a.sequence and (not existing.sequence or a.sequence < existing.sequence):
                    idx = final.index(existing)
                    final[idx] = a
                    seen[uid] = a
                else:
                    # merge flags
                    existing.is_required = existing.is_required or a.is_required
                    existing.can_view = existing.can_view or a.can_view
                    existing.can_approve = existing.can_approve or a.can_approve

        # normalize sequence numbers in final order
        for i, a in enumerate(final, start=1):
            a.sequence = i
        return final

    # ---------------------------
    # Core build logic
    # ---------------------------
    def build(self):
        """
        Build the final approver list honoring:
          - reporting manager (if present)
          - dynamic policies (TravelPolicyMaster) where available
          - approval matrix checks (if present)
          - TSF overrides (flight > threshold, own car > distance)
          - dedupe & ordering (manager -> chro -> ceo)
        Returns: list of ApproverEntry
        """
        bookings = self._collect_bookings()

        approvers = []

        # 1) Manager (mandatory)
        reporting_manager = None
        try:
            org_profile = getattr(self.request_user, "organizational_profile", None)
            reporting_manager = getattr(org_profile, "reporting_manager", None)
        except Exception:
            reporting_manager = None

        if reporting_manager:
            approvers.append(ApproverEntry(user=reporting_manager, level="manager", sequence=1))
        else:
            # Fallback: try to find by role 'Manager'
            mgr = self.find_user_for_role("Manager")
            if mgr:
                approvers.append(ApproverEntry(user=mgr, level="manager", sequence=1))
            else:
                # If strict requirement desired, you can return early; but we will continue and add fallback later.
                logger.warning("No reporting_manager found for %s (user id=%s). Will attempt fallback roles.",
                               getattr(self.request_user, "id", None), getattr(self.request_user, "username", None))

        # Determine if CEO/CHRO required by policies or matrix or TSF rules
        # ----------------------
        # CEO determination
        #  - check TravelPolicyMaster for amount_limit / advance_booking rules
        #  - check ApprovalMatrix if present (matrix may require CEO for bracket)
        #  - fallback to default TSF threshold
        # ----------------------
        require_ceo = False

        try:
            # 1) consult travel policy: amount_limit
            if self.TravelPolicyMaster:
                policies = self.get_effective_policies(policy_type="amount_limit")
                # Check bookings against policies
                for p in policies:
                    # only consider policies applicable to flights (policy.travel_mode) if set
                    try:
                        params = getattr(p, "rule_parameters", {}) or {}
                        max_amount = params.get("max_amount") or params.get("threshold") or None
                        # If policy has max_amount it typically defines limits; if policy says "requires_ceo_above": value
                        require_key = params.get("requires_ceo_above") or params.get("requires_ceo") or None
                        # We'll use a simple heuristic: if policy.rule_parameters defines numeric threshold for 'requires_ceo_above' or 'max_amount' etc.
                        threshold = None
                        if require_key:
                            threshold = Decimal(require_key)
                        elif max_amount:
                            threshold = Decimal(max_amount)
                        if threshold:
                            if self._any_flight_above_threshold(bookings, threshold):
                                require_ceo = True
                                break
                    except Exception:
                        continue

            # 2) check approval matrix (if it returns True/False)
            matrix_ceo = self.matrix_requires_ceo_for_amount(bookings)
            if matrix_ceo is True:
                require_ceo = True
            elif matrix_ceo is None:
                # matrix had no opinion; continue to fallback
                pass

            # 3) fallback TSF rule if still not decided
            if not require_ceo:
                if self._any_flight_above_threshold(bookings, self.config["flight_amount_threshold"]):
                    require_ceo = True
        except Exception as e:
            logger.debug("Error evaluating CEO requirement: %s", e)
            # be conservative: leave require_ceo as currently computed

        # ----------------------
        # CHRO determination
        #  - check TravelPolicyMaster for distance_limit
        #  - check matrix
        #  - fallback to TSF own_car_distance_km
        # ----------------------
        require_chro = False
        try:
            # policy-based check
            if self.TravelPolicyMaster:
                policies = self.get_effective_policies(policy_type="distance_limit")
                for p in policies:
                    try:
                        params = getattr(p, "rule_parameters", {}) or {}
                        threshold = params.get("max_distance") or params.get("distance_km")
                        if threshold is not None:
                            if self._any_own_car_over_distance(bookings, threshold):
                                require_chro = True
                                break
                    except Exception:
                        continue

            # fallback to TSF threshold
            if not require_chro:
                if self._any_own_car_over_distance(bookings, self.config["own_car_distance_km"]):
                    require_chro = True
        except Exception as e:
            logger.debug("Error evaluating CHRO requirement: %s", e)

        # Add CHRO and CEO users in the desired order: manager -> chro -> ceo
        # But apply rule: if request_user has role CHRO/CEO themselves, handle per your rules:
        # - If request_user is CEO/CHRO, do not auto-exclude an approver entry. We still create an entry for that role,
        #   but we will prefer the role-specific user (which may be the same as request_user).
        # - If the same user appears multiple times, dedupe logic will keep one entry.
        if require_chro:
            chro_user = self.find_user_for_role("CHRO")
            if chro_user:
                approvers.append(ApproverEntry(user=chro_user, level="chro", sequence=len(approvers)+1))
            else:
                logger.warning("CHRO required but no CHRO user found in role mapping. Skipping CHRO.")

        if require_ceo:
            ceo_user = self.find_user_for_role("CEO")
            if ceo_user:
                approvers.append(ApproverEntry(user=ceo_user, level="ceo", sequence=len(approvers)+1))
            else:
                logger.warning("CEO required but no CEO user found in role mapping. Skipping CEO.")

        # ----------------------
        # Special handling: if reporting_manager == request_user (self-reporting)
        # We still keep the manager entry (so frontend can show it) — per your requirement.
        # But ensure no duplicate entries for same user (dedupe step handles that).
        # ----------------------

        # ----------------------
        # Finalize: dedupe + normalization
        # ----------------------
        final = self._dedupe_and_order(approvers)

        # If final is empty, attempt final fallbacks (DOP/fallback)
        if not final:
            # fallback order: Manager role -> CHRO -> CEO
            fb_order = ["Manager", "CHRO", "CEO"]
            for role in fb_order:
                user = self.find_user_for_role(role)
                if user:
                    final = [ApproverEntry(user=user, level=role.lower(), sequence=1)]
                    break

        # Last-check: ensure sequences set
        for i, e in enumerate(final, start=1):
            e.sequence = i

        # Defensive logging about result
        logger.debug("ApprovalEngineV2 build result for travel_app %s: %s",
                     getattr(self.travel_app, "id", None),
                     [f"{a.sequence}:{a.level}:{getattr(a.user,'id',None)}" for a in final])

        return final
