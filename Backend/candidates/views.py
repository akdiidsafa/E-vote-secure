from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Candidate
from .serializers import CandidateSerializer, CandidateCreateSerializer
from elections.models import Election


class CandidateListCreateView(generics.ListCreateAPIView):
    """
    GET /api/candidates/ - List all candidates
    POST /api/candidates/ - Create new candidate
    """
    queryset = Candidate.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CandidateCreateSerializer
        return CandidateSerializer
    
    def get_queryset(self):
        """Filter candidates by election if provided"""
        queryset = Candidate.objects.all()
        
        election_id = self.request.query_params.get('election', None)
        if election_id:
            queryset = queryset.filter(election_id=election_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Only admin can create candidates
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut créer des candidats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)


class CandidateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/candidates/<id>/ - Get candidate details
    PUT/PATCH /api/candidates/<id>/ - Update candidate
    DELETE /api/candidates/<id>/ - Delete candidate
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        # Only admin can update candidates
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut modifier des candidats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete candidates
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut supprimer des candidats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)


class ElectionCandidatesView(generics.ListAPIView):
    """
    GET /api/elections/<election_id>/candidates/ - Get all candidates for an election
    """
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        election_id = self.kwargs.get('election_id')
        return Candidate.objects.filter(election_id=election_id)