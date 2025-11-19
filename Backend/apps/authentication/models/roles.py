from django.db import models
from django.contrib.auth.models import Permission as DjangoPermission


class Role(models.Model):
    """
    Custom roles for TSF system - Simplified for flexible access control
    """
    name = models.CharField(max_length=50, unique=True)
    role_type = models.CharField(
        max_length=50,
        help_text="Role category (e.g., employee, admin, manager). No fixed choices."
    )
    
    # REMOVED: dashboard_access, redirect_path, DASHBOARD_CHOICES
    # Frontend will handle routing based on role information
    
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name

    def get_permissions(self):
        """Get all permissions for this role"""
        return self.rolepermission_set.select_related('permission').all()


# Keep Permission, UserRole, RolePermission models as they are
# They don't need changes

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
        db_table = 'permissions'

    def __str__(self):
        return f"{self.name} ({self.codename})"


class UserRole(models.Model):
    """
    Many-to-many relationship between Users and Roles with additional metadata
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)  # Determines default role
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
        db_table = 'user_roles'

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
        db_table = 'role_permissions'

    def __str__(self):
        return f"{self.role.name} has {self.permission.name}"