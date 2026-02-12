from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
import hashlib
import secrets

from .models import Vote, DecryptedBallot, VoteReceipt
from .serializers import (
    VoteSubmitSerializer,
    VoteSerializer,
    COVoteVerificationSerializer,
    DecryptedBallotSerializer,
    DEBallotDecryptSerializer,
    VoteReceiptSerializer
)
from elections.models import Election, ElectionVoterAssignment
from candidates.models import Candidate


class SubmitVoteView(APIView):
    """
    POST /api/votes/submit/ - Submit an encrypted vote
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only voters can submit votes
        if request.user.role != 'voter':
            return Response({
                'error': 'Seuls les électeurs peuvent voter.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = VoteSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        election_id = serializer.validated_data['election_id']
        election = get_object_or_404(Election, pk=election_id)
        
        # Check if election is open
        if election.status != 'open':
            return Response({
                'error': 'Cette élection n\'est pas ouverte au vote.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if voter is assigned to this election
        assignment = ElectionVoterAssignment.objects.filter(
            election=election,
            voter=request.user
        ).first()
        
        if not assignment:
            return Response({
                'error': 'Vous n\'êtes pas assigné à cette élection.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if voter has already voted
        if assignment.has_voted:
            return Response({
                'error': 'Vous avez déjà voté pour cette élection.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create vote
        vote = Vote.objects.create(
            election=election,
            voter=request.user,
            m1_identity=serializer.validated_data['m1_identity'],
            m2_ballot=serializer.validated_data['m2_ballot'],
            unique_id=serializer.validated_data['unique_id'],
            status='pending_co'
        )
        
        # Mark voter as having voted
        assignment.has_voted = True
        assignment.save()
        
        # Generate receipt
        receipt_code = hashlib.sha256(
            f"{vote.id}-{vote.unique_id}-{secrets.token_hex(16)}".encode()
        ).hexdigest()
        
        receipt = VoteReceipt.objects.create(
            vote=vote,
            receipt_code=receipt_code
        )
        
        return Response({
            'message': 'Vote soumis avec succès.',
            'vote_id': vote.id,
            'receipt_code': receipt.receipt_code,
            'unique_id': vote.unique_id
        }, status=status.HTTP_201_CREATED)


class MyVoteStatusView(APIView):
    """
    GET /api/votes/my-vote/?election_id=<id> - Check if user has voted
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'voter':
            return Response({
                'error': 'Seuls les électeurs peuvent vérifier leur statut de vote.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election_id = request.query_params.get('election_id')
        if not election_id:
            return Response({
                'error': 'election_id est requis.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        assignment = ElectionVoterAssignment.objects.filter(
            election_id=election_id,
            voter=request.user
        ).first()
        
        if not assignment:
            return Response({
                'has_voted': False,
                'is_assigned': False
            })
        
        return Response({
            'has_voted': assignment.has_voted,
            'is_assigned': True
        })


class COPendingVotesView(generics.ListAPIView):
    """
    GET /api/votes/co/pending/ - Get all votes pending CO verification
    """
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only CO can access this
        if self.request.user.role != 'co':
            return Vote.objects.none()
        
        return Vote.objects.filter(status='pending_co')


class COVerifyVoteView(APIView):
    """
    POST /api/votes/co/verify/ - Verify identity and approve/reject vote
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only CO can verify
        if request.user.role != 'co':
            return Response({
                'error': 'Seul le CO peut vérifier les votes.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = COVoteVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vote_id = serializer.validated_data['vote_id']
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_co':
            return Response({
                'error': 'Ce vote a déjà été vérifié.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update vote status
        vote.verified_by_co = request.user
        vote.co_verification_date = timezone.now()
        vote.co_notes = notes
        
        if action == 'approve':
            vote.status = 'approved_co'
            # In production, M2 would be forwarded to DE here
            # TODO: Forward M2 to DE queue
        else:
            vote.status = 'rejected_co'
            # Notify voter/admin of rejection
            # TODO: Send notification
        
        vote.save()
        
        return Response({
            'message': f'Vote {"approuvé" if action == "approve" else "rejeté"} avec succès.',
            'vote': VoteSerializer(vote).data
        }, status=status.HTTP_200_OK)


class DEPendingBallotsView(generics.ListAPIView):
    """
    GET /api/votes/de/pending/?election_id=<id> - Get approved votes for counting
    """
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only DE can access this
        if self.request.user.role != 'de':
            return Vote.objects.none()
        
        queryset = Vote.objects.filter(status='approved_co')
        
        election_id = self.request.query_params.get('election_id')
        if election_id:
            queryset = queryset.filter(election_id=election_id)
        
        return queryset


class DEDecryptBallotView(APIView):
    """
    POST /api/votes/de/decrypt/ - Decrypt ballot and record vote
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only DE can decrypt
        if request.user.role != 'de':
            return Response({
                'error': 'Seul le DE peut déchiffrer les bulletins.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DEBallotDecryptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        unique_id = serializer.validated_data['unique_id']
        candidate_id = serializer.validated_data['candidate_id']
        
        # Get the vote
        vote = get_object_or_404(Vote, unique_id=unique_id)
        
        if vote.status != 'approved_co':
            return Response({
                'error': 'Ce vote n\'a pas été approuvé par le CO.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get candidate
        candidate = get_object_or_404(Candidate, pk=candidate_id)
        
        # Check if already decrypted
        if DecryptedBallot.objects.filter(unique_id=unique_id).exists():
            return Response({
                'error': 'Ce bulletin a déjà été déchiffré.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create decrypted ballot (anonymous vote)
        decrypted_ballot = DecryptedBallot.objects.create(
            election=vote.election,
            candidate=candidate,
            unique_id=unique_id,
            decrypted_by=request.user
        )
        
        # Update vote status
        vote.status = 'counted'
        vote.save()
        
        return Response({
            'message': 'Bulletin déchiffré et compté avec succès.',
            'ballot': DecryptedBallotSerializer(decrypted_ballot).data
        }, status=status.HTTP_201_CREATED)


class VoteReceiptView(APIView):
    """
    GET /api/votes/receipt/?code=<receipt_code> - Verify vote receipt
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        receipt_code = request.query_params.get('code')
        
        if not receipt_code:
            return Response({
                'error': 'Code de reçu requis.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        receipt = VoteReceipt.objects.filter(receipt_code=receipt_code).first()
        
        if not receipt:
            return Response({
                'valid': False,
                'message': 'Reçu invalide.'
            })
        
        # Only the voter who cast the vote can verify their receipt
        if receipt.vote.voter != request.user and request.user.role != 'admin':
            return Response({
                'error': 'Vous ne pouvez pas vérifier ce reçu.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'valid': True,
            'election': receipt.vote.election.title,
            'submitted_at': receipt.vote.submitted_at,
            'status': receipt.vote.status
        })