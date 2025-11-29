from django.contrib import admin
from apps.expenses.models import *
from django.utils import timezone

class ExpenseItemInline(admin.TabularInline):
    model = ExpenseItem
    extra = 0
    readonly_fields = ("expense_type", "expense_date", "amount", "has_receipt")


class DABreakdownInline(admin.TabularInline):
    model = DAIncidentalBreakdown
    extra = 0
    readonly_fields = ("date", "eligible_da", "eligible_incidental")

class ClaimApprovalFlowInline(admin.TabularInline):
    model = ClaimApprovalFlow
    extra = 0
    readonly_fields = ("level", "status", "remarks", "acted_on")


@admin.register(ExpenseTypeMaster)
class ExpenseTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "requires_receipt", "is_distance_based", "is_active")
    list_filter = ("is_active", "requires_receipt", "is_distance_based")
    search_fields = ("code", "name")


@admin.register(ClaimStatusMaster)
class ClaimStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "label", "sequence", "is_terminal")
    ordering = ("sequence",)
    list_filter = ("is_terminal",)
    search_fields = ("code", "label")

@admin.action(description="Approve selected claims")
def admin_approve_claims(modeladmin, request, queryset):
    for claim in queryset:
        approved_status = ClaimStatusMaster.objects.filter(code="approved").first()
        if approved_status:
            claim.status = approved_status
            claim.save()
            ClaimApprovalFlow.objects.create(
                claim=claim,
                approver=request.user,
                level=999,    # admin override level
                status="approve",
                remarks="Admin panel override approval",
                acted_on=timezone.now()
            )


@admin.action(description="Reject selected claims")
def admin_reject_claims(modeladmin, request, queryset):
    for claim in queryset:
        rejected_status = ClaimStatusMaster.objects.filter(code="rejected").first()
        if rejected_status:
            claim.status = rejected_status
            claim.save()
            ClaimApprovalFlow.objects.create(
                claim=claim,
                approver=request.user,
                level=999,
                status="reject",
                remarks="Admin panel override rejection",
                acted_on=timezone.now()
            )

@admin.register(ExpenseClaim)
class ExpenseClaimAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "travel_application",
        "employee_name",
        "status",
        "total_expenses",
        "final_amount_payable",
        "submitted_on",
    )
    inlines = [ExpenseItemInline, DABreakdownInline, ClaimApprovalFlowInline]
    actions = [admin_approve_claims, admin_reject_claims]
    search_fields = ("employee__username", "travel_application__id")
    list_filter = ("status", "submitted_on")
    readonly_fields = ("created_on", "updated_on", "submitted_on")
    inlines = [ExpenseItemInline, DABreakdownInline]

    def employee_name(self, obj):
        return obj.employee.get_full_name()

    def travel_request_id(self, obj):
        return obj.travel_application.travel_request_id


@admin.register(ExpenseItem)
class ExpenseItemAdmin(admin.ModelAdmin):
    list_display = ("id", "claim", "get_type_name", "expense_date", "amount", "has_receipt")
    list_filter = ("expense_type", "has_receipt")
    search_fields = ("vendor_name", "bill_number")

    def get_type_name(self, obj):
        return obj.expense_type.name if obj.expense_type else ""
    get_type_name.short_description = "Expense Type"


@admin.register(DAIncidentalBreakdown)
class DAIncidentalBreakdownAdmin(admin.ModelAdmin):
    list_display = ("id", "claim", "date", "eligible_da", "eligible_incidental")
    list_filter = ("date",)
    search_fields = ("claim__id",)

@admin.register(ClaimDocument)
class ClaimDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "claim", "doc_type", "file", "uploaded_on")
    list_filter = ("doc_type", "uploaded_on")
    search_fields = ("claim__id", "doc_type")


@admin.register(ClaimApprovalFlow)
class ClaimApprovalFlowAdmin(admin.ModelAdmin):
    list_display = ("id", "claim", "approver", "level", "status", "acted_on")
    list_filter = ("status", "level", "acted_on")
    search_fields = ("claim__id", "approver__username", "status")
