from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
   path('api/auth/', include('authentication.urls')),
    path('api/elections/', include('elections.urls')),
    path('api/candidates/', include('candidates.urls')),
    path('api/votes/', include('votes.urls')),
    path('api/results/', include('results.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)