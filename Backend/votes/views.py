from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import FileResponse
from django.db.models import Count
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import hashlib
import secrets
import json
import io
import os

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


# ==================== VOTER ENDPOINTS ====================

class SubmitVoteView(APIView):
    """
    POST /api/votes/submit/ - Submit an encrypted vote
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'voter':
            return Response({
                'error': 'Seuls les électeurs peuvent voter.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = VoteSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        election_id = serializer.validated_data['election_id']
        election = get_object_or_404(Election, pk=election_id)
        
        if election.status != 'open':
            return Response({
                'error': 'Cette élection n\'est pas ouverte au vote.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        assignment = ElectionVoterAssignment.objects.filter(
            election=election,
            voter=request.user
        ).first()
        
        if not assignment:
            return Response({
                'error': 'Vous n\'êtes pas assigné à cette élection.'
            }, status=status.HTTP_403_FORBIDDEN)
        
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


# ==================== CO ENDPOINTS (NOUVEAUX) ====================

class COElectionVotesView(APIView):
    """
    GET /api/votes/co/election/<election_id>/
    Liste tous les votes d'une élection pour le CO
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, election_id):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        votes = Vote.objects.filter(election=election).select_related('voter', 'election')
        
        # Séparer par statut
        pending_votes = votes.filter(status='pending_co')
        approved_votes = votes.filter(status__in=['pending_de', 'counted'])
        rejected_votes = votes.filter(status='rejected_co')
        
        return Response({
            'election': {
                'id': election.id,
                'title': election.title,
                'status': election.status,
            },
            'pending': VoteSerializer(pending_votes, many=True).data,
            'approved': VoteSerializer(approved_votes, many=True).data,
            'rejected': VoteSerializer(rejected_votes, many=True).data,
            'stats': {
                'total': votes.count(),
                'pending': pending_votes.count(),
                'approved': approved_votes.count(),
                'rejected': rejected_votes.count(),
            }
        })


class COApproveVoteView(APIView):
    """
    POST /api/votes/co/approve/
     Approuver un vote et générer le PDF M2
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_co':
            return Response({
                'error': 'Ce vote a déjà été traité'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Déchiffrer M1 pour extraire le linking_id
        from votes.crypto_utils import decrypt_message
        
        try:
            election = vote.election
            decrypted_m1 = decrypt_message(vote.m1_identity, election.co_private_key)
            identity_data = json.loads(decrypted_m1)
            
            linking_id = identity_data.get('linking_id')
            
            if not linking_id:
                return Response({
                    'error': 'linking_id manquant dans M1'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Stocker le linking_id
            vote.linking_id = linking_id
            vote.status = 'pending_de'
            vote.co_verified_at = timezone.now()
            vote.co_verified_by = request.user
            
            # Générer le PDF M2
            pdf_file = self.generate_m2_pdf(vote)
            vote.m2_pdf = pdf_file
            vote.save()
            
            return Response({
                'message': 'Vote approuvé avec succès',
                'vote': VoteSerializer(vote).data
            })
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors du traitement: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_m2_pdf(self, vote):
        """ Génère le PDF M2 avec le bulletin chiffré"""
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # En-tête
        p.setFont("Helvetica-Bold", 20)
        p.drawCentredString(width/2, height - 3*cm, "🗳️ BULLETIN DE VOTE CHIFFRÉ (M2)")
        
        # Ligne de séparation
        p.setStrokeColorRGB(0.2, 0.4, 0.8)
        p.setLineWidth(2)
        p.line(3*cm, height - 4*cm, width - 3*cm, height - 4*cm)
        
        # Informations
        p.setFont("Helvetica-Bold", 12)
        y = height - 6*cm
        
        p.drawString(3*cm, y, "ID du Vote:")
        p.setFont("Helvetica", 12)
        p.drawString(8*cm, y, str(vote.unique_id))
        
        y -= 1*cm
        p.setFont("Helvetica-Bold", 12)
        p.drawString(3*cm, y, "Date de soumission:")
        p.setFont("Helvetica", 12)
        p.drawString(8*cm, y, vote.submitted_at.strftime('%d/%m/%Y %H:%M:%S'))
        
        y -= 1*cm
        p.setFont("Helvetica-Bold", 12)
        p.drawString(3*cm, y, "Votant:")
        p.setFont("Helvetica", 12)
        p.drawString(8*cm, y, vote.voter_full_name)
        
        y -= 1*cm
        p.setFont("Helvetica-Bold", 12)
        p.drawString(3*cm, y, "Élection:")
        p.setFont("Helvetica", 12)
        p.drawString(8*cm, y, vote.election.title)
        
        # Séparation
        y -= 1.5*cm
        p.setStrokeColorRGB(0.8, 0.8, 0.8)
        p.line(3*cm, y, width - 3*cm, y)
        
        # Message chiffré M2
        y -= 1*cm
        p.setFont("Helvetica-Bold", 14)
        p.drawString(3*cm, y, "BULLETIN CHIFFRÉ (M2):")
        
        y -= 1*cm
        p.setFont("Courier", 8)
        
        # Afficher le message chiffré
        m2_lines = vote.m2_ballot.split('\n')
        for line in m2_lines[:35]:
            if y < 4*cm:
                break
            p.drawString(3*cm, y, line[:85])
            y -= 0.45*cm
        
        # Note en bas de page
        y = 3*cm
        p.setFont("Helvetica-Oblique", 10)
        p.setFillColorRGB(0.5, 0.5, 0.5)
        p.drawCentredString(width/2, y, "⚠️ Ce bulletin est anonyme et chiffré avec OpenPGP")
        y -= 0.6*cm
        p.drawCentredString(width/2, y, "Déchiffrable uniquement par le DE (Centre de Dépouillement)")
        
        p.showPage()
        p.save()
        
        # Sauvegarder le fichier
        buffer.seek(0)
        filename = f'M2_Vote_{vote.unique_id}.pdf'
        
        from django.core.files.base import ContentFile
        return ContentFile(buffer.read(), name=filename)


class CORejectVoteView(APIView):
    """
    POST /api/votes/co/reject/
    Rejeter un vote
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        reason = request.data.get('reason', '')
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_co':
            return Response({
                'error': 'Ce vote a déjà été traité'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vote.status = 'rejected_co'
        vote.co_verified_at = timezone.now()
        vote.co_verified_by = request.user
        vote.save()
        
        return Response({
            'message': 'Vote rejeté',
            'vote': VoteSerializer(vote).data
        })


class CODownloadM2PDFView(APIView):
    """
    GET /api/votes/co/<vote_id>/download-m2/
    Télécharger le PDF M2
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, vote_id):
        if request.user.role not in ['co', 'de']:
            return Response({
                'error': 'Accès réservé au CO et DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if not vote.m2_pdf:
            return Response({
                'error': 'PDF non disponible'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return FileResponse(
            vote.m2_pdf.open('rb'),
            as_attachment=True,
            filename=f'M2_Vote_{vote.unique_id}.pdf'
        )


# ==================== CO ENDPOINTS (ANCIENS - COMPATIBILITÉ) ====================

class COPendingVotesView(APIView):
    """
    GET /api/votes/co/pending/ - ANCIEN: Liste des votes en attente
    DÉPRÉCIÉ: Utiliser /api/votes/co/election/<id>/ à la place
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        votes = Vote.objects.filter(
            status='pending_co'
        ).select_related('election', 'voter').order_by('-submitted_at')
        
        data = []
        for vote in votes:
            data.append({
                'id': vote.id,
                'election_id': vote.election.id,
                'election_title': vote.election.title,
                'voter_id': vote.voter.id,
                'voter_username': vote.voter.username,
                'voter_full_name': vote.voter_full_name,
                'voter_email': vote.voter.email,
                'm1_identity': vote.m1_identity,
                'unique_id': vote.unique_id,
                'submitted_at': vote.submitted_at,
            })
        
        return Response(data, status=status.HTTP_200_OK)


class COVerifyVoteView(APIView):
    """
    POST /api/votes/co/verify/ - ANCIEN: Valider/rejeter un vote
    ⚠️ DÉPRÉCIÉ: Utiliser /api/votes/co/approve/ ou /api/votes/co/reject/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        action = request.data.get('action')
        
        if not vote_id or not action:
            return Response({
                'error': 'vote_id et action sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action not in ['approve', 'reject']:
            return Response({
                'error': 'action doit être "approve" ou "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_co':
            return Response({
                'error': 'Ce vote n\'est pas en attente de validation CO'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'approve':
            from votes.crypto_utils import decrypt_message
            
            try:
                election = vote.election
                decrypted_m1 = decrypt_message(vote.m1_identity, election.co_private_key)
                identity_data = json.loads(decrypted_m1)
                
                linking_id = identity_data.get('linking_id')
                
                if not linking_id:
                    return Response({
                        'error': 'linking_id manquant dans M1'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
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


# ==================== PDF DOWNLOADS ====================

class DownloadM1PDFView(APIView):
    """
    GET /api/votes/<vote_id>/download-m1/ - Télécharger M1 en PDF
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, vote_id):
        if request.user.role != 'co':
            return Response({
                'error': 'Accès réservé au CO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        from .pdf_utils import generate_m1_pdf
        pdf_buffer = generate_m1_pdf(vote)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'M1_identite_vote_{vote.id}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        
        return response


class DownloadM2PDFView(APIView):
    """
    GET /api/votes/<vote_id>/download-m2/ - Télécharger M2 en PDF
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, vote_id):
        if request.user.role not in ['co', 'de']:
            return Response({
                'error': 'Accès réservé au CO et DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        from .pdf_utils import generate_m2_pdf
        pdf_buffer = generate_m2_pdf(vote)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'M2_bulletin_vote_{vote.id}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        
        return response


# ==================== DE ENDPOINTS ====================

class DEPendingBallotsView(APIView):
    """
    GET /api/votes/de/pending/ - Bulletins approuvés par le CO
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'de':
            return Response({
                'error': 'Accès réservé au DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election_id = request.query_params.get('election_id')
        
        votes_query = Vote.objects.filter(status='pending_de')
        
        if election_id:
            votes_query = votes_query.filter(election_id=election_id)
        
        votes = votes_query.select_related('election').order_by('-co_verified_at')
        
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
    POST /api/votes/de/decrypt/ - Déchiffrer et comptabiliser
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'de':
            return Response({
                'error': 'Accès réservé au DE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        
        if not vote_id:
            return Response({
                'error': 'vote_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vote = get_object_or_404(Vote, pk=vote_id)
        
        if vote.status != 'pending_de':
            return Response({
                'error': 'Ce vote n\'est pas en attente de déchiffrement DE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from votes.crypto_utils import decrypt_message
        
        try:
            election = vote.election
            decrypted_m2 = decrypt_message(vote.m2_ballot, election.de_private_key)
            ballot_data = json.loads(decrypted_m2)
            
            linking_id_from_m2 = ballot_data.get('linking_id')
            linking_id_from_co = vote.linking_id
            
            if not linking_id_from_m2:
                return Response({
                    'error': 'linking_id manquant dans M2'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if linking_id_from_m2 != linking_id_from_co:
                vote.status = 'rejected_de'
                vote.de_verified_at = timezone.now()
                vote.de_verified_by = request.user
                vote.save()
                
                return Response({
                    'error': 'Incohérence détectée: linking_id ne correspond pas'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            candidate_id = ballot_data.get('candidate_id')
            
            if not candidate_id:
                return Response({
                    'error': 'candidate_id manquant dans M2'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            candidate = get_object_or_404(Candidate, pk=candidate_id)
            
            DecryptedBallot.objects.create(
                election=election,
                candidate=candidate,
                unique_id=vote.unique_id,
                decrypted_by=request.user
            )
            
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


class DEElectionResultsView(APIView):
    """
    GET /api/votes/de/results/<election_id>/ - Résultats d'une élection
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, election_id):
        if request.user.role not in ['de', 'admin']:
            return Response({
                'error': 'Accès réservé au DE et Admin'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        counted_votes = Vote.objects.filter(
            election=election,
            status='counted'
        ).count()
        
        decrypted_ballots = DecryptedBallot.objects.filter(
            election=election
        ).values('candidate_id').annotate(
            vote_count=Count('id')
        )
        
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
        
        results.sort(key=lambda x: x['vote_count'], reverse=True)
        
        return Response({
            'election_id': election.id,
            'election_title': election.title,
            'total_counted': counted_votes,
            'total_voters': election.total_voters,
            'participation_rate': election.participation_rate,
            'results': results
        }, status=status.HTTP_200_OK)