from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from apps.notifications.models import *
from apps.authentication.permissions import IsAdminUser
from .serializers import *

# Create your views here.
class EmailTemplateListCreateView(ListCreateAPIView):
    queryset = EmailTemplateMaster.objects.filter(is_active=True)
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template_type']

class EmailTemplateDetailView(RetrieveUpdateDestroyAPIView):
    queryset = EmailTemplateMaster.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]