from django.core.management.base import BaseCommand
from apps.master_data.models import (
    GradeMaster,
    TravelModeMaster,
    TravelSubOptionMaster,
    CityCategoriesMaster,
    GradeEntitlementMaster
)


class Command(BaseCommand):
    help = "Populate Grade Entitlement data explicitly for each grade, sub-option, and city category"

    def handle(self, *args, **kwargs):
        # 1️⃣ Define grades
        grades = [
            ('B-2A', 'Senior Management', 1),
            ('B-2B', 'Middle Management', 2),
            ('B-3', 'Junior Management', 3),
            ('B-4A', 'Senior Executive', 4),
            ('B-4B', 'Executive', 5),
        ]

        # 2️⃣ Travel modes and sub-options
        travel_modes = {
            "Flight": ["Economy Class", "Business Class"],
            "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
            "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
            "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel", "5-Star Hotel"]
        }

        # 3️⃣ City categories
        city_categories = ['A', 'B', 'C']

        # 4️⃣ Grade-based allowed sub-options
        grade_permissions = {
            "B-2A": {"Flight": ["Economy Class", "Business Class"],
                     "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                     "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                     "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel", "5-Star Hotel"]},
            "B-2B": {"Flight": ["Economy Class", "Business Class"],
                     "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                     "Car": ["Own Car", "Company Car", "Taxi", "Rental"],
                     "Accommodation": ["Guest House", "3-Star Hotel", "4-Star Hotel"]},
            "B-3": {"Flight": ["Economy Class"],
                    "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                    "Car": ["Own Car", "Taxi"],
                    "Accommodation": ["Guest House", "3-Star Hotel"]},
            "B-4A": {"Flight": [],
                     "Train": ["Sleeper", "3rd AC", "2nd AC", "1st AC"],
                     "Car": ["Taxi"],
                     "Accommodation": ["Guest House"]},
            "B-4B": {"Flight": [],
                     "Train": ["Sleeper", "3rd AC"],
                     "Car": ["Taxi"],
                     "Accommodation": ["Guest House"]},
        }

        created_count = 0

        # 5️⃣ Create city categories once
        city_objs = {}
        for city_name in city_categories:
            city_obj, _ = CityCategoriesMaster.objects.get_or_create(name=city_name)
            city_objs[city_name] = city_obj

        # 6️⃣ Delete old entitlements to avoid duplicates or “all cities” placeholders
        GradeEntitlementMaster.objects.all().delete()
        self.stdout.write(self.style.WARNING("Deleted all existing GradeEntitlementMaster records."))

        # 7️⃣ Populate entitlements
        for grade_name, grade_desc, sort_order in grades:
            grade_obj, _ = GradeMaster.objects.get_or_create(
                name=grade_name,
                defaults={
                    "description": grade_desc,
                    "sorting_no": sort_order,
                    "is_active": True
                }
            )

            for mode_name, sub_options in travel_modes.items():
                travel_mode_obj, _ = TravelModeMaster.objects.get_or_create(
                    name=mode_name,
                    defaults={"description": mode_name, "is_active": True}
                )

                allowed_subs = grade_permissions.get(grade_name, {}).get(mode_name, [])
                if not allowed_subs:
                    continue  # No sub-options allowed for this grade

                for sub in allowed_subs:
                    sub_obj, _ = TravelSubOptionMaster.objects.get_or_create(
                        mode=travel_mode_obj,
                        name=sub
                    )

                    if mode_name == "Accommodation":
                        # Create one explicit entry per city
                        for city_name, city_obj in city_objs.items():
                            _, created = GradeEntitlementMaster.objects.get_or_create(
                                grade=grade_obj,
                                sub_option=sub_obj,
                                city_category=city_obj,
                                defaults={"is_allowed": True, "max_amount": 0}
                            )
                            if created:
                                created_count += 1
                    else:
                        # For other modes: city_category=None
                        _, created = GradeEntitlementMaster.objects.get_or_create(
                            grade=grade_obj,
                            sub_option=sub_obj,
                            city_category=None,
                            defaults={"is_allowed": True, "max_amount": 0}
                        )
                        if created:
                            created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Successfully created {created_count} explicit GradeEntitlementMaster records."
        ))
