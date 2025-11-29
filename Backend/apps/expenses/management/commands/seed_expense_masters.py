from django.core.management.base import BaseCommand
from apps.expenses.models import ExpenseTypeMaster, ClaimStatusMaster

class Command(BaseCommand):
    help = "Seed expense master data"

    def handle(self, *args, **options):
        statuses = [
            ("draft", "Draft", 1, False),
            ("submitted", "Submitted", 2, False),
            ("manager_pending", "Manager Pending", 3, False),
            ("finance_pending", "Finance Pending", 4, False),
            ("chro_pending", "CHRO Pending", 5, False),
            ("approved", "Approved", 6, True),
            ("rejected", "Rejected", 7, True),
            ("paid", "Paid", 8, True),
            ("closed", "Closed", 9, True),
        ]
        for code, label, seq, term in statuses:
            ClaimStatusMaster.objects.get_or_create(code=code, label=label, sequence=seq, is_terminal=term)

        expense_types = [
            ("taxi", "Taxi", True, False),
            ("auto", "Auto / Local Travel", True, False),
            ("bus", "Bus", True, False),
            ("train", "Train", True, False),
            ("flight", "Flight", True, False),
            ("hotel", "Hotel", True, False),
            ("meal", "Meals", True, False),
            ("fuel", "Fuel", True, False),
            ("toll", "Toll", True, False),
            ("parking", "Parking", True, False),
            ("misc", "Miscellaneous", False, False),
            ("own_car", "Own Car", False, True),
        ]
        for code, name, req_receipt, is_dist in expense_types:
            ExpenseTypeMaster.objects.get_or_create(code=code, name=name, requires_receipt=req_receipt, is_distance_based=is_dist)
        self.stdout.write(self.style.SUCCESS("Expense masters seeded"))
