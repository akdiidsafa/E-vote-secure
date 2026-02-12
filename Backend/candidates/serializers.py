from rest_framework import serializers
from .models import Candidate


class CandidateSerializer(serializers.ModelSerializer):
    """
    Serializer for Candidate model
    """
    election_title = serializers.CharField(source='election.title', read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'name', 'party', 'program', 'photo',
            'election', 'election_title', 'order',
            'total_votes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidateCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating candidates
    """
    class Meta:
        model = Candidate
        fields = ['name', 'party', 'program', 'photo', 'election', 'order']