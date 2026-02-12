from django.urls import path
from .views import (
    CalculateResultsView, PublishResultsView,
    ElectionResultView, PublishedResultsListView,
)

app_name = 'results'

urlpatterns = [
    path('calculate/<int:election_id>/', CalculateResultsView.as_view(), name='calculate-results'),
    path('publish/<int:election_id>/', PublishResultsView.as_view(), name='publish-results'),
    path('<int:election_id>/', ElectionResultView.as_view(), name='election-result'),
    path('', PublishedResultsListView.as_view(), name='published-results-list'),
]