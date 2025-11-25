from django.core.management.base import BaseCommand
from apps.authentication.models import User, OrganizationalProfile, UserRole, Role
from apps.master_data.models import GradeMaster


class Command(BaseCommand):
    help = (
        "Synchronize existing organizational users to prepare environment "
        "for automated travel module testing. "
        "Does NOT create users — only updates reporting managers, roles, and grade sync."
    )

    def handle(self, *args, **options):

        self.stdout.write(self.style.WARNING("🔍 Scanning existing users..."))

        # ---------------------------------------------------------
        # 1. Identify key users based on grade + username patterns
        # ---------------------------------------------------------

        def find_user_by_grade(grade_id):
            return User.objects.filter(grade_id=grade_id).first()

        def find_user_by_username(prefix):
            return User.objects.filter(username__icontains=prefix).first()

        KEY_USERS = {
            "CEO": find_user_by_username("ceo"),
            "CHRO": find_user_by_username("chro"),
            "MANAGER": find_user_by_username("manager"),
            "TRAVEL_DESK": find_user_by_username("td.executive"),
            "B4B": find_user_by_grade(5),
            "B4A": find_user_by_grade(4),
            "B3": find_user_by_grade(3),
            "B2B": find_user_by_grade(2),
            "B2A": find_user_by_grade(1),
        }

        self.stdout.write(self.style.SUCCESS("✅ Users detected:"))
        for key, usr in KEY_USERS.items():
            self.stdout.write(f" - {key}: {usr.username if usr else '❌ NOT FOUND'}")

        # ---------------------------------------------------------
        # 2. Assign reporting managers to all employees
        # ---------------------------------------------------------

        manager_user = KEY_USERS["MANAGER"]

        if not manager_user:
            self.stdout.write(self.style.ERROR("❌ Manager user not found — cannot continue"))
            return

        for key in ["B4B", "B4A", "B3", "B2B", "B2A"]:
            user = KEY_USERS.get(key)
            if not user:
                continue

            profile = user.organizational_profile

            if profile.reporting_manager_id != manager_user.id:
                profile.reporting_manager = manager_user
                profile.save()
                self.stdout.write(self.style.SUCCESS(f"✅ Reporting Manager set for {user.username}"))
            else:
                self.stdout.write(self.style.NOTICE(f"✔ Reporting Manager already set for {user.username}"))

        # ---------------------------------------------------------
        # 3. Assign Roles (CEO, CHRO, Manager)
        # ---------------------------------------------------------

        role_assignments = {
            "CEO": KEY_USERS["CEO"],
            "CHRO": KEY_USERS["CHRO"],
            "Manager": manager_user,
        }

        for role_name, user in role_assignments.items():
            if not user:
                self.stdout.write(self.style.WARNING(f"⚠ Role '{role_name}' user missing — skipping"))
                continue

            role, _ = Role.objects.get_or_create(name=role_name)
            ur, created = UserRole.objects.get_or_create(user=user, role=role, is_active=True)

            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Role '{role_name}' assigned to {user.username}"))
            else:
                self.stdout.write(self.style.NOTICE(f"✔ Role '{role_name}' already assigned to {user.username}"))

        # ---------------------------------------------------------
        # 4. Ensure User.grade matches OrganizationalProfile.grade
        # ---------------------------------------------------------

        for key, user in KEY_USERS.items():
            if not user:
                continue

            profile = user.organizational_profile

            if profile.grade_id and user.grade_id != profile.grade_id:
                user.grade_id = profile.grade_id
                user.save(update_fields=["grade"])
                self.stdout.write(self.style.SUCCESS(f"✅ Grade synced for {user.username}"))
            else:
                self.stdout.write(self.style.NOTICE(f"✔ Grade already correct for {user.username}"))

        self.stdout.write(self.style.SUCCESS("\n🎯 Setup complete — users are now aligned for test execution"))
