from django.shortcuts import render

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone

from .models import Election, ElectionVoterAssignment
from .serializers import (
    ElectionSerializer,
    ElectionCreateSerializer,
    ElectionVoterAssignmentSerializer,
    BulkAssignVotersSerializer
)
from authentication.models import User


class ElectionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/elections/ - List all elections
    POST /api/elections/ - Create new election
    """
    queryset = Election.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ElectionCreateSerializer
        return ElectionSerializer
    
    def get_queryset(self):
        """Filter elections based on user role"""
        user = self.request.user
        queryset = Election.objects.all()
        
        # Voters only see elections they're assigned to and that are active
        if user.role == 'voter':
            queryset = queryset.filter(
                assigned_voters__voter=user,
                status='open'
            )
        
        # Add status filter if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


class ElectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/elections/<id>/ - Get election details
    PUT/PATCH /api/elections/<id>/ - Update election
    DELETE /api/elections/<id>/ - Delete election
    """
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Election.objects.all()
        elif user.role == 'voter':
            return Election.objects.filter(assigned_voters__voter=user)
        
        return Election.objects.none()


class ElectionOpenView(APIView):
    """
    POST /api/elections/<id>/open/ - Open an election for voting
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        # Only admin can open elections
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut ouvrir une élection.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=pk)
        
        # Check if election can be opened
        if election.status == 'open':
            return Response({
                'error': 'Cette élection est déjà ouverte.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if election has candidates
        if election.total_candidates == 0:
            return Response({
                'error': 'Impossible d\'ouvrir une élection sans candidats.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Open election
        election.status = 'open'
        election.save()
        
        return Response({
            'message': 'Élection ouverte avec succès.',
            'election': ElectionSerializer(election).data
        }, status=status.HTTP_200_OK)


class ElectionCloseView(APIView):
    """
    POST /api/elections/<id>/close/ - Close an election
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        # Only admin can close elections
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut fermer une élection.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=pk)
        
        # Check if election can be closed
        if election.status == 'closed':
            return Response({
                'error': 'Cette élection est déjà fermée.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Close election
        election.status = 'closed'
        election.save()
        
        return Response({
            'message': 'Élection fermée avec succès.',
            'election': ElectionSerializer(election).data
        }, status=status.HTTP_200_OK)


class AssignVotersView(APIView):
    """
    POST /api/elections/assign-voters/ - Bulk assign voters to election
    REMPLACE toutes les assignations existantes
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only admin can assign voters
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut assigner des électeurs.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkAssignVotersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        election_id = serializer.validated_data['election_id']
        voter_ids = serializer.validated_data['voter_ids']
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Get voters
        voters = User.objects.filter(id__in=voter_ids, role='voter')
        
        if voters.count() != len(voter_ids):
            return Response({
                'error': 'Certains électeurs sont invalides.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ← FIX: SUPPRIMER toutes les anciennes assignations
        ElectionVoterAssignment.objects.filter(election=election).delete()
        
        # ← FIX: CRÉER les nouvelles assignations
        assignments_created = 0
        for voter in voters:
            ElectionVoterAssignment.objects.create(
                election=election,
                voter=voter
            )
            assignments_created += 1
        
        return Response({
            'message': f'{assignments_created} électeur(s) assigné(s) avec succès.',
            'election_id': election.id,
            'total_assigned': election.total_voters
        }, status=status.HTTP_200_OK)


class ElectionVotersView(generics.ListAPIView):
    """
    GET /api/elections/<id>/voters/ - Get all voters assigned to an election
    """
    serializer_class = ElectionVoterAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        election_id = self.kwargs.get('pk')
        return ElectionVoterAssignment.objects.filter(
            election_id=election_id
        ).select_related('voter', 'election')


class ElectionStatsView(APIView):
    """
    GET /api/elections/<id>/stats/ - Get election statistics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        
        # Only admin and assigned voters can see stats
        if request.user.role == 'voter':
            if not ElectionVoterAssignment.objects.filter(
                election=election,
                voter=request.user
            ).exists():
                return Response({
                    'error': 'Vous n\'êtes pas autorisé à voir ces statistiques.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        stats = {
            'election_id': election.id,
            'title': election.title,
            'status': election.status,
            'total_candidates': election.total_candidates,
            'total_voters': election.total_voters,
            'total_votes': election.total_votes,
            'participation_rate': election.participation_rate,
            'is_active': election.is_active,
            'start_date': election.start_date,
            'end_date': election.end_date,
        }
        
       