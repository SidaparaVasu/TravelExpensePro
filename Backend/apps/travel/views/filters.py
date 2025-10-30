import django_filters
from apps.travel.models import TravelApplication, TravelApprovalFlow
from django.db.models import Q

class TravelApplicationFilter(django_filters.FilterSet):
    """Advanced filtering for travel applications"""
    
    # Date range filters
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    departure_after = django_filters.DateFilter(field_name='trip_details__departure_date', lookup_expr='gte')
    departure_before = django_filters.DateFilter(field_name='trip_details__departure_date', lookup_expr='lte')
    
    # Status filters
    status = django_filters.MultipleChoiceFilter(choices=TravelApplication.STATUS_CHOICES)
    
    # Amount filters
    min_cost = django_filters.NumberFilter(field_name='estimated_total_cost', lookup_expr='gte')
    max_cost = django_filters.NumberFilter(field_name='estimated_total_cost', lookup_expr='lte')
    
    # Location filters
    from_location = django_filters.NumberFilter(field_name='trip_details__from_location')
    to_location = django_filters.NumberFilter(field_name='trip_details__to_location')
    
    # Search
    search = django_filters.CharFilter(method='search_filter')
    
    class Meta:
        model = TravelApplication
        fields = ['status', 'is_settled']
    
    def search_filter(self, queryset, name, value):
        """Search across multiple fields"""
        return queryset.filter(
            Q(purpose__icontains=value) |
            Q(internal_order__icontains=value) |
            Q(sanction_number__icontains=value) |
            Q(employee__username__icontains=value) |
            Q(employee__first_name__icontains=value) |
            Q(employee__last_name__icontains=value)
        )


class ApprovalFlowFilter(django_filters.FilterSet):
    """Filter for approval flows"""
    
    status = django_filters.MultipleChoiceFilter(choices=TravelApprovalFlow.STATUS_CHOICES)
    approval_level = django_filters.MultipleChoiceFilter(choices=TravelApprovalFlow.APPROVAL_LEVELS)
    
    approved_after = django_filters.DateFilter(field_name='approved_at', lookup_expr='gte')
    approved_before = django_filters.DateFilter(field_name='approved_at', lookup_expr='lte')
    
    class Meta:
        model = TravelApprovalFlow
        fields = ['status', 'approval_level', 'approver', 'can_approve']