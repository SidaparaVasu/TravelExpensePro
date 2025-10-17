from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import admin
from .models.roles import *
from .models.user import *

# Register your models here.
class UserRoleInline(admin.TabularInline):
    model = UserRole
    fk_name = "user"
    extra = 1

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'employee_id', 'get_roles')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'employee_id')
    ordering = ('username',)
    inlines = (UserRoleInline,)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'email', 'employee_id')
        }),
        ('Organizational', {
            'fields': ('department', 'designation', 'grade', 'employee_type', 
                      'company', 'base_location', 'reporting_manager')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    def get_roles(self, obj):
        return ", ".join([ur.role.name for ur in obj.userrole_set.all()])
    get_roles.short_description = 'Roles'

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'role_type', 'dashboard_access', 'is_active')
    list_filter = ('role_type', 'dashboard_access', 'is_active')
    search_fields = ('name',)

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'codename') # removed 'category' for now
    # list_filter = ('category',)
    search_fields = ('name', 'codename')


admin.site.register(UserRole)
admin.site.register(RolePermission)