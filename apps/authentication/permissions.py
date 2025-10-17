from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Permission for admin dashboard users only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_access_dashboard('admin')
        )

class IsEmployee(BasePermission):
    """
    Permission for employee dashboard users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_access_dashboard('employee')
        )

# To see owen travel application / reporting manager or current approver can see only
class IsOwnerOrApprover(BasePermission):
    """
    Only the user who created the application or the current approver can access it
    """
    def has_object_permission(self, request, view, obj):
        return obj.employee == request.user or obj.current_approver == request.user
    
class HasCustomPermission(BasePermission):
    """
    Check custom permission by codename
    Usage: Set permission_required = 'permission_codename' on view
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        required_permission = getattr(view, 'permission_required', None)
        if not required_permission:
            return False
        
        user_permissions = request.user.get_user_permissions_list()
        return required_permission in user_permissions