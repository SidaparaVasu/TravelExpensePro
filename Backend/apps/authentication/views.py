from rest_framework.generics import CreateAPIView, RetrieveAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework import viewsets
from django.contrib.auth import authenticate
from django.db import transaction
from .models import *
from .serializers import *
from .permissions import IsAdminUser, HasCustomPermission
from .utils import RoleManager
from utils.rate_limiters import api_ratelimit
from utils.response_formatter import success_response, error_response

class RegisterView(CreateAPIView):
    """
    Register a new user with automatic Employee role assignment
    """
    queryset = User.objects.all()
    serializer_class = RegisterUserSerializer
    permission_classes = []

    def perform_create(self, serializer):
        user = serializer.save()
        # Automatically assign Employee role as primary
        try:
            RoleManager.assign_role_to_user(
                user=user,
                role_name='Employee',
                is_primary=True,
                assigned_by=self.request.user if self.request.user.is_authenticated else None
            )
        except ValueError as e:
            # If Employee role doesn't exist, log the error but don't fail registration
            print(f"Warning: {str(e)}")
        return user

class LoginView(APIView):
    """
    Enhanced login with role information for dashboard routing
    """
    permission_classes = []

    # @api_ratelimit(rate='5/m')
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Get user's roles and permissions
        primary_role = user.get_primary_role()
        all_roles = user.get_all_roles()
        
        response_data = {
            'success': True,
            'message': 'Login successful',
            'data': {
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'employee_id': user.employee_id,
                    'full_name': user.get_full_name(),
                    'email': user.email
                },
                'roles': {
                    'primary': {
                        'name': primary_role.name if primary_role else 'Employee',
                        'dashboard': primary_role.dashboard_access if primary_role else 'employee'
                    },
                    'available': [
                        {
                            'id': role.id,
                            'name': role.name,
                            'dashboard': role.dashboard_access
                        } for role in all_roles
                    ]
                },
                'permissions': user.get_user_permissions_list(),
                'redirect_to': f"/{primary_role.dashboard_access if primary_role else 'employee'}/dashboard"
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

class LogoutView(APIView):
    """
    Logout with token blacklisting
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Successfully logged out"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'], url_path='by-location')
    def by_location(self, request):
        location_id = request.query_params.get('location')
        if not location_id:
            return Response({"error": "location parameter is required"}, status=400)
        
        users = User.objects.filter(base_location_id=location_id, is_active=True)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
class UserCreateView(ListCreateAPIView):
    """
    List and create users (Admin only)
    Supports filtering by base_location
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['base_location']  # 👈 this enables ?base_location=<id> filtering
    search_fields = ['username', 'first_name', 'last_name', 'email']

class UserProfileView(RetrieveAPIView):
    """
    Get current user's profile with organizational information
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class SwitchRoleView(APIView):
    """
    Allow users to switch between their assigned roles
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SwitchRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        role_name = serializer.validated_data['role_name']
        
        try:
            RoleManager.switch_primary_role(request.user, role_name)
            
            new_role = Role.objects.get(name=role_name)
            return Response({
                'message': 'Role switched successfully',
                'redirect_to': f"/{new_role.dashboard_access}/dashboard",
                'role': {
                    'name': new_role.name,
                    'dashboard': new_role.dashboard_access
                }
            })
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_403_FORBIDDEN
            )

# Enhanced Role Management Views
class RoleListCreateView(ListCreateAPIView):
    """
    List and create roles (Admin only)
    """
    queryset = Role.objects.filter(is_active=True).prefetch_related('rolepermission_set__permission')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class RoleDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, delete role (Admin only)
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class PermissionListCreateView(ListCreateAPIView):
    """
    List and create permissions (Admin only)
    """
    queryset = Permission.objects.filter(is_active=True)
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class PermissionDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, delete permission (Admin only)
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class UserRoleAssignmentView(APIView):
    """
    Assign/remove roles from users (Admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        serializer = UserRoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        role_name = serializer.validated_data['role_name']
        is_primary = serializer.validated_data.get('is_primary', False)
        action = serializer.validated_data['action']  # 'assign' or 'remove'
        
        try:
            user = User.objects.get(id=user_id)
            
            if action == 'assign':
                user_role, created = RoleManager.assign_role_to_user(
                    user=user,
                    role_name=role_name,
                    is_primary=is_primary,
                    assigned_by=request.user
                )
                message = f"Role '{role_name}' assigned to user '{user.username}'"
                if created:
                    message += " (new assignment)"
                else:
                    message += " (already assigned)"
                    
            elif action == 'remove':
                success = RoleManager.remove_role_from_user(user, role_name)
                if success:
                    message = f"Role '{role_name}' removed from user '{user.username}'"
                else:
                    message = f"Role '{role_name}' was not assigned to user '{user.username}'"
            
            else:
                return Response(
                    {'error': 'Action must be either "assign" or "remove"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({'message': message})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class InitializeSystemView(APIView):
    """
    Initialize system with default roles and permissions (Admin only)
    """
    permission_classes = []  # Allow during initial setup
    
    def post(self, request):
        try:
            from .utils import setup_initial_data
            setup_initial_data()
            return Response({
                'message': 'System initialized with default roles and permissions'
            })
        except Exception as e:
            return Response(
                {'error': f'Initialization failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class NotificationPreferencesView(APIView):
    """Get/Update notification preferences"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.authentication.models.preferences import NotificationPreference
        
        prefs, created = NotificationPreference.objects.get_or_create(user=request.user)
        
        return success_response(
            data={
                'travel_submitted': prefs.travel_submitted,
                'travel_approved': prefs.travel_approved,
                'travel_rejected': prefs.travel_rejected,
                'booking_confirmed': prefs.booking_confirmed,
                'approval_required': prefs.approval_required,
                'approval_reminder': prefs.approval_reminder,
                'settlement_due': prefs.settlement_due,
                'settlement_overdue': prefs.settlement_overdue,
                'preferred_channels': prefs.preferred_channels,
                'quiet_hours_start': prefs.quiet_hours_start,
                'quiet_hours_end': prefs.quiet_hours_end
            },
            message='Preferences retrieved successfully'
        )
    
    def put(self, request):
        from apps.authentication.models.preferences import NotificationPreference
        
        prefs, created = NotificationPreference.objects.get_or_create(user=request.user)
        
        # Update preferences
        for field in ['travel_submitted', 'travel_approved', 'travel_rejected', 
                     'booking_confirmed', 'approval_required', 'approval_reminder',
                     'settlement_due', 'settlement_overdue']:
            if field in request.data:
                setattr(prefs, field, request.data[field])
        
        if 'preferred_channels' in request.data:
            prefs.preferred_channels = request.data['preferred_channels']
        
        if 'quiet_hours_start' in request.data:
            prefs.quiet_hours_start = request.data['quiet_hours_start']
        
        if 'quiet_hours_end' in request.data:
            prefs.quiet_hours_end = request.data['quiet_hours_end']
        
        prefs.save()
        
        return success_response(
            message='Preferences updated successfully'
        )