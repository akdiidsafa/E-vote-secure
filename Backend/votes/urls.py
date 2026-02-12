from django.urls import path
from .views import (
    SubmitVoteView, MyVoteStatusView, COPendingVotesView,
    COVerifyVoteView, DEPendingBallotsView, DEDecryptBallotView, VoteReceiptView,
)

app_name = 'votes'

urlpatterns = [
    path('submit/', SubmitVoteView.as_view(), name='submit-vote'),
    path('my-vote/', MyVoteStatusView.as_view(), name='my-vote-status'),
    path('receipt/', VoteReceiptView.as_view(), name='vote-receipt'),
    path('co/pending/', COPendingVotesView.as_view(), name='co-pending-votes'),
    path('co/verify/', COVerifyVoteView.as_view(), name='co-verify-vote'),
    path('de/pending/', DEPendingBallotsView.as_view(), name='de-pending-ballots'),
    path('de/decrypt/', DEDecryptBallotView.as_view(), name='de-decrypt-ballot'),
]