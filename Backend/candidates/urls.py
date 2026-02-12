from django.urls import path
from .views import (
    CandidateListCreateView, CandidateDetailView, ElectionCandidatesView,
)

app_name = 'candidates'

urlpatterns = [
    path('', CandidateListCreateView.as_view(), name='candidate-list-create'),
    path('<int:pk>/', CandidateDetailView.as_view(), name='candidate-detail'),
    path('election/<int:election_id>/', ElectionCandidatesView.as_view(), name='election-candidates'),
]