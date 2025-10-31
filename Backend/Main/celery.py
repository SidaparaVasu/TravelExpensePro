import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Main.settings')

# Create Celery app
app = Celery('Main')

# Load config from Django settings with CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# Optional: Configure task routes
app.conf.task_routes = {
    'Main.tasks.send_email': {'queue': 'emails'},
    'Main.tasks.send_sms': {'queue': 'sms'},
    'Main.tasks.send_notification': {'queue': 'notifications'},
}

@app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery setup"""
    print(f'Request: {self.request!r}')