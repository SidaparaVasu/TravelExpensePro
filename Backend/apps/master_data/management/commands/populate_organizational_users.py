from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.master_data.models import (
    CompanyInformation,
    DepartmentMaster,
    DesignationMaster,
    EmployeeTypeMaster,
    GradeMaster,
    LocationMaster
)

from apps.authentication.models.profiles import OrganizationalProfile


User = get_user_model()


class Command(BaseCommand):
    help = "Populate organizational users and their OrganizationalProfile entries"

    @transaction.atomic
    def handle(self, *args, **kwargs):

        self.stdout.write(self.style.MIGRATE_HEADING("Populating Organizational Users..."))

        # 1. Fetch master data
        company = CompanyInformation.objects.get(name="Tata Steel Foundation")

        # Departments
        dept_ops = DepartmentMaster.objects.get(dept_code="OPS")
        dept_td = DepartmentMaster.objects.get(dept_code="TD")
        dept_hr = DepartmentMaster.objects.get(dept_code="HR")
        dept_acc = DepartmentMaster.objects.get(dept_code="ACC")
        dept_sc = DepartmentMaster.objects.get(dept_code="SC")
        dept_wp = DepartmentMaster.objects.get(dept_code="WP")

        # Designations
        desig_ceo = DesignationMaster.objects.get(designation_code="CEO")
        desig_chro = DesignationMaster.objects.get(designation_code="CHRO")
        desig_dh = DesignationMaster.objects.get(designation_code="DH")
        desig_rm = DesignationMaster.objects.get(designation_code="RM")
        desig_tdm = DesignationMaster.objects.get(designation_code="TDM")
        desig_tde = DesignationMaster.objects.get(designation_code="TDE")
        desig_ao = DesignationMaster.objects.get(designation_code="AO")
        desig_sce = DesignationMaster.objects.get(designation_code="SCE")
        desig_wpa = DesignationMaster.objects.get(designation_code="WPA")

        # Employee type
        emp_onroll = EmployeeTypeMaster.objects.get(type="Permanent")

        # Grades (already populated)
        grade_b2a = GradeMaster.objects.get(name="B-2A")
        grade_b2b = GradeMaster.objects.get(name="B-2B")
        grade_b3 = GradeMaster.objects.get(name="B-3")
        grade_b4a = GradeMaster.objects.get(name="B-4A")
        grade_b4b = GradeMaster.objects.get(name="B-4B")

        # Locations
        loc_jsr = LocationMaster.objects.get(location_code="TSF-JSR")
        loc_kln = LocationMaster.objects.get(location_code="TSF-KLN")
        loc_rnc = LocationMaster.objects.get(location_code="TSF-RNC")
        loc_kol = LocationMaster.objects.get(location_code="TSF-KOL")
        loc_bbsr = LocationMaster.objects.get(location_code="TSF-BBSR")

        # User definitions ----------------------------------------------------
        USERS = [
            {
                "username": "ceo.tsf",
                "email": "ceo@tsf.org",
                "first_name": "TSF",
                "last_name": "CEO",
                "designation": desig_ceo,
                "department": dept_hr,
                "location": loc_jsr,
                "grade": grade_b2a,
                "employee_id": "TSF-CEO-001",
                "reporting": None,
            },
            {
                "username": "chro.tsf",
                "email": "chro@tsf.org",
                "first_name": "TSF",
                "last_name": "CHRO",
                "designation": desig_chro,
                "department": dept_hr,
                "location": loc_jsr,
                "grade": grade_b2a,
                "employee_id": "TSF-CHRO-001",
                "reporting": None,
            },
            {
                "username": "ops.head",
                "email": "head.ops@tsf.org",
                "first_name": "Operations",
                "last_name": "Head",
                "designation": desig_dh,
                "department": dept_ops,
                "location": loc_jsr,
                "grade": grade_b2b,
                "employee_id": "TSF-OPS-001",
                "reporting": None,
            },
            {
                "username": "manager.tsf",
                "email": "manager@tsf.org",
                "first_name": "Travel",
                "last_name": "Manager",
                "designation": desig_rm,
                "department": dept_ops,
                "location": loc_jsr,
                "grade": grade_b3,
                "employee_id": "TSF-MAN-001",
                "reporting": User.objects.filter(username="ops.head").first(),
            },
            {
                "username": "td.manager",
                "email": "traveldesk.manager@tsf.org",
                "first_name": "Travel Desk",
                "last_name": "Manager",
                "designation": desig_tdm,
                "department": dept_td,
                "location": loc_jsr,
                "grade": grade_b3,
                "employee_id": "TSF-TDM-001",
                "reporting": User.objects.filter(username="manager.tsf").first(),
            },
            {
                "username": "td.executive",
                "email": "traveldesk.executive@tsf.org",
                "first_name": "Travel Desk",
                "last_name": "Executive",
                "designation": desig_tde,
                "department": dept_td,
                "location": loc_jsr,
                "grade": grade_b4a,
                "employee_id": "TSF-TDE-001",
                "reporting": User.objects.filter(username="td.manager").first(),
            },
            {
                "username": "accounts.tsf",
                "email": "accounts@tsf.org",
                "first_name": "Accounts",
                "last_name": "Officer",
                "designation": desig_ao,
                "department": dept_acc,
                "location": loc_jsr,
                "grade": grade_b3,
                "employee_id": "TSF-ACC-001",
                "reporting": User.objects.filter(username="ops.head").first(),
            },
            {
                "username": "supply.tsf",
                "email": "supplychain@tsf.org",
                "first_name": "Supply",
                "last_name": "Chain",
                "designation": desig_sce,
                "department": dept_sc,
                "location": loc_jsr,
                "grade": grade_b3,
                "employee_id": "TSF-SC-001",
                "reporting": User.objects.filter(username="ops.head").first(),
            },
            {
                "username": "workplace.admin",
                "email": "workplace@tsf.org",
                "first_name": "Workplace",
                "last_name": "Admin",
                "designation": desig_wpa,
                "department": dept_wp,
                "location": loc_jsr,
                "grade": grade_b4a,
                "employee_id": "TSF-WP-001",
                "reporting": User.objects.filter(username="manager.tsf").first(),
            },
            {
                "username": "employee.tsf",
                "email": "employee@tsf.org",
                "first_name": "TSF",
                "last_name": "Employee",
                "designation": desig_rm,
                "department": dept_ops,
                "location": loc_rnc,
                "grade": grade_b4b,
                "employee_id": "TSF-EMP-001",
                "reporting": User.objects.filter(username="manager.tsf").first(),
            },
        ]

        # ---------------------------------------------------------------
        # 2. Create Users + Organizational Profiles
        # ---------------------------------------------------------------
        for data in USERS:
            username = data["username"]

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": data["email"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "user_type": "organizational",
                    "gender": "M",
                }
            )

            if created:
                user.set_password("Password@123")
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created User: {username}"))
            else:
                self.stdout.write(self.style.WARNING(f"User already exists: {username}"))

            OrganizationalProfile.objects.update_or_create(
                user=user,
                defaults={
                    "employee_id": data["employee_id"],
                    "company": company,
                    "department": data["department"],
                    "designation": data["designation"],
                    "employee_type": emp_onroll,
                    "grade": data["grade"],
                    "base_location": data["location"],
                    "reporting_manager": data["reporting"],
                }
            )

        self.stdout.write(self.style.SUCCESS("\nOrganizational Users & Profiles populated successfully!"))
