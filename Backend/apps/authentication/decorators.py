from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import PermissionDenied

def require_permission(permission_codename):
    """
    Decorator to require specific permission for view
    
    Usage:
        @require_permission('travel_request_create')
        def post(self, request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response({
                    'success': False,
                    'message': 'Authentication required',
                    'data': None,
                    'errors': {'detail': 'You must be logged in to access this resource'}
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user has required permission
            user_permissions = request.user.get_user_permissions_list()
            
            if permission_codename not in user_permissions:
                return Response({
                    'success': False,
                    'message': 'Permission denied',
                    'data': None,
                    'errors': {
                        'detail': f'You do not have permission to perform this action',
                        'required_permission': permission_codename
                    }
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(self, request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_role(*role_names):
    """
    Decorator to require specific role(s) for view
    
    Usage:
        @require_role('Admin', 'Travel Desk')
        def get(self, request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response({
                    'success': False,
                    'message': 'Authentication required',
                    'data': None,
                    'errors': {'detail': 'You must be logged in'}
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user has any of the required roles
            user_roles = [role.name for role in request.user.get_all_roles()]
            
            if not any(role in user_roles for role in role_names):
                return Response({
                    'success': False,
                    'message': 'Role access denied',
                    'data': None,
                    'errors': {
                        'detail': f'This action requires one of these roles: {", ".join(role_names)}',
                        'your_roles': user_roles
                    }
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(self, request, *args, **kwargs)
        
        return wrapper
    return decorator