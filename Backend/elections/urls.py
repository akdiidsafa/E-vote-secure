from django.urls import path
from .views import (
    ElectionListCreateView, ElectionDetailView, ElectionOpenView,
    ElectionCloseView, AssignVotersView, ElectionVotersView, ElectionStatsView,ElectionPublicKeysView, 
    ElectionPrivateKeysView,

)

app_name = 'elections'

urlpatterns = [
    path('', ElectionListCreateView.as_view(), name='election-list-create'),
    path('<int:pk>/', ElectionDetailView.as_view(), name='election-detail'),
    path('<int:pk>/open/', ElectionOpenView.as_view(), name='election-open'),
    path('<int:pk>/close/', ElectionCloseView.as_view(), name='election-close'),
    path('assign-voters/', AssignVotersView.as_view(), name='assign-voters'),
    path('<int:pk>/voters/', ElectionVotersView.as_view(), name='election-voters'),
    path('<int:pk>/public_keys/', ElectionPublicKeysView.as_view(), name='election-public-keys'),  
    path('<int:pk>/stats/', ElectionStatsView.as_view(), name='election-stats'),
    path('<int:pk>/private_keys/', ElectionPrivateKeysView.as_view(), name='election-private-keys'), 
    
]