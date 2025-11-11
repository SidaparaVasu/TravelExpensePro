from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import *
from django.contrib.auth import get_user_model
from apps.master_data.models.geography import LocationMaster


User = get_user_model()


class RegisterUserSerializer(serializers.ModelSerializer):
    """
    User registration with enhanced validation
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'password2', 
            'first_name', 'last_name', 'email', 'employee_id'
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'employee_id': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        try:
            user = User.objects.create_user(**validated_data)
            return user
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})

class LoginSerializer(serializers.Serializer):
    """
    Login validation
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get("username")
        password = data.get("password")
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user and user.is_active:
                data['user'] = user
                return data
            else:
                raise serializers.ValidationError("Invalid credentials or inactive user.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")


# User serializers
class UserSerializer(serializers.ModelSerializer):
    base_location = serializers.PrimaryKeyRelatedField(
        queryset=LocationMaster.objects.all(),
        required=False,
        allow_null=True
    )
    base_location_name = serializers.CharField(
        source='base_location.location_name', read_only=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'first_name', 'last_name', 'email',
            'reporting_manager', 'department', 'designation', 'employee_type',
            'company', 'grade', 'base_location', 'base_location_name',
            'user_permissions', 'is_active'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='company.name', read_only=True)
    base_location_name = serializers.CharField(source='base_location.location_name', read_only=True)
    reporting_manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'first_name', 'last_name', 'email',
            'department', 'department_name', 'designation', 'designation_name',
            'company', 'company_name', 'base_location', 'base_location_name',
            'reporting_manager', 'reporting_manager_name', 'is_active'
        ]

    def get_department_name(self, obj):
        return obj.department.dept_name if obj.department else None

    def get_designation_name(self, obj):
        return obj.designation.designation_name if obj.designation else None

    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}"
        return None
    

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users with password"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'email', 'reporting_manager',
            'department', 'designation', 'employee_type', 'company', 
            'grade', 'base_location', 'is_active'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
    

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users (without password)"""
    
    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'first_name', 'last_name', 'email',
            'reporting_manager', 'department', 'designation', 'employee_type',
            'company', 'grade', 'base_location', 'is_active'
        ]
    
    def validate_username(self, value):
        # Ensure username is unique excluding current instance
        if self.instance:
            if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
                raise serializers.ValidationError("Username already exists.")
        return value
    

class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all related data"""
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    employee_type_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='company.name', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    base_location_name = serializers.CharField(source='base_location.location_name', read_only=True)
    reporting_manager_details = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'first_name', 'last_name', 'email',
            'department', 'department_name', 'designation', 'designation_name',
            'employee_type', 'employee_type_name', 'company', 'company_name',
            'grade', 'grade_name', 'base_location', 'base_location_name',
            'reporting_manager', 'reporting_manager_details', 'is_active',
            'date_joined', 'last_login'
        ]

    def get_department_name(self, obj):
        return obj.department.dept_name if obj.department else None

    def get_designation_name(self, obj):
        return obj.designation.designation_name if obj.designation else None

    def get_employee_type_name(self, obj):
        return obj.employee_type.type if obj.employee_type else None

    def get_reporting_manager_details(self, obj):
        if obj.reporting_manager:
            return {
                'id': obj.reporting_manager.id,
                'name': f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}",
                'employee_id': obj.reporting_manager.employee_id
            }
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Detailed user profile with organizational information
    """
    roles = serializers.SerializerMethodField()
    grade = serializers.CharField(source="grade.name", read_only=True)
    employee_type = serializers.CharField(source="employee_type.type", read_only=True)
    company = serializers.CharField(source="company.name", read_only=True)
    department = serializers.CharField(source="department.dept_name", read_only=True)
    designation = serializers.CharField(source="designation.designation_name", read_only=True)
    base_location = serializers.CharField(source="base_location.location_name", read_only=True)
    reporting_manager = serializers.CharField(source="reporting_manager.username", read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'employee_id',
            'roles', 'department', 'designation', 'grade', 'employee_type', 
            'company', 'base_location', 'reporting_manager'
        )

    def get_roles(self, obj):
        return [
            {
                'name': ur.role.name,
                'dashboard': ur.role.dashboard_access,
                'is_primary': ur.is_primary
            }
            for ur in obj.userrole_set.select_related('role').all()
        ]

class SwitchRoleSerializer(serializers.Serializer):
    """
    Role switching validation
    """
    role_name = serializers.CharField(max_length=50)

class RoleSerializer(serializers.ModelSerializer):
    """
    Role management serializer
    """
    class Meta:
        model = Role
        fields = ['id', 'name', 'role_type', 'dashboard_access', 'is_active', 'description']

class PermissionSerializer(serializers.ModelSerializer):
    """
    Permission management serializer
    """
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'category', 'description']


# Add these to your existing serializers.py

class UserRoleAssignmentSerializer(serializers.Serializer):
    """
    Serializer for assigning/removing roles from users
    """
    user_id = serializers.IntegerField()
    role_name = serializers.CharField(max_length=50)
    is_primary = serializers.BooleanField(default=False)
    action = serializers.ChoiceField(choices=['assign', 'remove'])

class RoleDetailSerializer(serializers.ModelSerializer):
    """
    Detailed role serializer with permissions
    """
    permissions = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'role_type', 'dashboard_access', 'is_active', 
            'description', 'permissions', 'user_count', 'created_at', 'updated_at'
        ]
    
    def get_permissions(self, obj):
        return [
            {
                'id': rp.permission.id,
                'name': rp.permission.name,
                'codename': rp.permission.codename,
                'category': rp.permission.category
            }
            for rp in obj.rolepermission_set.select_related('permission').all()
        ]
    
    def get_user_count(self, obj):
        return obj.userrole_set.filter(is_active=True).count()


class RoleSerializer(serializers.ModelSerializer):
    """
    Enhanced role management serializer
    """
    permissions = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Permission.objects.all(),
        source='rolepermission_set',
        required=False
    )
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'role_type', 'dashboard_access', 'is_active', 
            'description', 'permissions'
        ]
    
    def create(self, validated_data):
        permissions_data = validated_data.pop('rolepermission_set', [])
        role = Role.objects.create(**validated_data)
        
        # Assign permissions to role
        for permission in permissions_data:
            RolePermission.objects.create(role=role, permission=permission)
        
        return role
    
    def update(self, instance, validated_data):
        permissions_data = validated_data.pop('rolepermission_set', None)
        
        # Update role fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update permissions if provided
        if permissions_data is not None:
            # Clear existing permissions
            instance.rolepermission_set.all().delete()
            # Add new permissions
            for permission in permissions_data:
                RolePermission.objects.create(role=instance, permission=permission)
        
        return instance