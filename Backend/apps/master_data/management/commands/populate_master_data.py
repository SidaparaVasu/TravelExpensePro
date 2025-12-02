# apps/master_data/management/commands/populate_masters.py
from django.core.management.base import BaseCommand
from django.db import transaction, IntegrityError
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# ---- Models used (adapt import paths if your project structure differs) ----
from apps.master_data.models.travel import *
from apps.master_data.models.grades import *
from apps.master_data.models.approval import *

# Authentication models
try:
    from authentication.models import *
except Exception:
    # fallback imports if your project uses different names/locations
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        Role = None
        UserRole = None
    except Exception:
        User = None
        Role = None
        UserRole = None


class Command(BaseCommand):
    help = "Populate selected master tables (travel modes, grade entitlements, DA, conveyance, approval matrix)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--only",
            nargs="+",
            type=str,
            help="Specify which masters to populate. Options: travel_modes, grades, grade_entitlement, da, conveyance, approval_matrix, all",
        )

    def handle(self, *args, **options):
        selected = options.get("only") or []
        if "all" in selected:
            selected = ["travel_modes", "grades", "grade_entitlement", "da", "conveyance", "approval_matrix"]

        if not selected:
            self.stdout.write(self.style.WARNING("No modules selected. Use --only <module1> <module2> or --only all"))
            return

        self.stdout.write(self.style.SUCCESS(f"Selected modules: {selected}"))

        # Execution map
        if "travel_modes" in selected:
            self.populate_travel_modes_and_suboptions()

        if "grades" in selected:
            self.populate_grade_master()

        if "grade_entitlement" in selected:
            self.populate_grade_entitlements()

        if "da" in selected:
            self.populate_da_incidentals()

        if "conveyance" in selected:
            self.populate_conveyance_rates()

        if "approval_matrix" in selected:
            self.populate_approval_matrix()

        # placeholders
        placeholders = ["guesthouse", "arc_hotels", "company", "department", "location"]
        for module in placeholders:
            if module in selected:
                self.stdout.write(self.style.WARNING(f"[PLACEHOLDER] Population for {module} is not implemented yet."))

        self.stdout.write(self.style.SUCCESS("Done."))

    # ---------------------------
    # Utility helpers
    # ---------------------------
    def get_user_by_role(self, role_type):
        """
        Try to fetch a user assigned the given role_type.
        1. If UserRole model exists, query via it.
        2. Else, try Role model and find a user with matching username or reporting.
        Returns first matching User instance or None.
        """
        # 1. If UserRole exists, query it
        if UserRole is not None:
            try:
                ur_qs = UserRole.objects.filter(role__role_type=role_type)
                if ur_qs.exists():
                    user = ur_qs.first().user
                    return user
            except Exception:
                # ignore and continue to heuristics
                pass

        # 2. If Role model exists, find users linked to that role via some relation (best-effort)
        if Role is not None:
            try:
                role_obj = Role.objects.filter(role_type=role_type).first()
                if role_obj is not None:
                    # attempt to find user(s) with role relation backref if available
                    # Common patterns: role.users, users with role field, user.role
                    users = User.objects.filter(role__pk=role_obj.pk) if hasattr(User, "role") else None
                    if users and users.exists():
                        return users.first()
            except Exception:
                pass

        # 3. Heuristics by username (common known usernames from your dump)
        try:
            if role_type == "chro":
                user = User.objects.filter(username__iexact="ramakant").first()
                if user:
                    return user
            if role_type == "ceo":
                user = User.objects.filter(username__iexact="CEO").first()
                if user:
                    return user
            if role_type == "manager":
                # Prefer a user with explicit manager role; else who is reporting_manager for others
                user = User.objects.filter(username__iexact="Ramesh").first()
                if user:
                    return user
        except Exception:
            pass

        # No user found
        return None

    def get_city_category(self, name):
        """
        Try to fetch CityCategoriesMaster by name 'A'/'B'/'C'. Return None if missing.
        """
        try:
            from apps.master_data.models.geography import CityCategoriesMaster
            return CityCategoriesMaster.objects.filter(name__iexact=name).first()
        except Exception:
            return None

    # ---------------------------
    # 1) Travel modes + suboptions
    # ---------------------------
    @transaction.atomic
    def populate_travel_modes_and_suboptions(self):
        """
        Populate TravelModeMaster and TravelSubOptionMaster using the client's policy (document).
        Idempotent: uses get_or_create
        """
        self.stdout.write(self.style.NOTICE("Populating Travel Modes and Sub-Options..."))
        # travel modes (based on policy)
        travel_modes = [
            {"name": "Flight", "description": "Air travel"},
            {"name": "Train", "description": "Rail travel"},
            {"name": "Pick-up and Drop", "description": "Pickup and drop between residence/hotel and station/airport"},
            {"name": "Radio Taxi", "description": "App-based taxi services"},
            {"name": "Car at Disposal", "description": "Company arranged car at disposal"},
            {"name": "Own Car", "description": "Employee's own car travel"},
            {"name": "Accommodation", "description": "Guest house / company tied hotels / self stay"},
        ]

        created_modes = []
        for idx, m in enumerate(travel_modes, start=1):
            tm_obj, created = TravelModeMaster.objects.update_or_create(
                name=m["name"],
                defaults={"description": m["description"], "is_active": True},
            )
            created_modes.append(tm_obj)
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} TravelMode: {tm_obj.name}"))

        # sub-options by mode
        suboptions_map = {
            "Flight": ["Economy Class"],
            "Train": ["1st AC", "2nd AC"],
            "Car at Disposal": ["Company Arranged Car", "Car at Disposal"],
            "Pick-up and Drop": ["Pick-up/Drop Only"],
            "Radio Taxi": ["Radio Taxi"],
            "Own Car": ["Own Car"],
            "Accommodation": ["Guest House", "Company-tied Hotel", "Self-arranged Stay"],
        }

        for mode_name, sublist in suboptions_map.items():
            mode = TravelModeMaster.objects.filter(name=mode_name).first()
            if not mode:
                self.stdout.write(self.style.WARNING(f"TravelMode '{mode_name}' not found; skipping its sub-options."))
                continue
            for sname in sublist:
                sub_obj, created = TravelSubOptionMaster.objects.update_or_create(
                    mode=mode,
                    name=sname,
                    defaults={"description": f"{sname} for mode {mode_name}", "is_active": True},
                )
                self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} SubOption: {mode_name} - {sname}"))

        self.stdout.write(self.style.SUCCESS("Travel modes & sub-options populated."))

    # ---------------------------
    # 2) Grade Master
    # ---------------------------
    @transaction.atomic
    def populate_grade_master(self):
        """
        Create grades used in policy: B-2A, B-2B, B-3, B-4A, B-4B
        """
        self.stdout.write(self.style.NOTICE("Populating GradeMaster..."))
        grades = [
            {"name": "B-2A", "sorting_no": 1},
            {"name": "B-2B", "sorting_no": 2},
            {"name": "B-3", "sorting_no": 3},
            {"name": "B-4A", "sorting_no": 4},
            {"name": "B-4B", "sorting_no": 5},
        ]
        for g in grades:
            gm, created = GradeMaster.objects.update_or_create(
                name=g["name"],
                defaults={"sorting_no": g["sorting_no"], "is_active": True},
            )
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} Grade: {gm.name}"))
        self.stdout.write(self.style.SUCCESS("Grades populated."))

    # ---------------------------
    # 3) Grade Entitlements
    # ---------------------------
    @transaction.atomic
    def populate_grade_entitlements(self):
        """
        Create grade entitlements using policy tables:
         - Accommodation entitlement per day (Category A/B)
         - Train class entitlement
         - Air entitlement
         - Stay-with-friends allowance
        City category link is attempted (A/B) but script will skip or set null if not found.
        """
        self.stdout.write(self.style.NOTICE("Populating Grade Entitlements..."))

        # Ensure grades and suboptions exist
        grades_map = {g.name: g for g in GradeMaster.objects.all()}
        sub_map = {}
        for so in TravelSubOptionMaster.objects.select_related("mode").all():
            sub_map[f"{so.mode.name}::{so.name}"] = so

        # find city categories if available
        catA = self.get_city_category("A")
        catB = self.get_city_category("B")

        # Delete existing entitlements for idempotency
        GradeEntitlementMaster.objects.all().delete()

        # Accommodation per day (Category A / B) (policy table)
        # Using hotel entitlement values from the policy:
        accommodation_entitlements = [
            {"grade": "B-2A", "catA": 7000, "catB": 5000},
            {"grade": "B-2B", "catA": 7000, "catB": 5000},
            {"grade": "B-3", "catA": 6500, "catB": 4000},
            {"grade": "B-4A", "catA": 6500, "catB": 4000},
            {"grade": "B-4B", "catA": 6500, "catB": 4000},
        ]

        created_count = 0
        for row in accommodation_entitlements:
            grade_obj = grades_map.get(row["grade"])
            if not grade_obj:
                self.stdout.write(self.style.WARNING(f"Grade {row['grade']} missing; skipping."))
                continue
            # create entry for Category A
            sub_opt = None
            # For accommodation, sub_option is "Guest House" or "Company-tied Hotel". We'll create for both with same max_amount.
            for accom_sub in ["Guest House", "Company-tied Hotel"]:
                sub_opt = TravelSubOptionMaster.objects.filter(name=accom_sub, mode__name="Accommodation").first()
                ent_obj = GradeEntitlementMaster.objects.create(
                    grade=grade_obj,
                    sub_option=sub_opt,
                    city_category=catA,
                    max_amount=row["catA"],
                    is_allowed=True,
                )
                created_count += 1

                # Category B
                ent_obj_b = GradeEntitlementMaster.objects.create(
                    grade=grade_obj,
                    sub_option=sub_opt,
                    city_category=catB,
                    max_amount=row["catB"],
                    is_allowed=True,
                )
                created_count += 1

        # Train & Air entitlements (train class mapping)
        # Flight: B-2A -> Economy; others Economy as policy mentions lowest fare, but train classes differ
        # Train mapping:
        # B-2A -> 1st AC
        # others -> 2nd AC
        train_1st = TravelSubOptionMaster.objects.filter(mode__name="Train", name__iexact="1st AC").first()
        train_2nd = TravelSubOptionMaster.objects.filter(mode__name="Train", name__iexact="2nd AC").first()
        flight_economy = TravelSubOptionMaster.objects.filter(mode__name="Flight", name__iexact="Economy Class").first()

        # Create train entitlement rows
        for gname, grade_obj in grades_map.items():
            if gname == "B-2A" and train_1st:
                GradeEntitlementMaster.objects.create(
                    grade=grade_obj,
                    sub_option=train_1st,
                    city_category=None,
                    max_amount=None,
                    is_allowed=True,
                )
                created_count += 1
            elif train_2nd:
                GradeEntitlementMaster.objects.create(
                    grade=grade_obj,
                    sub_option=train_2nd,
                    city_category=None,
                    max_amount=None,
                    is_allowed=True,
                )
                created_count += 1

            # Flight entitlement: create economy for all grades (policy expects economy)
            if flight_economy:
                GradeEntitlementMaster.objects.create(
                    grade=grade_obj,
                    sub_option=flight_economy,
                    city_category=None,
                    is_allowed=True,
                )
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Grade entitlements populated (created {created_count} entries)."))

    # ---------------------------
    # 4) DA / Incidentals
    # ---------------------------
    @transaction.atomic
    def populate_da_incidentals(self):
        """
        Populate DAIncidentalMaster based on policy table:
        For all grades and city categories A/B/C values.
        """
        self.stdout.write(self.style.NOTICE("Populating DA & Incidentals..."))
        DAIncidentalMaster.objects.all().delete()

        grades = {g.name: g for g in GradeMaster.objects.all()}
        catA = self.get_city_category("A")
        catB = self.get_city_category("B")
        catC = self.get_city_category("C")

        # Policy DA table:
        # B-2A, B-2B, B-3, B-4A: A->810/243, B->648/243, C->680/255
        # B-4B: A->729/162, B->648/162, C->680/170
        data_rows = [
            {"grade": "B-2A", "A": (810, 243), "B": (648, 243), "C": (680, 255)},
            {"grade": "B-2B", "A": (810, 243), "B": (648, 243), "C": (680, 255)},
            {"grade": "B-3",  "A": (810, 243), "B": (648, 243), "C": (680, 255)},
            {"grade": "B-4A", "A": (810, 243), "B": (648, 243), "C": (680, 255)},
            {"grade": "B-4B", "A": (729, 162), "B": (648, 162), "C": (680, 170)},
        ]

        count = 0
        for row in data_rows:
            grade_obj = grades.get(row["grade"])
            if not grade_obj:
                self.stdout.write(self.style.WARNING(f"Grade {row['grade']} missing; skipping DA row."))
                continue
            for cat_key, vals in (("A", row["A"]), ("B", row["B"]), ("C", row["C"])):
                city_cat = self.get_city_category(cat_key)
                if not city_cat:
                    # If city category master not present, skip and warn
                    self.stdout.write(self.style.WARNING(f"City category '{cat_key}' missing; skipping DA entry for {row['grade']} {cat_key}."))
                    continue
                da_full, inc_full = vals
                da_half = Decimal(str(da_full)) / 2
                inc_half = Decimal(str(inc_full)) / 2
                DAIncidentalMaster.objects.create(
                    grade=grade_obj,
                    city_category=city_cat,
                    da_full_day=Decimal(str(da_full)),
                    da_half_day=da_half,
                    incidental_full_day=Decimal(str(inc_full)),
                    incidental_half_day=inc_half,
                    stay_allowance_category_a=Decimal("1800") if row["grade"] == "B-2A" else Decimal("1200") if row["grade"] == "B-2B" else Decimal("1000"),
                    stay_allowance_category_b=Decimal("1000") if row["grade"] == "B-2A" else Decimal("800") if row["grade"] == "B-2B" else Decimal("600"),
                    effective_from=timezone.now().date(),
                    is_active=True,
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"DA & Incidentals populated ({count} rows)."))

    # ---------------------------
    # 5) Conveyance Rates
    # ---------------------------
    @transaction.atomic
    def populate_conveyance_rates(self):
        """
        Populate ConveyanceRateMaster per policy:
         - taxi_with_receipt -> requires_receipt True (actuals); rate_per_km left at 0 or null
         - taxi_without_receipt -> 15 / km (self declaration)
         - own_vehicle -> 15 / km (max 150 km rule captured in ApprovalMatrix/Policy)
         - auto_rickshaw / public_transport entries can be added as needed
        """
        self.stdout.write(self.style.NOTICE("Populating Conveyance Rates..."))
        ConveyanceRateMaster.objects.all().delete()
        entries = [
            {
                "conveyance_type": "taxi_with_receipt",
                "rate_per_km": Decimal("0"),  # rate not used because reimbursed on actuals
                "max_distance_per_day": None,
                "requires_receipt": True,
                "max_claim_amount": None,
            },
            {
                "conveyance_type": "taxi_without_receipt",
                "rate_per_km": Decimal("15"),
                "max_distance_per_day": None,
                "requires_receipt": False,
                "max_claim_amount": None,
            },
            {
                "conveyance_type": "own_vehicle",
                "rate_per_km": Decimal("15"),
                "max_distance_per_day": None,
                "requires_receipt": False,
                "max_claim_amount": None,
            },
            {
                "conveyance_type": "auto_rickshaw",
                "rate_per_km": Decimal("0"),
                "max_distance_per_day": None,
                "requires_receipt": False,
                "max_claim_amount": None,
            },
            {
                "conveyance_type": "public_transport",
                "rate_per_km": Decimal("0"),
                "max_distance_per_day": None,
                "requires_receipt": True,
                "max_claim_amount": None,
            },
        ]

        created = 0
        for e in entries:
            obj = ConveyanceRateMaster.objects.create(
                conveyance_type=e["conveyance_type"],
                rate_per_km=e["rate_per_km"],
                max_distance_per_day=e["max_distance_per_day"],
                requires_receipt=e["requires_receipt"],
                max_claim_amount=e["max_claim_amount"],
                effective_from=timezone.now().date(),
                is_active=True,
            )
            created += 1
            self.stdout.write(self.style.SUCCESS(f"Created conveyance: {obj.conveyance_type}"))

        self.stdout.write(self.style.SUCCESS(f"Conveyance rates populated ({created} entries)."))

    # ---------------------------
    # 6) Approval Matrix
    # ---------------------------
    @transaction.atomic
    def populate_approval_matrix(self):
        """
        Populate ApprovalMatrix rules according to policy:
         - flight approval thresholds (self-approve for B-2A/B-2B; manager for lower grades)
         - flight > 10000 requires CHRO (or CEO if CHRO not present)
         - Car at disposal > 5 days requires CHRO approval
         - Train approvals following policy
        This uses safe lookups for travel_mode and grade objects.
        """
        self.stdout.write(self.style.NOTICE("Populating Approval Matrix..."))

        # Clear existing
        ApprovalMatrix.objects.all().delete()

        # Map grades and travel modes
        grades = {g.name: g for g in GradeMaster.objects.all()}
        modes = {m.name: m for m in TravelModeMaster.objects.all()}

        # approvers
        chro_user = self.get_user_by_role("chro")
        ceo_user = self.get_user_by_role("ceo")
        manager_user = self.get_user_by_role("manager")

        if not chro_user:
            self.stdout.write(self.style.WARNING("CHRO user not found; CHRO-required rules will fallback to CEO if available."))

        # Helper to create matrix rows
        def create_matrix(travel_mode_name, grade_name, **kwargs):
            tm = modes.get(travel_mode_name)
            grade_obj = grades.get(grade_name)
            if not tm or not grade_obj:
                self.stdout.write(self.style.WARNING(f"Skipping ApprovalMatrix for {travel_mode_name} / {grade_name} (mode or grade missing)."))
                return None
            defaults = {
                "min_amount": Decimal(kwargs.get("min_amount", 0)),
                "max_amount": Decimal(kwargs.get("max_amount")) if kwargs.get("max_amount") is not None else None,
                "requires_manager": kwargs.get("requires_manager", True),
                "requires_chro": kwargs.get("requires_chro", False),
                "requires_ceo": kwargs.get("requires_ceo", False),
                "flight_above_10k_ceo": kwargs.get("flight_above_10k_ceo", False),
                "manager_can_view": kwargs.get("manager_can_view", True),
                "manager_can_approve": kwargs.get("manager_can_approve", True),
                "advance_booking_required_days": kwargs.get("advance_booking_required_days", 0),
                "distance_limit_km": kwargs.get("distance_limit_km"),
                "requires_chro_for_distance": kwargs.get("requires_chro_for_distance", False),
                "disposal_days_limit": kwargs.get("disposal_days_limit"),
                "requires_chro_for_disposal": kwargs.get("requires_chro_for_disposal", False),
            }
            # Create row
            am = ApprovalMatrix.objects.create(
                travel_mode=tm,
                employee_grade=grade_obj,
                min_amount=defaults["min_amount"],
                max_amount=defaults["max_amount"],
                requires_manager=defaults["requires_manager"],
                requires_chro=defaults["requires_chro"],
                requires_ceo=defaults["requires_ceo"],
                flight_above_10k_ceo=defaults.get("flight_above_10k_ceo", False),
                manager_can_view=defaults["manager_can_view"],
                manager_can_approve=defaults["manager_can_approve"],
                advance_booking_required_days=defaults["advance_booking_required_days"],
                distance_limit_km=defaults["distance_limit_km"],
                requires_chro_for_distance=defaults["requires_chro_for_distance"],
                disposal_days_limit=defaults["disposal_days_limit"],
                requires_chro_for_disposal=defaults["requires_chro_for_disposal"],
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created ApprovalMatrix: {tm.name} - {grade_obj.name}"))
            return am

        # Policy-driven rules (representative rows)
        # FLIGHT rules:
        # B-2A, B-2B => self-approve
        for g in ["B-2A", "B-2B"]:
            create_matrix("Flight", g, requires_manager=False, requires_chro=False, requires_ceo=False, manager_can_approve=False, advance_booking_required_days=7)

        # B-3, B-4A, B-4B => manager approval required
        for g in ["B-3", "B-4A", "B-4B"]:
            create_matrix("Flight", g, requires_manager=True, requires_chro=False, requires_ceo=False, advance_booking_required_days=7)

        # Special rule: Flight above 10000 requires CHRO (or CEO fallback)
        # We'll create an additional matrix entry for each grade with min_amount=10000, requires_chro=True
        for g in ["B-2A", "B-2B", "B-3", "B-4A", "B-4B"]:
            create_matrix("Flight", g, min_amount=10000, max_amount=None, requires_manager=False, requires_chro=True, flight_above_10k_ceo=True)

        # TRAIN rules: B-2A/B-2B/B-3 self-approve; B-4 require manager
        for g in ["B-2A", "B-2B", "B-3"]:
            create_matrix("Train", g, requires_manager=False, requires_chro=False, advance_booking_required_days=3)
        for g in ["B-4A", "B-4B"]:
            create_matrix("Train", g, requires_manager=True, requires_chro=False, advance_booking_required_days=3)

        # PICKUP & DROP / RADIO TAXI: self-approve for most grades
        for mode in ["Pick-up and Drop", "Radio Taxi"]:
            for g in ["B-2A", "B-2B", "B-3", "B-4A", "B-4B"]:
                create_matrix(mode, g, requires_manager=False, requires_chro=False)

        # CAR AT DISPOSAL: B-2A/B-2B self, others manager; >5 days require CHRO
        for g in ["B-2A", "B-2B"]:
            create_matrix("Car at Disposal", g, requires_manager=False, disposal_days_limit=5, requires_chro_for_disposal=True)
        for g in ["B-3", "B-4A", "B-4B"]:
            create_matrix("Car at Disposal", g, requires_manager=True, disposal_days_limit=5, requires_chro_for_disposal=True)

        # OWN CAR rules: allow up to 150 km; above requires CHRO approval
        for g in ["B-2A", "B-2B", "B-3", "B-4A", "B-4B"]:
            create_matrix("Own Car", g, distance_limit_km=Decimal("150"), requires_chro_for_distance=True)

        self.stdout.write(self.style.SUCCESS("Approval matrix populated."))

