from django.core.management.base import BaseCommand
from django.db import transaction

from apps.master_data.models import LocationMaster
from apps.master_data.models.accommodation import LocationSPOC
from django.contrib.auth import get_user_model


User = get_user_model()


class Command(BaseCommand):
    help = "Populate Location-wise SPOCs for TSF travel module"

    @transaction.atomic
    def handle(self, *args, **kwargs):

        self.stdout.write(self.style.MIGRATE_HEADING("Populating Location SPOCs..."))

        # Fetch Locations
        loc_jsr = LocationMaster.objects.get(location_code="TSF-JSR")
        loc_kln = LocationMaster.objects.get(location_code="TSF-KLN")
        loc_rnc = LocationMaster.objects.get(location_code="TSF-RNC")
        loc_kol = LocationMaster.objects.get(location_code="TSF-KOL")
        loc_bbsr = LocationMaster.objects.get(location_code="TSF-BBSR")

        # Fetch Users (must exist already)
        u_local_jsr = User.objects.get(username="manager.tsf")            # Local SPOC for JSR
        u_inter_jsr = User.objects.get(username="workplace.admin")        # Inter-Unit SPOC for JSR
        u_both_kln = User.objects.get(username="supply.tsf")              # For KLN both
        u_local_rnc = User.objects.get(username="employee.tsf")           # Basic local SPOC
        u_local_kol = User.objects.get(username="td.manager")             # Kolkata Local SPOC
        u_inter_bbsr = User.objects.get(username="td.executive")          # Inter-unit BBSR SPOC

        # Backups
        bu_jsr_local = User.objects.get(username="td.manager")
        bu_jsr_inter = User.objects.get(username="td.executive")
        bu_kln = User.objects.get(username="manager.tsf")
        bu_rnc = User.objects.get(username="workplace.admin")
        bu_kol = User.objects.get(username="ops.head")
        bu_bbsr = User.objects.get(username="manager.tsf")

        SPOC_DATA = [
            # ---------------------- J A M S H E D P U R -------------------------
            {
                "location": loc_jsr,
                "spoc_user": u_local_jsr,
                "spoc_type": "local",
                "phone": "9876543210",
                "email": "jsr.local.transport@tsf.org",
                "backup": bu_jsr_local,
            },
            {
                "location": loc_jsr,
                "spoc_user": u_inter_jsr,
                "spoc_type": "inter_unit",
                "phone": "9000000001",
                "email": "jsr.interunit@tsf.org",
                "backup": bu_jsr_inter,
            },

            # ---------------------- K A L I N G A N A G A R ----------------------
            {
                "location": loc_kln,
                "spoc_user": u_both_kln,
                "spoc_type": "both",
                "phone": "9000000002",
                "email": "kln.spocteam@tsf.org",
                "backup": bu_kln,
            },

            # ---------------------- R A N C H I ---------------------------------
            {
                "location": loc_rnc,
                "spoc_user": u_local_rnc,
                "spoc_type": "local",
                "phone": "9000000003",
                "email": "rnc.local@tsf.org",
                "backup": bu_rnc,
            },

            # ---------------------- K O L K A T A -------------------------------
            {
                "location": loc_kol,
                "spoc_user": u_local_kol,
                "spoc_type": "local",
                "phone": "9000000004",
                "email": "kol.local@tsf.org",
                "backup": bu_kol,
            },

            # ---------------------- B H U B A N E S W A R ------------------------
            {
                "location": loc_bbsr,
                "spoc_user": u_inter_bbsr,
                "spoc_type": "inter_unit",
                "phone": "9000000005",
                "email": "bbsr.interunit@tsf.org",
                "backup": bu_bbsr,
            },
        ]

        # Insert data
        for data in SPOC_DATA:
            spoc, created = LocationSPOC.objects.update_or_create(
                location=data["location"],
                spoc_user=data["spoc_user"],
                spoc_type=data["spoc_type"],
                defaults={
                    "phone_number": data["phone"],
                    "email": data["email"],
                    "backup_spoc": data["backup"],
                    "is_active": True,
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created SPOC ({data['spoc_type']}): {data['spoc_user'].username} @ {data['location'].location_code}"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Updated SPOC ({data['spoc_type']}): {data['spoc_user'].username} @ {data['location'].location_code}"
                ))

        self.stdout.write(self.style.SUCCESS("\nLocation SPOCs populated successfully!"))
