from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count

from .models import ElectionResult, CandidateResult
from .serializers import ElectionResultSerializer
from elections.models import Election
from votes.models import DecryptedBallot


class CalculateResultsView(APIView):
    """
    POST /api/results/calculate/<election_id>/ - Calculate election results
    Only DE or Admin can trigger this
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, election_id):
        # Only admin or DE can calculate results
        if request.user.role not in ['admin', 'de']:
            return Response({
                'error': 'Seul un administrateur ou le DE peut calculer les résultats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Election must be closed
        if election.status != 'closed':
            return Response({
                'error': 'L\'élection doit être fermée pour calculer les résultats.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all decrypted ballots for this election
        ballots = DecryptedBallot.objects.filter(election=election)
        
        # Count votes per candidate
        vote_counts = ballots.values('candidate').annotate(
            count=Count('candidate')
        ).order_by('-count')
        
        total_votes = ballots.count()
        
        # Create or update election result
        election_result, created = ElectionResult.objects.get_or_create(
            election=election,
            defaults={
                'total_votes_cast': total_votes,
                'total_valid_votes': total_votes,
                'total_invalid_votes': 0
            }
        )
        
        if not created:
            election_result.total_votes_cast = total_votes
            election_result.total_valid_votes = total_votes
            election_result.save()
        
        # Delete old candidate results
        CandidateResult.objects.filter(election_result=election_result).delete()
        
        # Create new candidate results
        rank = 1
        for vote_data in vote_counts:
            candidate_id = vote_data['candidate']
            vote_count = vote_data['count']
            percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0
            
            CandidateResult.objects.create(
                election_result=election_result,
                candidate_id=candidate_id,
                vote_count=vote_count,
                percentage=round(percentage, 2),
                rank=rank
            )
            rank += 1
        
        return Response({
            'message': 'Résultats calculés avec succès.',
            'result': ElectionResultSerializer(election_result).data
        }, status=status.HTTP_200_OK)


class PublishResultsView(APIView):
    """
    POST /api/results/publish/<election_id>/ - Publish election results
    Only Admin can publish
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, election_id):
        # Only admin can publish results
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut publier les résultats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Check if results exist
        try:
            election_result = election.result
        except ElectionResult.DoesNotExist:
            return Response({
                'error': 'Les résultats n\'ont pas encore été calculés.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already published
        if election_result.is_published:
            return Response({
                'error': 'Les résultats sont déjà publiés.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Publish results
        election_result.is_published = True
        election_result.published_at = timezone.now()
        election_result.published_by = request.user
        election_result.save()
        
        return Response({
            'message': 'Résultats publiés avec succès.',
            'result': ElectionResultSerializer(election_result).data
        }, status=status.HTTP_200_OK)


class ElectionResultView(generics.RetrieveAPIView):
    """
    GET /api/results/<election_id>/ - Get election results
    """
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        election_id = self.kwargs.get('election_id')
        election = get_object_or_404(Election, pk=election_id)
        
        try:
            election_result = election.result
        except ElectionResult.DoesNotExist:
            return Response({
                'error': 'Les résultats n\'ont pas encore été calculés.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        user = self.request.user
        
        # Admin and DE can always see results
        if user.role in ['admin', 'de']:
            return election_result
        
        # Voters can only see published results
        if user.role == 'voter':
            if not election_result.is_published:
                return Response({
                    'error': 'Les résultats ne sont pas encore publiés.'
                }, status=status.HTTP_403_FORBIDDEN)
            return election_result
        
        return Response({
            'error': 'Vous n\'êtes pas autorisé à voir ces résultats.'
        }, status=status.HTTP_403_FORBIDDEN)


class PublishedResultsListView(generics.ListAPIView):
    """
    GET /api/results/ - List all published results
    """
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all results
        if user.role == 'admin':
            return ElectionResult.objects.all()
        
        # Others can only see published results
        return ElectionResult.objects.filter(is_published=True)