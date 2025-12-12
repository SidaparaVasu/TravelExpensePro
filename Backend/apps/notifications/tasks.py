from celery import shared_task
from django.utils import timezone
from .models import NotificationLog, NotificationEvent
from .providers import EmailProviderFactory
from .center import NotificationCenter
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_notification_task(self, log_id, channel, subject, body_text, body_html, payload):
    log = NotificationLog.objects.filter(id=log_id).first()
    if not log:
        logger.error('NotificationLog not found: %s', log_id)
        return

    try:
        if channel == 'email':
            provider = EmailProviderFactory()
            to_emails = [log.recipient] if isinstance(log.recipient, str) else log.recipient
            provider.send(subject=subject, body_text=body_text, body_html=body_html, to_emails=to_emails)
        elif channel == 'in_app':
            # create an in-app notification record or push through websocket
            from .in_app import create_in_app_notification
            create_in_app_notification(payload=payload, recipient=log.recipient, title=subject, body=body_text)
        else:
            # SMS / other channels placeholder
            logger.warning('Channel %s not implemented yet', channel)

        log.mark_sent()
        logger.info('Notification sent log=%s', log.id)
    except Exception as exc:
        log.mark_failed(str(exc))
        logger.exception('Failed to send notification log=%s', log_id)
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error('Max retries exceeded for log %s', log_id)


@shared_task
def notification_reminder_worker():
    """Periodic worker that checks NotificationEvent rows and sends reminders when due."""
    now = timezone.now()
    events = NotificationEvent.objects.filter(is_resolved=False, next_reminder_at__lte=now)
    for ev in events:
        rule = ev.rule
        if not rule:
            ev.is_resolved = True
            ev.save()
            continue

        # Prepare payload and send notifications similar to NotificationCenter.notify but do not create another NotificationEvent
        payload = ev.data
        # send to the same channels
        for channel in rule.channels:
            recipients = NotificationCenter._resolve_recipients(rule.recipient_resolver, payload)
            for r in recipients:
                contact = NotificationCenter._get_contact_for_channel(r, channel)
                if not contact:
                    continue
                log = NotificationLog.objects.create(
                    event_name=ev.event_name,
                    channel=channel,
                    recipient=contact,
                    subject=rule.template.subject if rule.template else ev.event_name,
                    body=rule.template.body_text if rule.template else '',
                    payload=payload,
                    status='queued',
                )
                send_notification_task.apply_async(
                    args=[log.id, channel, log.subject, log.body or '', (rule.template.body_html if rule.template else ''), payload],
                    queue='notifications'
                )

        # advance reminder schedule
        ev.advance_reminder()
