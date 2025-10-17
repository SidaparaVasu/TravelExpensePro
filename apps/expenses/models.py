# from django.db import models
# from decimal import Decimal

# class TravelClaim(models.Model):
#     """
#     TA/DA claims linked to approved travel applications
#     """
#     CLAIM_STATUS = [
#         ('draft', 'Draft'),
#         ('submitted', 'Submitted'),
#         ('approved', 'Approved'),
#         ('rejected', 'Rejected'),
#         ('paid', 'Paid'),
#     ]
    
#     travel_application = models.OneToOneField(
#         'travel.TravelApplication',
#         on_delete=models.CASCADE,
#         related_name='travel_claim'
#     )
#     employee = models.ForeignKey(
#         'authentication.User',
#         on_delete=models.CASCADE
#     )
    
#     # Calculated amounts
#     total_da_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     total_incidental_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     total_conveyance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     total_claim_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
#     status = models.CharField(max_length=20, choices=CLAIM_STATUS, default='draft')
    
#     submitted_at = models.DateTimeField(null=True, blank=True)
#     approved_at = models.DateTimeField(null=True, blank=True)
#     approved_by = models.ForeignKey(
#         'authentication.User',
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name='approved_claims'
#     )
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     def calculate_total(self):
#         """Calculate total claim amount"""
#         self.total_claim_amount = (
#             self.total_da_amount + 
#             self.total_incidental_amount + 
#             self.total_conveyance_amount
#         )
#         return self.total_claim_amount

# class ConveyanceClaim(models.Model):
#     """Individual conveyance expense items"""
    
#     travel_claim = models.ForeignKey(TravelClaim, on_delete=models.CASCADE, related_name='conveyance_claims')
#     claim_date = models.DateField()
#     from_location = models.CharField(max_length=200)
#     to_location = models.CharField(max_length=200)
#     conveyance_type = models.CharField(max_length=30)
#     distance_km = models.DecimalField(max_digits=8, decimal_places=2)
#     amount = models.DecimalField(max_digits=8, decimal_places=2)
#     receipt = models.FileField(upload_to='conveyance_receipts/', null=True, blank=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)