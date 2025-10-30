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
    
class IsAdminUser(BasePermission):
    """
    Permission for admin dashboard users only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.can_access_dashboard('admin')
    
    message = "Admin access required"

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
    
class IsEmployee(BasePermission):
    """
    Permission for employee dashboard users
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.can_access_dashboard('employee')
    
    message = "Employee access required"

# To see owen travel application / reporting manager or current approver can see only
# class IsOwnerOrApprover(BasePermission):
#     """
#     Only the user who created the application or the current approver can access it
#     """
#     def has_object_permission(self, request, view, obj):
#         return obj.employee == request.user or obj.current_approver == request.user
    

class IsOwnerOrApprover(BasePermission):
    """
    Only the user who created the application or the current approver can access it
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is the owner
        if obj.employee == request.user:
            return True
        
        # Allow if user is an approver in the workflow
        if hasattr(obj, 'approval_flows'):
            is_approver = obj.approval_flows.filter(
                approver=request.user
            ).exists()
            if is_approver:
                return True
        
        # Allow if user has admin/travel desk role
        if request.user.has_role('Admin') or request.user.has_role('Travel Desk'):
            return True
        
        return False
    
    message = "You don't have permission to access this travel application"

# class HasCustomPermission(BasePermission):
#     """
#     Check custom permission by codename
#     Usage: Set permission_required = 'permission_codename' on view
#     """
#     def has_permission(self, request, view):
#         if not request.user or not request.user.is_authenticated:
#             return False
        
#         required_permission = getattr(view, 'permission_required', None)
#         if not required_permission:
#             return False
        
#         user_permissions = request.user.get_user_permissions_list()
#         return required_permission in user_permissions

class HasCustomPermission(BasePermission):
    """
    Check custom permission by codename
    Usage: Set permission_required = 'permission_codename' on view
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required"
            return False
        
        required_permission = getattr(view, 'permission_required', None)
        if not required_permission:
            # If no permission specified, allow (view should define it)
            return True
        
        user_permissions = request.user.get_user_permissions_list()
        has_perm = required_permission in user_permissions
        
        if not has_perm:
            self.message = f"Permission '{required_permission}' required"
        
        return has_perm
    

class IsTravelDesk(BasePermission):
    """Permission for Travel Desk users"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_role('Travel Desk')
    
    message = "Travel Desk access required"


class IsSPOC(BasePermission):
    """Permission for SPOC users"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check if user is assigned as SPOC for any location
        return request.user.locationspoc_set.filter(is_active=True).exists()
    
    message = "SPOC access required"