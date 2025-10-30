from django.db import models
from decimal import Decimal

class TravelAdvanceRequest(models.Model):
    trip_detail = models.OneToOneField('TripDetails', on_delete=models.CASCADE, related_name='travel_advance')
    air_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    train_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lodging_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    conveyance_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_instruction = models.TextField(blank=True, default='')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_total(self):
        self.total = sum([self.air_fare, self.train_fare, self.lodging_fare, 
                         self.conveyance_fare, self.other_expenses])
        return self.total
    
    def save(self, *args, **kwargs):
        self.calculate_total()
        super().save(*args, **kwargs)