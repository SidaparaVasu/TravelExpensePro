from django.contrib import admin
from apps.notifications.models import *

# Register your models here.
from django.contrib import admin
from .models import EmailTemplateMaster, NotificationRule, NotificationEvent, NotificationLog


@admin.register(EmailTemplateMaster)
class EmailTemplateMasterAdmin(admin.ModelAdmin):
    list_display = (
        "template_key",
        "template_name",
        "preview_subject",
        "is_active",
        "updated_at",
    )

    list_filter = ("is_active", "updated_at")
    search_fields = ("template_key", "template_name", "subject", "body_html")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Template Identification", {
            "fields": ("template_key", "template_name", "is_active")
        }),
        ("Email Content", {
            "fields": ("subject", "body_html", "body_text"),
            "description": "Use Django template tags like {{ employee_name }}, {{ approver_name }} etc."
        }),
        ("Email Routing", {
            "fields": ("cc_emails", "bcc_emails"),
            "classes": ("collapse",)
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def preview_subject(self, obj):
        """Short subject preview in listing."""
        return (obj.subject[:40] + "...") if len(obj.subject) > 40 else obj.subject

    preview_subject.short_description = "Subject Preview"


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'template', 'is_active', 'send_reminder')
    search_fields = ('event_name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(NotificationEvent)
class NotificationEventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'reference_type', 'reference_id', 'is_resolved', 'next_reminder_at')
    search_fields = ('event_name', 'reference_type', 'reference_id')
    list_filter = ('is_resolved',)


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'channel', 'recipient', 'status', 'attempts', 'created_at')
    search_fields = ('event_name', 'recipient', 'last_error')
    list_filter = ('status', 'channel')
    readonly_fields = ('created_at', 'sent_at')