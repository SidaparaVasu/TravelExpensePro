from django.core.management.base import BaseCommand
from django.db import transaction
from apps.master_data.models import (
    GradeMaster,
    TravelModeMaster,
    TravelSubOptionMaster,
    CityCategoriesMaster,
    GradeEntitlementMaster
)


class Command(BaseCommand):
    help = (
        "Populate Grade Entitlement data.\n"
        "Use --mode=client for TSF-like rules (stricter, with limits).\n"
        "Use --mode=full for current behavior (broad entitlements for testing)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--mode",
            choices=["client", "full"],
            default="client",
            help="Entitlement mode: 'client' (TSF-style) or 'full' (old behavior for testing).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            default=True,
            help="If set (default), all existing GradeEntitlementMaster rows are deleted before repopulating.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        mode = options["mode"]
        reset = options["reset"]

        self.stdout.write(self.style.WARNING(f"Running Grade Entitlement populate in MODE = {mode}"))

        # 1️⃣ Define grades (shared for both modes)
        grades = [
            ("B-2A", "Senior Management", 1),
            ("B-2B", "Middle Management", 2),
            ("B-3", "Junior Management", 3),
            ("B-4A", "Senior Executive", 4),
            ("B-4B", "Executive", 5),
        ]

        # 2️⃣ Travel modes and sub-options (base catalogue)
        travel_modes = {
            "Flight": ["Economy Class", "Business Class"],
            "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
            "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
            "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel", "5-Star Hotel"],
        }

        # 3️⃣ City categories
        city_categories = ["A", "B", "C"]

        # 4️⃣ FULL MODE: Your current broad entitlements (as in old script)
        full_grade_permissions = {
            "B-2A": {
                "Flight": ["Economy Class", "Business Class"],
                "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel", "5-Star Hotel"],
            },
            "B-2B": {
                "Flight": ["Economy Class", "Business Class"],
                "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel"],
            },
            "B-3": {
                "Flight": ["Economy Class"],
                "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                "Accommodation": ["Guest House", "3-Star Hotel"],
            },
            "B-4A": {
                "Flight": [],
                "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                "Car": ["Taxi"],
                "Accommodation": ["Guest House"],
            },
            "B-4B": {
                "Flight": [],
                "Train": ["Sleeper", "3rd AC"],
                "Car": ["Taxi"],
                "Accommodation": ["Guest House"],
            },
        }

        # 5️⃣ CLIENT MODE: TSF-style inferred entitlements (stricter + max_amounts)
        #    This is based on our consolidated understanding of the client's rules.
        client_grade_permissions = {
            "B-2A": {
                "Flight": ["Economy Class", "Business Class"],
                "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel", "5-Star Hotel"],
            },
            "B-2B": {
                "Flight": ["Economy Class"],  # No business
                "Train": ["Sleeper", "3rd AC", "2nd AC"],
                "Car": ["Own Car", "Taxi"],
                "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel"],
            },
            "B-3": {
                "Flight": ["Economy Class"],
                "Train": ["Sleeper", "3rd AC", "2nd AC"],
                "Car": ["Own Car", "Taxi"],
                "Accommodation": ["Guest House", "3-Star Hotel"],
            },
            "B-4A": {
                "Flight": [],  # No flight
                "Train": ["Sleeper", "3rd AC", "2nd AC"],
                "Car": ["Taxi"],
                "Accommodation": ["Guest House"],
            },
            "B-4B": {
                "Flight": [],  # No flight
                "Train": ["Sleeper", "3rd AC"],  # No 2AC/1AC
                "Car": ["Taxi"],
                "Accommodation": ["Guest House"],
            },
        }

        # Max entitlement per grade/mode (TSF-ish; tweak as needed)
        client_max_amounts = {
            "Flight": {
                "B-2A": 12000,
                "B-2B": 10000,
                "B-3": 8000,
                "B-4A": 0,
                "B-4B": 0,
            },
            "Train": {
                "B-2A": 6000,
                "B-2B": 5000,
                "B-3": 4000,
                "B-4A": 3000,
                "B-4B": 2500,
            },
            "Car": {
                "B-2A": 5000,
                "B-2B": 4000,
                "B-3": 3000,
                "B-4A": 2000,
                "B-4B": 1500,
            },
            # Accommodation often handled via DA and stay rules; keep 0 = "no fixed cap"
            "Accommodation": {
                "B-2A": 0,
                "B-2B": 0,
                "B-3": 0,
                "B-4A": 0,
                "B-4B": 0,
            },
        }

        # Select which permission matrix & max amounts to use
        if mode == "client":
            grade_permissions = client_grade_permissions
            max_amounts = client_max_amounts
            self.stdout.write(self.style.WARNING("Using CLIENT (TSF-style) entitlement matrix."))
        else:
            grade_permissions = full_grade_permissions
            # In full mode, treat everything as allowed with 0 = unlimited / not enforced
            max_amounts = {m: {g[0]: 0 for g in grades} for m in travel_modes.keys()}
            self.stdout.write(self.style.WARNING("Using FULL (broad test) entitlement matrix."))

        # 6️⃣ Optionally clear old entitlements
        if reset:
            deleted = GradeEntitlementMaster.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f"Deleted existing GradeEntitlementMaster records: {deleted[0]}"
                )
            )

        # 7️⃣ Ensure city categories exist
        city_objs = {}
        for city_name in city_categories:
            city_obj, _ = CityCategoriesMaster.objects.get_or_create(name=city_name)
            city_objs[city_name] = city_obj

        created_count = 0

        # 8️⃣ Populate entitlements
        for grade_name, grade_desc, sort_order in grades:
            grade_obj, _ = GradeMaster.objects.get_or_create(
                name=grade_name,
                defaults={
                    "description": grade_desc,
                    "sorting_no": sort_order,
                    "is_active": True,
                },
            )

            for mode_name, sub_options in travel_modes.items():
                # Ensure mode exists
                travel_mode_obj, _ = TravelModeMaster.objects.get_or_create(
                    name=mode_name,
                    defaults={"description": mode_name, "is_active": True},
                )

                allowed_subs = grade_permissions.get(grade_name, {}).get(mode_name, [])
                if not allowed_subs:
                    continue  # No sub-options allowed for this grade + mode

                # Determine max amount per mode/grade
                mode_caps = max_amounts.get(mode_name, {})
                grade_cap = mode_caps.get(grade_name, 0)

                for sub in allowed_subs:
                    # Ensure sub-option exists
                    sub_obj, _ = TravelSubOptionMaster.objects.get_or_create(
                        mode=travel_mode_obj,
                        name=sub,
                        defaults={"description": sub},
                    )

                    # For simplicity: same entitlement for all city categories
                    for city_name, city_obj in city_objs.items():
                        _, created = GradeEntitlementMaster.objects.get_or_create(
                            grade=grade_obj,
                            sub_option=sub_obj,
                            city_category=city_obj,
                            defaults={
                                "is_allowed": True,
                                "max_amount": grade_cap,
                            },
                        )
                        if created:
                            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Successfully created/updated GradeEntitlementMaster records in MODE={mode}. "
                f"New records created: {created_count}"
            )
        )
