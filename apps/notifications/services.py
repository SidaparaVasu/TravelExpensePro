from django.core.mail import send_mail
from django.conf import settings
from apps.master_data.models import EmailTemplateMaster

class EmailNotificationService:
    
    @staticmethod
    def send_travel_request_submitted(travel_app):
        """Notify employee that request was submitted"""
        template = EmailTemplateMaster.objects.filter(
            template_type='travel_request_submitted',
            is_active=True
        ).first()
        
        if not template:
            return
        
        context = {
            'request_id': travel_app.get_travel_request_id(),
            'employee_name': travel_app.employee.get_full_name(),
            'purpose': travel_app.purpose,
            'approver_name': travel_app.current_approver.get_full_name() if travel_app.current_approver else 'Manager',
        }
        
        subject, body = template.render_template(context)
        
        EmailNotificationService._send_email(
            subject=subject,
            body=body,
            to_email=travel_app.employee.email
        )
    
    @staticmethod
    def send_approval_notification(travel_app, approval_flow, action):
        """Send email on approval/rejection"""
        template_type = f'travel_request_{action}'
        template = EmailTemplateMaster.objects.filter(
            template_type=template_type,
            is_active=True
        ).first()
        
        if not template:
            return
        
        context = {
            'request_id': travel_app.get_travel_request_id(),
            'employee_name': travel_app.employee.get_full_name(),
            'approver_name': approval_flow.approver.get_full_name(),
            'notes': approval_flow.notes or 'No notes provided',
        }
        
        subject, body = template.render_template(context)
        
        EmailNotificationService._send_email(
            subject=subject,
            body=body,
            to_email=travel_app.employee.email,
            cc_emails=template.cc_emails
        )
    
    @staticmethod
    def _send_email(subject, body, to_email, cc_emails=None):
        """Internal method to send email"""
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            print(f"✓ Email sent: {subject} to {to_email}")
        except Exception as e:
            print(f"✗ Email failed: {str(e)}")