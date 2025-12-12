import logging
from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings

logger = logging.getLogger(__name__)


class BaseEmailProvider:
    def send(self, subject, body_text, body_html, to_emails, cc=None, bcc=None, attachments=None):
        raise NotImplementedError


class SMTPEmailProvider(BaseEmailProvider):
    def send(self, subject, body_text, body_html, to_emails, cc=None, bcc=None, attachments=None):
        connection = get_connection()  # respects settings.EMAIL_BACKEND
        email = EmailMultiAlternatives(
            subject=subject,
            body=body_text or '',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails,
            cc=cc or [],
            bcc=bcc or [],
            connection=connection,
        )
        if body_html:
            email.attach_alternative(body_html, 'text/html')
        if attachments:
            for att in attachments:
                email.attach(att.get('name'), att.get('content'), att.get('mimetype'))
        email.send(fail_silently=False)


# Optional SendGrid provider
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    class SendGridProvider(BaseEmailProvider):
        def __init__(self, api_key):
            self.client = SendGridAPIClient(api_key)

        def send(self, subject, body_text, body_html, to_emails, cc=None, bcc=None, attachments=None):
            # sendgrid Mail accepts single or list of recipients
            message = Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=to_emails,
                subject=subject,
                plain_text_content=body_text or '',
                html_content=body_html or body_text or '',
            )
            # CC/BCC/attachments handling can be added as needed
            response = self.client.send(message)
            logger.debug('SendGrid response: %s', response.status_code)

except Exception:
    SendGridProvider = None


def EmailProviderFactory():
    provider_name = getattr(settings, 'NOTIFICATION_EMAIL_PROVIDER', 'smtp').lower()
    if provider_name == 'sendgrid' and SendGridProvider:
        api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        return SendGridProvider(api_key)
    return SMTPEmailProvider()
