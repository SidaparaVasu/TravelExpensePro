from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from ..models import TravelApplication, TravelApprovalFlow
from ..serializers.approval_serializers import (
    TravelApprovalFlowSerializer, ApprovalActionSerializer,
    ManagerApprovalListSerializer
)
from ...authentication.permissions import HasCustomPermission

class ManagerPendingApprovalsView(ListAPIView):
    """
    List of travel applications pending manager's approval
    """
    serializer_class = ManagerApprovalListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # return TravelApplication.objects.all()
        return TravelApplication.objects.filter(
            approval_flows__approver=self.request.user,
            approval_flows__status='pending',
            approval_flows__can_approve=True
        ).select_related(
            'employee__grade', 'employee__department'
        ).prefetch_related(
            'trip_details__from_location', 'trip_details__to_location'
        ).distinct().order_by('-submitted_at')

class ApprovalActionView(APIView):
    """
    Approve or reject a travel application
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            # Get the travel application
            travel_app = TravelApplication.objects.get(pk=pk)
            
            # Get the current approval flow for this user
            approval_flow = TravelApprovalFlow.objects.get(
                travel_application=travel_app,
                approver=request.user,
                status='pending',
                can_approve=True
            )
        except TravelApplication.DoesNotExist:
            return Response(
                {'error': 'Travel application not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except TravelApprovalFlow.DoesNotExist:
            return Response(
                {'error': 'No pending approval found for this user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate action
        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        if action == 'approve':
            approval_flow.approve(notes)
            message = f"Travel application {travel_app.get_travel_request_id()} approved"
            
            # Send notification email (implement in notifications module)
            self.send_approval_notification(travel_app, approval_flow, 'approved')
            
        elif action == 'reject':
            approval_flow.reject(notes)
            message = f"Travel application {travel_app.get_travel_request_id()} rejected"
            
            # Send rejection notification
            self.send_approval_notification(travel_app, approval_flow, 'rejected')
        
        return Response({
            'message': message,
            'travel_request_id': travel_app.get_travel_request_id(),
            'new_status': travel_app.status,
            'action': action,
            'approval_level': approval_flow.approval_level
        })
    
    def send_approval_notification(self, travel_app, approval_flow, action):
        """
        Send email notification (placeholder for future implementation)
        """
        # TODO: Implement email notification system
        if action == 'approved':
            # Send notification
            from apps.notifications.services import EmailNotificationService
            EmailNotificationService.send_approval_notification(travel_app, approval_flow, 'approved')
        elif action == 'rejected':
            from apps.notifications.services import EmailNotificationService
            EmailNotificationService.send_approval_notification(travel_app, approval_flow, 'rejected')


class ApprovalHistoryView(APIView):
    """
    Get approval history for a travel application
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            travel_app = TravelApplication.objects.get(pk=pk)
            
            # Check if user can view this application
            if (travel_app.employee != request.user and 
                not travel_app.approval_flows.filter(approver=request.user).exists() and
                not request.user.can_access_dashboard('admin')):
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            approval_flows = travel_app.approval_flows.all().order_by('sequence')
            serializer = TravelApprovalFlowSerializer(approval_flows, many=True)
            
            # Add approval summary
            summary = {
                'total_approvals': approval_flows.count(),
                'completed_approvals': approval_flows.filter(status__in=['approved', 'rejected']).count(),
                'pending_approvals': approval_flows.filter(status='pending').count(),
                'current_step': None
            }
            
            current_pending = approval_flows.filter(status='pending').first()
            if current_pending:
                summary['current_step'] = {
                    'level': current_pending.approval_level,
                    'approver': current_pending.approver.get_full_name(),
                    'sequence': current_pending.sequence
                }
            
            return Response({
                'approval_history': serializer.data,
                'summary': summary
            })
            
        except TravelApplication.DoesNotExist:
            return Response(
                {'error': 'Travel application not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class CHROPendingApprovalsView(ListAPIView):
    """
    CHRO pending approvals view
    """
    serializer_class = ManagerApprovalListSerializer
    permission_classes = [IsAuthenticated, HasCustomPermission]
    permission_required = 'travel_request_approve_all'
    
    def get_queryset(self):
        return TravelApplication.objects.filter(
            status='pending_chro'
        ).select_related(
            'employee__grade', 'employee__department'
        ).order_by('-submitted_at')

class CEOPendingApprovalsView(ListAPIView):
    """
    CEO pending approvals view
    """
    serializer_class = ManagerApprovalListSerializer
    permission_classes = [IsAuthenticated, HasCustomPermission]
    permission_required = 'travel_request_approve_all'
    
    def get_queryset(self):
        return TravelApplication.objects.filter(
            status='pending_ceo'
        ).select_related(
            'employee__grade', 'employee__department'  
        ).order_by('-submitted_at')

class ApprovalDashboardView(APIView):
    """
    Approval dashboard with statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get pending approvals for this user
        pending_approvals = TravelApprovalFlow.objects.filter(
            approver=user,
            status='pending',
            can_approve=True
        ).count()
        
        # Get approval statistics
        total_approvals_done = TravelApprovalFlow.objects.filter(
            approver=user,
            status__in=['approved', 'rejected']
        ).count()
        
        approvals_this_month = TravelApprovalFlow.objects.filter(
            approver=user,
            status__in=['approved', 'rejected'],
            approved_at__month=timezone.now().month,
            approved_at__year=timezone.now().year
        ).count()
        
        # Get recent approval activity
        recent_approvals = TravelApprovalFlow.objects.filter(
            approver=user,
            status__in=['approved', 'rejected']
        ).select_related(
            'travel_application__employee'
        ).order_by('-approved_at')[:10]
        
        recent_data = []
        for approval in recent_approvals:
            recent_data.append({
                'travel_request_id': approval.travel_application.get_travel_request_id(),
                'employee_name': approval.travel_application.employee.get_full_name(),
                'action': approval.status,
                'date': approval.approved_at,
                'approval_level': approval.approval_level
            })
        
        return Response({
            'statistics': {
                'pending_approvals': pending_approvals,
                'total_approvals_done': total_approvals_done,
                'approvals_this_month': approvals_this_month
            },
            'recent_activity': recent_data
        })
    

class ApprovalStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        
        today = timezone.now().date()
        
        pending = TravelApprovalFlow.objects.filter(
            approver=request.user,
            status='pending'
        ).count()
        
        approved_today = TravelApprovalFlow.objects.filter(
            approver=request.user,
            status='approved',
            approved_at__date=today
        ).count()
        
        total_budget = TravelApplication.objects.filter(
            approval_flows__approver=request.user,
            approval_flows__status='pending'
        ).aggregate(total=Sum('estimated_total_cost'))['total'] or 0
        
        rejected = TravelApprovalFlow.objects.filter(
            approver=request.user,
            status='rejected'
        ).count()
        
        return Response({
            'success': True,
            'data': {
                'pending_approval': pending,
                'approved_today': approved_today,
                'total_budget': float(total_budget),
                'rejected': rejected
            }
        })