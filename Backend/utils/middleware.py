import json
import traceback
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework.exceptions import APIException
from rest_framework import status as http_status

class StandardResponseMiddleware:
    """
    Middleware to standardize all API responses to format:
    {
        "success": true/false,
        "message": "Human readable message",
        "data": {...},
        "errors": {...}
    }
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only process JSON API responses
        if not request.path.startswith('/api/'):
            return response
        
        # Skip documentation-related endpoints (Swagger, Redoc, Schema)
        if request.path.startswith(('/api/docs/', '/api/redoc/', '/api/schema/')):
            return response
        
        # Skip if response is already properly formatted
        if hasattr(response, 'data') and isinstance(response.data, dict):
            if all(key in response.data for key in ['success', 'message']):
                return response
        
        # Wrap response in standard format
        if hasattr(response, 'data'):
            wrapped_data = self._wrap_response(response.data, response.status_code)
            response.data = wrapped_data
            # response.content = json.dumps(wrapped_data).encode('utf-8')
            response.content = json.dumps(wrapped_data, default=str).encode('utf-8')
        
        return response
    
    def _wrap_response(self, data, status_code):
        """Wrap response data in standard format"""
        is_success = 200 <= status_code < 400
        
        # If already in standard format, return as-is
        if isinstance(data, dict) and 'success' in data and 'message' in data:
            return data
        
        # Determine message based on status code
        if is_success:
            message = "Success"
            if isinstance(data, dict) and 'message' in data:
                message = data.pop('message')
        else:
            message = "Error"
            if isinstance(data, dict):
                if 'detail' in data:
                    message = data['detail']
                    data = {'detail': data['detail']}
                elif 'error' in data:
                    message = data['error']
        
        return {
            'success': is_success,
            'message': message,
            'data': data if is_success else None,
            'errors': data if not is_success else None
        }
    
    def process_exception(self, request, exception):
        """Handle exceptions and return standardized error response"""
        if not request.path.startswith('/api/'):
            return None
        
        # Determine status code and error details
        if isinstance(exception, APIException):
            status_code = exception.status_code
            error_detail = exception.detail
        elif isinstance(exception, ValidationError):
            status_code = http_status.HTTP_400_BAD_REQUEST
            error_detail = exception.message_dict if hasattr(exception, 'message_dict') else str(exception)
        else:
            status_code = http_status.HTTP_500_INTERNAL_SERVER_ERROR
            error_detail = str(exception)
            
            # Log unexpected errors
            print(f"❌ Unexpected Error: {exception}")
            traceback.print_exc()
        
        return JsonResponse({
            'success': False,
            'message': 'An error occurred',
            'data': None,
            'errors': error_detail
        }, status=status_code)