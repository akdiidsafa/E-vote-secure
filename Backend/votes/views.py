
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
import hashlib
import secrets
import json

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
from django.db.models import Count


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


class COPendingVotesView(APIView):
    """
    GET /api/votes/co/pending/ - Récupérer les votes en attente de validation CO
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Seul le CO peut accéder
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer les votes avec status='pending_co'
        votes = Vote.objects.filter(
            status='pending_co'
        ).select_related('election', 'voter').order_by('-submitted_at')
        
        # Sérialiser
        data = []
        for vote in votes:
            data.append({
                'id': vote.id,
                'election_id': vote.election.id,
                'election_title': vote.election.title,
                'voter_id': vote.voter.id,
                'voter_username': vote.voter.username,
                'm1_identity': vote.m1_identity,
                'unique_id': vote.unique_id,
                'submitted_at': vote.submitted_at,
            })
        
        return Response(data, status=status.HTTP_200_OK)


class COVerifyVoteView(APIView):
    """
    POST /api/votes/co/verify/ - Valider ou rejeter un vote
    ✅ MODIFIÉ: Extrait et stocke le linking_id de M1
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Seul le CO peut accéder
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        action = request.data.get('action')  # 'approve' ou 'reject'
        
        if not vote_id or not action:
            return Response({
                'error': 'vote_id et action sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action not in ['approve', 'reject']:
            return Response({
                'error': 'action doit être "approve" ou "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer le vote
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_co':
            return Response({
                'error': 'Ce vote n\'est pas en attente de validation CO'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'approve':
            # ✅ NOUVEAU: Déchiffrer M1 pour extraire le linking_id
            from votes.crypto_utils import decrypt_message
            
            try:
                election = vote.election
                decrypted_m1 = decrypt_message(vote.m1_identity, election.co_private_key)
                identity_data = json.loads(decrypted_m1)
                
                # Extraire et stocker le linking_id
                linking_id = identity_data.get('linking_id')
                
                if not linking_id:
                    return Response({
                        'error': 'linking_id manquant dans M1'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Stocker le linking_id dans le vote
                vote.linking_id = linking_id
                vote.status = 'pending_de'
                vote.co_verified_at = timezone.now()
                vote.co_verified_by = request.user
                vote.save()
                
                message = 'Vote approuvé et transféré au DE'
                
            except Exception as e:
                return Response({
                    'error': f'Erreur lors du déchiffrement: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Rejeter
            vote.status = 'rejected_co'
            vote.co_verified_at = timezone.now()
            vote.co_verified_by = request.user
            vote.save()
            
            message = 'Vote rejeté'
        
        return Response({
            'message': message,
            'vote_id': vote.id,
            'new_status': vote.status
        }, status=status.HTTP_200_OK)


class DEPendingBallotsView(APIView):
    """
    GET /api/votes/de/pending/ - Récupérer les bulletins approuvés par le CO
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Seul le DE peut accéder
        if request.user.role != 'de':
            return Response({
                'error': 'Accès réservé au DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Filtrer par élection si fourni
        election_id = request.query_params.get('election_id')
        
        # Récupérer les votes avec status='pending_de'
        votes_query = Vote.objects.filter(status='pending_de')
        
        if election_id:
            votes_query = votes_query.filter(election_id=election_id)
        
        votes = votes_query.select_related('election').order_by('-co_verified_at')
        
        # Sérialiser
        data = []
        for vote in votes:
            data.append({
                'id': vote.id,
                'election_id': vote.election.id,
                'election_title': vote.election.title,
                'm2_ballot': vote.m2_ballot,
                'unique_id': vote.unique_id,
                'submitted_at': vote.submitted_at,
                'co_verified_at': vote.co_verified_at,
            })
        
        return Response(data, status=status.HTTP_200_OK)


class DEDecryptBallotView(APIView):
    """
    POST /api/votes/de/decrypt/ - Déchiffrer et comptabiliser un bulletin
    ✅ MODIFIÉ: Vérifie que linking_id de M2 correspond à celui du CO
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Seul le DE peut accéder
        if request.user.role != 'de':
            return Response({
                'error': 'Accès réservé au DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        
        if not vote_id:
            return Response({
                'error': 'vote_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer le vote
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_de':
            return Response({
                'error': 'Ce vote n\'est pas en attente de déchiffrement DE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ NOUVEAU: Déchiffrer M2 et vérifier le linking_id
        from votes.crypto_utils import decrypt_message
        
        try:
            election = vote.election
            decrypted_m2 = decrypt_message(vote.m2_ballot, election.de_private_key)
            ballot_data = json.loads(decrypted_m2)
            
            # Vérifier la cohérence avec linking_id
            linking_id_from_m2 = ballot_data.get('linking_id')
            linking_id_from_co = vote.linking_id
            
            if not linking_id_from_m2:
                return Response({
                    'error': 'linking_id manquant dans M2'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if linking_id_from_m2 != linking_id_from_co:
                # Incohérence détectée!
                vote.status = 'rejected_de'
                vote.de_verified_at = timezone.now()
                vote.de_verified_by = request.user
                vote.save()
                
                return Response({
                    'error': 'Incohérence détectée: linking_id ne correspond pas'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Tout est OK, créer le bulletin déchiffré
            candidate_id = ballot_data.get('candidate_id')
            
            if not candidate_id:
                return Response({
                    'error': 'candidate_id manquant dans M2'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier que le candidat existe
            candidate = get_object_or_404(Candidate, pk=candidate_id)
            
            # Créer le bulletin déchiffré (SANS linking_id pour anonymat)
            DecryptedBallot.objects.create(
                election=election,
                candidate=candidate,
                unique_id=vote.unique_id,
                decrypted_by=request.user
            )
            
            # Marquer le vote comme compté
            vote.status = 'counted'
            vote.de_verified_at = timezone.now()
            vote.de_verified_by = request.user
            vote.save()
            
            return Response({
                'message': 'Bulletin déchiffré et comptabilisé avec succès',
                'vote_id': vote.id,
                'candidate_id': candidate_id,
                'new_status': vote.status
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors du déchiffrement: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class DEElectionResultsView(APIView):
    """
    GET /api/votes/de/results/<election_id>/ - Obtenir les résultats d'une élection
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, election_id):
        # Seul le DE et l'admin peuvent accéder
        if request.user.role not in ['de', 'admin']:
            return Response({
                'error': 'Accès réservé au DE et Admin'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Compter les votes comptabilisés
        counted_votes = Vote.objects.filter(
            election=election,
            status='counted'
        ).count()
        
        # Récupérer les bulletins déchiffrés
        decrypted_ballots = DecryptedBallot.objects.filter(
            election=election
        ).values('candidate_id').annotate(
            vote_count=Count('id')
        )
        
        # Formater les résultats
        results = []
        for ballot in decrypted_ballots:
            try:
                candidate = Candidate.objects.get(pk=ballot['candidate_id'])
                results.append({
                    'candidate_id': candidate.id,
                    'candidate_name': candidate.name,
                    'candidate_party': candidate.party,
                    'vote_count': ballot['vote_count']
                })
            except Candidate.DoesNotExist:
                pass
        
        # Trier par nombre de votes
        results.sort(key=lambda x: x['vote_count'], reverse=True)
        
        return Response({
            'election_id': election.id,
            'election_title': election.title,
            'total_counted': counted_votes,
            'total_voters': election.total_voters,
            'participation_rate': election.participation_rate,
            'results': results
        }, status=status.HTTP_200_OK)