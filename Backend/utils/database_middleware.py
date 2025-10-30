from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class QueryCountMiddleware:
    """Monitor database query count per request"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip in production
        if not settings.DEBUG:
            return self.get_response(request)
        
        # Reset queries
        queries_before = len(connection.queries)
        
        response = self.get_response(request)
        
        queries_after = len(connection.queries)
        query_count = queries_after - queries_before
        
        # Warn if too many queries
        if query_count > 500:
            logger.warning(
                f"⚠️  High query count: {query_count} queries for {request.path}"
            )
        
        return response