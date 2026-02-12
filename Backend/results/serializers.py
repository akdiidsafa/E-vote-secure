from rest_framework import serializers
from .models import ElectionResult, CandidateResult
from candidates.serializers import CandidateSerializer


class CandidateResultSerializer(serializers.ModelSerializer):
    """
    Serializer for CandidateResult model
    """
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_party = serializers.CharField(source='candidate.party', read_only=True)
    candidate_photo = serializers.ImageField(source='candidate.photo', read_only=True)
    
    class Meta:
        model = CandidateResult
        fields = [
            'id', 'candidate', 'candidate_name', 'candidate_party',
            'candidate_photo', 'vote_count', 'percentage', 'rank'
        ]


class ElectionResultSerializer(serializers.ModelSerializer):
    """
    Serializer for ElectionResult model
    """
    election_title = serializers.CharField(source='election.title', read_only=True)
    candidate_results = CandidateResultSerializer(many=True, read_only=True)
    published_by_name = serializers.CharField(source='published_by.username', read_only=True)
    
    class Meta:
        model = ElectionResult
        fields = [
            'id', 'election', 'election_title',
            'total_votes_cast', 'total_valid_votes', 'total_invalid_votes',
            'is_published', 'published_at', 'published_by', 'published_by_name',
            'calculated_at', 'updated_at', 'candidate_results'
        ]
        read_only_fields = ['id', 'calculated_at', 'updated_at']