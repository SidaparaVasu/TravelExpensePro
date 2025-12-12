from celery import shared_task
from django.utils import timezone
from travel.models import TravelApplication
from .models import NotificationLog, NotificationEvent
from .providers import EmailProviderFactory
from .center import NotificationCenter
from django_celery_beat.models import ClockedSchedule, PeriodicTask
from django.utils import timezone
import json
import datetime
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
def mark_travel_as_completed(travel_id):
    try:
        travel = TravelApplication.objects.get(id=travel_id)

        # if already completed or cancelled, do nothing
        if travel.status in ["Completed", "Cancelled"]:
            return

        # ensure end date has passed
        if timezone.now().date() >= travel.end_date:
            travel.status = "Completed"
            travel.is_claimable = True  # Assuming such a field exists
            travel.save()

            # optionally trigger settlement reminder here
            from notifications.center import NotificationCenter
            NotificationCenter.notify(
                "travel.settlement.reminder",
                {"type": "TravelRequest", "id": travel.id},
                {
                    "employee_id": travel.employee.id,
                    "employee_name": travel.employee.get_full_name(),
                    "request_id": travel.get_travel_request_id(),
                    "settlement_due_date": travel.get_settlement_due_date()
                }
            )
    except TravelApplication.DoesNotExist:
        pass


def schedule_travel_completion(travel_app):
    # When to run the job? End date at midnight or immediately after.
    run_datetime = timezone.make_aware(
        datetime.datetime.combine(travel_app.end_date, datetime.time(hour=1))
    )

    # Create clocked schedule
    clocked, _ = ClockedSchedule.objects.get_or_create(
        clocked_time=run_datetime
    )

    # Create one-off task
    PeriodicTask.objects.create(
        name=f"travel_complete_{travel_app.id}",
        task="notifications.tasks.mark_travel_as_completed",
        one_off=True,
        clocked=clocked,
        args=json.dumps([travel_app.id])
    )