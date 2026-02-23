

from django.urls import path
from .views import (
    # Voter endpoints
    SubmitVoteView,
    MyVoteStatusView,
    VoteReceiptView,
    
    # CO endpoints - NOUVEAUX
    COElectionVotesView,
    COApproveVoteView,
    CORejectVoteView,
    CODownloadM2PDFView,
    
    # CO endpoints - ANCIENS (compatibilité)
    COPendingVotesView,
    COVerifyVoteView,
    
    # DE endpoints
    DEPendingBallotsView,
    DEDecryptBallotView,
    DEElectionResultsView,
    
    # PDF Downloads
    DownloadM1PDFView,
    DownloadM2PDFView,
)

app_name = 'votes'

urlpatterns = [
    # ==================== VOTER ENDPOINTS ====================
    path('submit/', SubmitVoteView.as_view(), name='submit-vote'),
    path('my-vote/', MyVoteStatusView.as_view(), name='my-vote-status'),
    path('receipt/', VoteReceiptView.as_view(), name='vote-receipt'),
    
    # ==================== CO ENDPOINTS (NOUVEAUX) ====================
    # ✅ Route principale pour le nouveau workflow CO
    path('co/election/<int:election_id>/', COElectionVotesView.as_view(), name='co-election-votes'),
    path('co/approve/', COApproveVoteView.as_view(), name='co-approve-vote'),
    path('co/reject/', CORejectVoteView.as_view(), name='co-reject-vote'),
    path('co/<int:vote_id>/download-m2/', CODownloadM2PDFView.as_view(), name='co-download-m2-pdf'),
    
    # ==================== CO ENDPOINTS (ANCIENS - Compatibilité) ====================
    # ⚠️ DÉPRÉCIÉ mais gardé pour compatibilité
    path('co/pending/', COPendingVotesView.as_view(), name='co-pending-votes'),
    path('co/verify/', COVerifyVoteView.as_view(), name='co-verify-vote'),
    
    # ==================== DE ENDPOINTS ====================
    path('de/pending/', DEPendingBallotsView.as_view(), name='de-pending-ballots'),
    path('de/decrypt/', DEDecryptBallotView.as_view(), name='de-decrypt-ballot'),
    path('de/results/<int:election_id>/', DEElectionResultsView.as_view(), name='de-election-results'),
    
    # ==================== PDF DOWNLOADS ====================
    path('<int:vote_id>/download-m1/', DownloadM1PDFView.as_view(), name='download-m1-pdf'),
    path('<int:vote_id>/download-m2/', DownloadM2PDFView.as_view(), name='download-m2-pdf'),
]