from django_ratelimit.decorators import ratelimit
from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def api_ratelimit(key='user', rate='100/h', method='ALL'):
    """
    Rate limit decorator for API views
    
    Usage:
        @api_ratelimit(rate='10/m')  # 10 requests per minute
        def post(self, request):
            ...
    """
    def decorator(func):
        @wraps(func)
        @ratelimit(key=key, rate=rate, method=method)
        def wrapper(self, request, *args, **kwargs):
            was_limited = getattr(request, 'limited', False)
            if was_limited:
                return Response({
                    'success': False,
                    'message': 'Rate limit exceeded',
                    'data': None,
                    'errors': {
                        'detail': f'Too many requests. Limit: {rate}'
                    }
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator