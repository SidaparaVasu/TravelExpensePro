from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from utils.response_formatter import success_response, error_response

class ApprovalDelegationView(APIView):
    """Delegate approval authority to another user (temporary)"""
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        delegate_to_user_id = request.data.get('delegate_to')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        from apps.authentication.models import User
        from apps.travel.models import TravelApprovalFlow
        
        try:
            delegate_user = User.objects.get(id=delegate_to_user_id)
        except User.DoesNotExist:
            return error_response('Delegate user not found', status_code=404)
        
        # Find pending approvals for current user
        pending_approvals = TravelApprovalFlow.objects.filter(
            approver=request.user,
            status='pending'
        )
        
        # Reassign to delegate
        reassigned_count = pending_approvals.update(approver=delegate_user)
        
        # Log delegation (TODO: create DelegationLog model if needed)
        
        return success_response(
            data={'reassigned_count': reassigned_count},
            message=f'Successfully delegated {reassigned_count} approvals to {delegate_user.get_full_name()}'
        )