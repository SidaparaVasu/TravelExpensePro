from django.contrib import admin
from apps.notifications.models import *

# Register your models here.
admin.site.register(NotificationPreference)
admin.site.register(EmailTemplateMaster)