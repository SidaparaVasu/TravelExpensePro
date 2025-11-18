from django.db import models
from django.contrib.auth.models import Permission as DjangoPermission

class Role(models.Model):
    """
    Custom roles for TSF system with dashboard access control
    """
    ROLE_TYPES = [
        ('employee', 'Employee'),
        ('admin', 'Admin'),
        ('travel_desk', 'Travel Desk'),
        ('manager', 'Manager'),
        ('chro', 'CHRO'),
        ('ceo', 'CEO'),
        ('finance', 'Finance Team'),
        ('spoc', 'SPOC'),  # Vehicle booking coordinators
    ]
    
    DASHBOARD_CHOICES = [
        ('employee', 'Employee Dashboard'),
        ('admin', 'Admin Dashboard'),
        ('travel_desk', 'Travel Desk Dashboard'),
    ]
    
    name = models.CharField(max_length=50, unique=True)
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES)
    
    # Instead of static choices, allow ANY dashboard path
    dashboard_access = models.CharField(max_length=50, default='employee')

    # NEW flexible redirect path for each role
    redirect_path = models.CharField(
        max_length=200,
        default='/employee/dashboard',
        help_text="Frontend redirect path after login for users with this role"
    )
    
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_permissions(self):
        """Get all permissions for this role"""
        return self.rolepermission_set.select_related('permission').all()
    

class Permission(models.Model):
    """
    Custom permissions for granular access control
    """
    PERMISSION_CATEGORIES = [
        ('travel', 'Travel Management'),
        ('master_data', 'Master Data'),
        ('user_management', 'User Management'),
        ('reports', 'Reports'),
        ('approvals', 'Approvals'),
        ('expenses', 'Expense Management'),
        ('booking', 'Booking Management'),
    ]
    
    name = models.CharField(max_length=100)
    codename = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=PERMISSION_CATEGORIES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.codename})"
    

class UserRole(models.Model):
    """
    Many-to-many relationship between Users and Roles with additional metadata
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)  # Determines default dashboard
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        'User', 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='role_assignments_made'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'role')
        indexes = [
            models.Index(fields=['user', 'is_primary']),
        ]

    def __str__(self):
        primary = " (Primary)" if self.is_primary else ""
        return f"{self.user.username} - {self.role.name}{primary}"

    def save(self, *args, **kwargs):
        # Ensure only one primary role per user
        if self.is_primary:
            UserRole.objects.filter(user=self.user).update(is_primary=False)
        super().save(*args, **kwargs)
        

class RolePermission(models.Model):
    """
    Many-to-many relationship between Roles and Permissions
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='rolepermission')
    granted_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} has {self.permission.name}"