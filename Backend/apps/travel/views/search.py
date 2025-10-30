from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum
from utils.response_formatter import success_response
from datetime import datetime

class AdvancedSearchView(APIView):
    """Advanced search with aggregations"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from apps.travel.models import TravelApplication
        
        # Build dynamic query
        queryset = TravelApplication.objects.all()
        
        # Filters
        filters = request.data.get('filters', {})
        
        if 'status' in filters:
            queryset = queryset.filter(status__in=filters['status'])
        
        if 'employee_id' in filters:
            queryset = queryset.filter(employee_id=filters['employee_id'])
        
        if 'department' in filters:
            queryset = queryset.filter(employee__department_id=filters['department'])
        
        if 'date_range' in filters:
            start = filters['date_range'].get('start')
            end = filters['date_range'].get('end')
            if start:
                queryset = queryset.filter(created_at__gte=start)
            if end:
                queryset = queryset.filter(created_at__lte=end)
        
        if 'min_cost' in filters:
            queryset = queryset.filter(estimated_total_cost__gte=filters['min_cost'])
        
        if 'max_cost' in filters:
            queryset = queryset.filter(estimated_total_cost__lte=filters['max_cost'])
        
        # Text search
        if 'search_text' in filters:
            text = filters['search_text']
            queryset = queryset.filter(
                Q(purpose__icontains=text) |
                Q(internal_order__icontains=text) |
                Q(employee__username__icontains=text)
            )
        
        # Aggregations
        stats = queryset.aggregate(
            total_count=Count('id'),
            total_cost=Sum('estimated_total_cost')
        )
        
        # Get results
        results = queryset[:100]  # Limit results
        
        from ..serializers.travel_serializers import TravelApplicationSerializer
        serializer = TravelApplicationSerializer(results, many=True)
        
        return success_response(
            data={
                'results': serializer.data,
                'statistics': {
                    'total_count': stats['total_count'],
                    'total_cost': float(stats['total_cost'] or 0)
                }
            },
            message=f"Found {stats['total_count']} results"
        )