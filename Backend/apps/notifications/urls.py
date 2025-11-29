
from django.urls import path
from apps.expenses.views import *
from apps.notifications.views import *

urlpatterns = [
    # --- Email APIs ---
    path('email-templates/', EmailTemplateListCreateView.as_view(), name='emailtemplate-list'),
    path('email-templates/<int:pk>/', EmailTemplateDetailView.as_view(), name='emailtemplate-detail'),
]