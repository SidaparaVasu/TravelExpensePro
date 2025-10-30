import csv
from django.core.management.base import BaseCommand
from apps.master_data.models import GradeEntitlementMaster


class Command(BaseCommand):
    help = "Export GradeEntitlementMaster data to CSV"

    def handle(self, *args, **kwargs):
        filename = "grade_entitlement_export.csv"

        # Fetch all GradeEntitlementMaster records
        records = GradeEntitlementMaster.objects.select_related(
            'grade', 'sub_option', 'sub_option__mode', 'city_category'
        ).all()

        with open(filename, mode='w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                "Grade",
                "Travel Mode",
                "Sub Option",
                "City Category",
                "Is Allowed",
                "Max Amount"
            ])
            
            # Write data rows
            for rec in records:
                writer.writerow([
                    rec.grade.name,
                    rec.sub_option.mode.name,
                    rec.sub_option.name,
                    rec.city_category.name if rec.city_category else "",
                    rec.is_allowed,
                    rec.max_amount
                ])

        self.stdout.write(self.style.SUCCESS(
            f"✅ Successfully exported {records.count()} records to {filename}"
        ))
