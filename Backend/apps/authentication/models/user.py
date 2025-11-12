from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from apps.master_data.models import company, geography, grades

class User(AbstractUser):
    """
    Enhanced User model with organizational hierarchy and role management
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other / Non-binary'),
        ('N', 'Prefer not to say'),
    ]

    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        default='N',
        blank=True,
        null=False,
    )

    # Organizational Hierarchy
    reporting_manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='subordinates'
    )
    
    department = models.ForeignKey(company.DepartmentMaster, on_delete=models.SET_NULL, null=True, related_name="users_in_department")
    designation = models.ForeignKey(company.DesignationMaster, on_delete=models.SET_NULL, null=True, related_name="users_in_designation")
    employee_type = models.ForeignKey(company.EmployeeTypeMaster, on_delete=models.SET_NULL, null=True)
    company = models.ForeignKey(company.CompanyInformation, on_delete=models.SET_NULL, null=True)
    grade = models.ForeignKey(grades.GradeMaster, on_delete=models.SET_NULL, null=True)
    base_location = models.ForeignKey(geography.LocationMaster, on_delete=models.SET_NULL, null=True)
    
    # Keep Django's built-in groups for compatibility
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="user_set",
        related_query_name="user",
    )

    def __str__(self):
        return f"{self.username} ({self.employee_id})"
    
    # Multi-role support methods
    def get_primary_role(self):
        """Get user's primary role (determines default dashboard)"""
        primary_role = self.userrole_set.filter(is_primary=True).first()
        return primary_role.role if primary_role else None
    
    def get_all_roles(self):
        """Get all active roles assigned to user"""
        return [ur.role for ur in self.userrole_set.filter(role__is_active=True)]
    
    def has_role(self, role_name):
        """Check if user has specific role"""
        return self.userrole_set.filter(role__name=role_name, role__is_active=True).exists()
    
    def can_access_dashboard(self, dashboard_type):
        """Check if user can access specific dashboard type"""
        user_roles = self.get_all_roles()
        return any(role.dashboard_access == dashboard_type for role in user_roles)
    
    def get_approval_hierarchy(self):
        """Get approval chain for this user's travel requests"""
        hierarchy = []
        
        # Start with reporting manager
        if self.reporting_manager:
            hierarchy.append({
                'approver': self.reporting_manager,
                'level': 'manager',
                'required': True
            })
        
        return hierarchy
    
    def get_user_permissions_list(self):
        """Get all permissions for user across all roles"""
        permissions = set()
        for role in self.get_all_roles():
            role_perms = role.rolepermission_set.values_list('permission__codename', flat=True)
            permissions.update(role_perms)
        return list(permissions)