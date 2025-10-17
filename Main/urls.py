from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT token refresh
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App URLs
    path('api/', include('apps.authentication.urls')),
    path('api/master/', include('apps.master_data.urls')),
    path('api/travel/', include('apps.travel.urls')),
    
    # Legacy API support (gradually migrate these)
    # path('api/legacy/', include('apps.api.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)