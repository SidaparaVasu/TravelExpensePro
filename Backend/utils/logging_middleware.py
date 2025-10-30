import time
import logging
import json

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """Log all API requests and responses"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip non-API requests
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Log request
        start_time = time.time()
        
        logger.info(
            f"➡️  {request.method} {request.path} "
            f"| User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        status_emoji = "✅" if 200 <= response.status_code < 400 else "❌"
        logger.info(
            f"{status_emoji} {request.method} {request.path} "
            f"| Status: {response.status_code} | Duration: {duration:.2f}s"
        )
        
        return response