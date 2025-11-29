from rest_framework import serializers
from apps.notifications.models import *

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplateMaster
        fields = '__all__'