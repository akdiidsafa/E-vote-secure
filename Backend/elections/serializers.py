

from rest_framework import serializers
from .models import Election, ElectionVoterAssignment
from authentication.serializers import UserSerializer


class ElectionSerializer(serializers.ModelSerializer):
    """
    Serializer for Election model
    Includes calculated properties
    """
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    total_candidates = serializers.IntegerField(read_only=True)
    total_voters = serializers.IntegerField(read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    participation_rate = serializers.FloatField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    has_voted = serializers.SerializerMethodField()
    
    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'status',
            'start_date', 'end_date', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'total_candidates', 'total_voters',
            'total_votes', 'participation_rate', 'is_active',
            'has_voted'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_has_voted(self, obj):
        """Vérifie si l'utilisateur actuel a voté pour cette élection"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        if request.user.role != 'voter':
            return False
        
        # Vérifier via ElectionVoterAssignment
        assignment = ElectionVoterAssignment.objects.filter(
            election=obj,
            voter=request.user
        ).first()
        
        return assignment.has_voted if assignment else False


class ElectionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating elections
    """
    class Meta:
        model = Election
        fields = [
            'title', 'description', 'start_date', 'end_date',
            'allow_multiple_votes', 'is_public'
        ]


class ElectionVoterAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Election-Voter assignments
    """
    voter_details = UserSerializer(source='voter', read_only=True)
    election_title = serializers.CharField(source='election.title', read_only=True)
    
    class Meta:
        model = ElectionVoterAssignment
        fields = [
            'id', 'election', 'election_title', 'voter',
            'voter_details', 'assigned_at', 'has_voted'
        ]
        read_only_fields = ['id', 'assigned_at', 'has_voted']


class BulkAssignVotersSerializer(serializers.Serializer):
    """
    Serializer for bulk assigning voters to an election
    """
    election_id = serializers.IntegerField()
    voter_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )