from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from apps.master_data.models import EmailTemplateMaster
import logging

logger = logging.getLogger(__name__)

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
    def _send_email(subject, body, to_email, cc_emails=None, html_body=None):
        """Internal method to send email"""
        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email] if isinstance(to_email, str) else to_email,
                cc=cc_emails or []
            )
            
            if html_body:
                email.attach_alternative(html_body, "text/html")
            
            email.send(fail_silently=False)
            logger.info(f"✅ Email sent: {subject} to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Email failed: {str(e)}")
            return False