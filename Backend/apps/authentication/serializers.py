from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import *
from django.contrib.auth import get_user_model
from apps.master_data.models.geography import LocationMaster


User = get_user_model()


'''
NEW SERIALIZERS ACCORDING TO UPDATED USER AND ROLE MODEL
'''

# ============================================================================
# PROFILE SERIALIZERS (NEW)
# ============================================================================

class OrganizationalProfileSerializer(serializers.ModelSerializer):
    """Serializer for organizational user profiles"""
    
    # Nested read-only fields for related objects
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.dept_name', read_only=True)
    designation_name = serializers.CharField(source='designation.designation_name', read_only=True)
    employee_type_name = serializers.CharField(source='employee_type.type', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    base_location_name = serializers.CharField(source='base_location.location_name', read_only=True)
    base_location_details = serializers.SerializerMethodField()
    reporting_manager_details = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationalProfile
        fields = [
            'employee_id',
            'company', 'company_name',
            'department', 'department_name',
            'designation', 'designation_name',
            'employee_type', 'employee_type_name',
            'grade', 'grade_name',
            'base_location', 'base_location_name', 'base_location_details',
            'reporting_manager', 'reporting_manager_details',
        ]
    
    def get_base_location_details(self, obj):
        if obj.base_location:
            return {
                'id': obj.base_location.location_id,
                'name': obj.base_location.location_name,
                'city': obj.base_location.city.city_name,
                'state': obj.base_location.state.state_name,
            }
        return None
    
    def get_reporting_manager_details(self, obj):
        if obj.reporting_manager:
            return {
                'id': obj.reporting_manager.id,
                'username': obj.reporting_manager.username,
                'name': obj.reporting_manager.get_full_name(),
                'email': obj.reporting_manager.email,
            }
        return None


class ExternalProfileSerializer(serializers.ModelSerializer):
    """Serializer for external user profiles"""
    
    profile_type_display = serializers.CharField(source='get_profile_type_display', read_only=True)
    
    class Meta:
        model = ExternalProfile
        fields = [
            'profile_type', 'profile_type_display',
            'organization_name',
            'contact_person',
            'phone',
            'email',
            'address',
            'service_categories',
            'gst_number',
            'pan_number',
            'license_number',
            'is_verified',
            'is_active',
        ]


# ============================================================================
# UPDATED USER SERIALIZERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    department_name = serializers.CharField(source="department.dept_name", read_only=True)
    designation_name = serializers.CharField(source="designation.designation_name", read_only=True)
    employee_type_name = serializers.CharField(source="employee_type.type", read_only=True)
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    base_location_name = serializers.CharField(source="base_location.location_name", read_only=True)
    reporting_manager_name = serializers.SerializerMethodField()

    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}"
        return None

    class Meta:
        model = User
        fields = "__all__"


class UserProfileResponseSerializer(serializers.Serializer):
    """
    Clean response serializer for /auth/profile/
    Separates:
        - user (basic info)
        - roles
        - permissions
        - organizational/external profile
    """

    user = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    def get_user(self, obj):
        return {
            "id": obj.id,
            "username": obj.username,
            "first_name": obj.first_name,
            "last_name": obj.last_name,
            "email": obj.email,
            "gender": obj.gender,
            "user_type": obj.user_type,
        }

    def get_roles(self, obj):
        return [
            {
                "id": ur.role.id,
                "name": ur.role.name,
                "role_type": ur.role.role_type,
                "is_primary": ur.is_primary,
                "description": ur.role.description
            }
            for ur in obj.userrole_set.filter(is_active=True).select_related("role")
        ]

    def get_permissions(self, obj):
        return obj.get_user_permissions_list()

    def get_profile(self, obj):
        if obj.user_type == "organizational":
            profile = getattr(obj, "organizational_profile", None)
            if profile:
                return OrganizationalProfileSerializer(profile).data

        if obj.user_type == "external":
            profile = getattr(obj, "external_profile", None)
            if profile:
                return ExternalProfileSerializer(profile).data

        return None

class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    profile_summary = serializers.SerializerMethodField()
    primary_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'gender', 'employee_id',
            'user_type', 'user_type_display', 'profile_summary', 'primary_role', 'is_active'
        ]
    
    def get_profile_summary(self, obj):
        """Return minimal profile info for list view"""
        if obj.user_type == 'organizational':
            profile = getattr(obj, 'organizational_profile', None)
            if profile:
                return {
                    'type': 'organizational',
                    'employee_id': profile.employee_id,
                    'company': profile.company.name if profile.company else None,
                    'department': profile.department.dept_name if profile.department else None,
                    'designation': profile.designation.designation_name if profile.designation else None,
                }
        elif obj.user_type == 'external':
            profile = getattr(obj, 'external_profile', None)
            if profile:
                return {
                    'type': 'external',
                    'organization_name': profile.organization_name,
                    'profile_type': profile.get_profile_type_display(),
                }
        return None
    
    def get_primary_role(self, obj):
        primary_role = obj.get_primary_role()
        if primary_role:
            return {
                'id': primary_role.id,
                'name': primary_role.name,
                'role_type': primary_role.role_type
            }
        return None


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all related data"""
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    profile = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'gender',
            'user_type', 'user_type_display', 'is_active',
            'date_joined', 'last_login',
            'profile', 'roles', 'permissions'
        ]
    
    def get_profile(self, obj):
        """Return full profile based on user_type"""
        if obj.user_type == 'organizational':
            profile = getattr(obj, 'organizational_profile', None)
            if profile:
                return OrganizationalProfileSerializer(profile).data
        elif obj.user_type == 'external':
            profile = getattr(obj, 'external_profile', None)
            if profile:
                return ExternalProfileSerializer(profile).data
        return None
    
    def get_roles(self, obj):
        return [
            {
                'id': ur.role.id,
                'name': ur.role.name,
                'role_type': ur.role.role_type,
                'is_primary': ur.is_primary,
                'description': ur.role.description
            }
            for ur in obj.userrole_set.filter(is_active=True).select_related('role')
        ]
    
    def get_permissions(self, obj):
        return obj.get_user_permissions_list()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users with profiles"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    # Profile fields (organizational)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    company = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['CompanyInformation']).CompanyInformation.objects.all(),
        required=False, allow_null=True
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['DepartmentMaster']).DepartmentMaster.objects.all(),
        required=False, allow_null=True
    )
    designation = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['DesignationMaster']).DesignationMaster.objects.all(),
        required=False, allow_null=True
    )
    employee_type = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['EmployeeTypeMaster']).EmployeeTypeMaster.objects.all(),
        required=False, allow_null=True
    )
    grade = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.grades', fromlist=['GradeMaster']).GradeMaster.objects.all(),
        required=False, allow_null=True
    )
    base_location = serializers.PrimaryKeyRelatedField(
        queryset=LocationMaster.objects.all(),
        required=False, allow_null=True
    )
    reporting_manager = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False, allow_null=True
    )
    
    # External profile fields
    profile_type = serializers.CharField(required=False)
    organization_name = serializers.CharField(required=False)
    contact_person = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    service_categories = serializers.JSONField(required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'email', 'gender', 'user_type', 'is_active',
            # Organizational profile fields
            'employee_id', 'company', 'department', 'designation',
            'employee_type', 'grade', 'base_location', 'reporting_manager',
            # External profile fields
            'profile_type', 'organization_name', 'contact_person', 'phone', 'service_categories'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove confirm_password
        validated_data.pop('confirm_password')
        
        # Extract profile fields
        profile_fields_org = {
            'employee_id': validated_data.pop('employee_id', None),
            'company': validated_data.pop('company', None),
            'department': validated_data.pop('department', None),
            'designation': validated_data.pop('designation', None),
            'employee_type': validated_data.pop('employee_type', None),
            'grade': validated_data.pop('grade', None),
            'base_location': validated_data.pop('base_location', None),
            'reporting_manager': validated_data.pop('reporting_manager', None),
        }
        
        profile_fields_ext = {
            'profile_type': validated_data.pop('profile_type', 'other'),
            'organization_name': validated_data.pop('organization_name', ''),
            'contact_person': validated_data.pop('contact_person', ''),
            'phone': validated_data.pop('phone', ''),
            'service_categories': validated_data.pop('service_categories', []),
        }
        
        # Create user
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create appropriate profile
        if user.user_type == 'organizational':
            OrganizationalProfile.objects.create(user=user, **profile_fields_org)
        elif user.user_type == 'external':
            ExternalProfile.objects.create(
                user=user,
                email=user.email,  # Copy from user
                **profile_fields_ext
            )
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users (without password)"""
    
    # Profile fields (organizational)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    company = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['CompanyInformation']).CompanyInformation.objects.all(),
        required=False, allow_null=True
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['DepartmentMaster']).DepartmentMaster.objects.all(),
        required=False, allow_null=True
    )
    designation = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['DesignationMaster']).DesignationMaster.objects.all(),
        required=False, allow_null=True
    )
    employee_type = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.company', fromlist=['EmployeeTypeMaster']).EmployeeTypeMaster.objects.all(),
        required=False, allow_null=True
    )
    grade = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.master_data.models.grades', fromlist=['GradeMaster']).GradeMaster.objects.all(),
        required=False, allow_null=True
    )
    base_location = serializers.PrimaryKeyRelatedField(
        queryset=LocationMaster.objects.all(),
        required=False, allow_null=True
    )
    reporting_manager = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False, allow_null=True
    )
    
    # External profile fields
    profile_type = serializers.CharField(required=False)
    organization_name = serializers.CharField(required=False)
    contact_person = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    service_categories = serializers.JSONField(required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'gender', 'user_type', 'is_active',
            # Organizational profile fields
            'employee_id', 'company', 'department', 'designation',
            'employee_type', 'grade', 'base_location', 'reporting_manager',
            # External profile fields
            'profile_type', 'organization_name', 'contact_person', 'phone', 'service_categories'
        ]
    
    def update(self, instance, validated_data):
        # Extract profile fields
        profile_fields_org = {
            'employee_id': validated_data.pop('employee_id', None),
            'company': validated_data.pop('company', None),
            'department': validated_data.pop('department', None),
            'designation': validated_data.pop('designation', None),
            'employee_type': validated_data.pop('employee_type', None),
            'grade': validated_data.pop('grade', None),
            'base_location': validated_data.pop('base_location', None),
            'reporting_manager': validated_data.pop('reporting_manager', None),
        }
        
        profile_fields_ext = {
            'profile_type': validated_data.pop('profile_type', None),
            'organization_name': validated_data.pop('organization_name', None),
            'contact_person': validated_data.pop('contact_person', None),
            'phone': validated_data.pop('phone', None),
            'service_categories': validated_data.pop('service_categories', None),
        }
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile
        if instance.user_type == 'organizational':
            profile = getattr(instance, 'organizational_profile', None)
            if profile:
                for attr, value in profile_fields_org.items():
                    if value is not None:
                        setattr(profile, attr, value)
                profile.save()
        elif instance.user_type == 'external':
            profile = getattr(instance, 'external_profile', None)
            if profile:
                for attr, value in profile_fields_ext.items():
                    if value is not None:
                        setattr(profile, attr, value)
                profile.save()
        
        return instance


# ============================================================================
# KEEP EXISTING SERIALIZERS (Don't remove these)
# ============================================================================

# Keep RegisterUserSerializer, LoginSerializer, SwitchRoleSerializer,
# RoleSerializer, PermissionSerializer, etc. as they were



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


'''
OLD SERIALIZERS
'''
# User serializers
# class UserSerializer(serializers.ModelSerializer):
    # base_location = serializers.PrimaryKeyRelatedField(
    #     queryset=LocationMaster.objects.all(),
    #     required=False,
    #     allow_null=True
    # )
    # base_location_name = serializers.CharField(
    #     source='base_location.location_name', read_only=True
    # )

    # class Meta:
    #     model = User
    #     fields = [
    #         'id', 'employee_id', 'username', 'first_name', 'last_name', 'email', 'gender',
    #         'reporting_manager', 'department', 'designation', 'employee_type',
    #         'company', 'grade', 'base_location', 'base_location_name',
    #         'user_permissions', 'is_active'
    #     ]


# class UserListSerializer(serializers.ModelSerializer):
#     """Lightweight serializer for list views"""
#     department_name = serializers.SerializerMethodField()
#     designation_name = serializers.SerializerMethodField()
#     company_name = serializers.CharField(source='company.name', read_only=True)
#     base_location_name = serializers.CharField(source='base_location.location_name', read_only=True)
#     reporting_manager_name = serializers.SerializerMethodField()
    
#     class Meta:
#         model = User
#         fields = [
#             'id', 'employee_id', 'username', 'first_name', 'last_name', 'email', 'gender',
#             'department', 'department_name', 'designation', 'designation_name',
#             'company', 'company_name', 'base_location', 'base_location_name',
#             'reporting_manager', 'reporting_manager_name', 'is_active'
#         ]

#     def get_department_name(self, obj):
#         return obj.department.dept_name if obj.department else None

#     def get_designation_name(self, obj):
#         return obj.designation.designation_name if obj.designation else None

#     def get_reporting_manager_name(self, obj):
#         if obj.reporting_manager:
#             return f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}"
#         return None
    

# class UserCreateSerializer(serializers.ModelSerializer):
#     """Serializer for creating users with password"""
#     password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     confirm_password = serializers.CharField(write_only=True, required=True)
    
#     class Meta:
#         model = User
#         fields = [
#             'id', 'employee_id', 'username', 'password', 'confirm_password',
#             'first_name', 'last_name', 'email', 'gender', 'reporting_manager',
#             'department', 'designation', 'employee_type', 'company', 
#             'grade', 'base_location', 'is_active'
#         ]
    
#     def validate(self, attrs):
#         if attrs['password'] != attrs['confirm_password']:
#             raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
#         return attrs
    
#     def create(self, validated_data):
#         validated_data.pop('confirm_password')
#         password = validated_data.pop('password')
#         user = User.objects.create(**validated_data)
#         user.set_password(password)
#         user.save()
#         return user
    

# class UserUpdateSerializer(serializers.ModelSerializer):
#     """Serializer for updating users (without password)"""
    
#     class Meta:
#         model = User
#         fields = [
#             'id', 'employee_id', 'username', 'first_name', 'last_name', 'email', 'gender',
#             'reporting_manager', 'department', 'designation', 'employee_type',
#             'company', 'grade', 'base_location', 'is_active'
#         ]
    
#     def validate_username(self, value):
#         # Ensure username is unique excluding current instance
#         if self.instance:
#             if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
#                 raise serializers.ValidationError("Username already exists.")
#         return value
    

# class UserDetailSerializer(serializers.ModelSerializer):
#     """Detailed serializer with all related data"""
#     department_name = serializers.SerializerMethodField()
#     designation_name = serializers.SerializerMethodField()
#     employee_type_name = serializers.SerializerMethodField()
#     company_name = serializers.CharField(source='company.name', read_only=True)
#     grade_name = serializers.CharField(source='grade.name', read_only=True)
#     base_location_name = serializers.CharField(source='base_location.location_name', read_only=True)
#     reporting_manager_details = serializers.SerializerMethodField()
    
#     class Meta:
#         model = User
#         fields = [
#             'id', 'employee_id', 'username', 'first_name', 'last_name', 'email', 'gender',
#             'department', 'department_name', 'designation', 'designation_name',
#             'employee_type', 'employee_type_name', 'company', 'company_name',
#             'grade', 'grade_name', 'base_location', 'base_location_name',
#             'reporting_manager', 'reporting_manager_details', 'is_active',
#             'date_joined', 'last_login'
#         ]

#     def get_department_name(self, obj):
#         return obj.department.dept_name if obj.department else None

#     def get_designation_name(self, obj):
#         return obj.designation.designation_name if obj.designation else None

#     def get_employee_type_name(self, obj):
#         return obj.employee_type.type if obj.employee_type else None

#     def get_reporting_manager_details(self, obj):
#         if obj.reporting_manager:
#             return {
#                 'id': obj.reporting_manager.id,
#                 'name': f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}",
#                 'employee_id': obj.reporting_manager.employee_id
#             }
#         return None


# class UserProfileSerializer(serializers.ModelSerializer):
#     """
#     Detailed user profile with organizational information
#     """
#     roles = serializers.SerializerMethodField()
#     grade = serializers.CharField(source="grade.name", read_only=True)
#     employee_type = serializers.CharField(source="employee_type.type", read_only=True)
#     company = serializers.CharField(source="company.name", read_only=True)
#     department = serializers.CharField(source="department.dept_name", read_only=True)
#     designation = serializers.CharField(source="designation.designation_name", read_only=True)
#     base_location = serializers.CharField(source="base_location.location_name", read_only=True)
#     reporting_manager = serializers.CharField(source="reporting_manager.username", read_only=True)

#     class Meta:
#         model = User
#         fields = (
#             'id', 'username', 'first_name', 'last_name', 'email', 'gender', 'employee_id',
#             'roles', 'department', 'designation', 'grade', 'employee_type', 
#             'company', 'base_location', 'reporting_manager'
#         )

#     def get_roles(self, obj):
#         return [
#             {
#                 'name': ur.role.name,
#                 'dashboard': ur.role.dashboard_access,
#                 'is_primary': ur.is_primary
#             }
#             for ur in obj.userrole_set.select_related('role').all()
#         ]

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
        fields = ['id', 'name', 'role_type', 'is_active', 'description']

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
            'id', 'name', 'role_type', 'is_active', 
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
            'id', 'name', 'role_type', 'is_active', 
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