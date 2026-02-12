from rest_framework import serializers
from .models import Vote, DecryptedBallot, VoteReceipt
from candidates.models import Candidate


class VoteSubmitSerializer(serializers.Serializer):
    """
    Serializer for submitting a vote
    Receives the double-encrypted vote package from frontend
    """
    election_id = serializers.IntegerField()
    m1_identity = serializers.CharField()  # Encrypted with CO's public key
    m2_ballot = serializers.CharField()     # Encrypted with DE's public key
    unique_id = serializers.CharField()
    
    def validate_unique_id(self, value):
        """Ensure unique_id is not already used"""
        if Vote.objects.filter(unique_id=value).exists():
            raise serializers.ValidationError(
                "Cet ID unique existe déjà. Veuillez réessayer."
            )
        return value


class VoteSerializer(serializers.ModelSerializer):
    """
    Serializer for Vote model
    """
    voter_username = serializers.CharField(source='voter.username', read_only=True)
    voter_name = serializers.SerializerMethodField()
    election_title = serializers.CharField(source='election.title', read_only=True)
    
    class Meta:
        model = Vote
        fields = [
            'id', 'election', 'election_title', 'voter', 'voter_username',
            'voter_name', 'm1_identity', 'm2_ballot', 'unique_id',
            'status', 'submitted_at', 'verified_by_co',
            'co_verification_date', 'co_notes'
        ]
        read_only_fields = [
            'id', 'submitted_at', 'verified_by_co',
            'co_verification_date'
        ]
    
    def get_voter_name(self, obj):
        """Return full name of voter"""
        return f"{obj.voter.first_name} {obj.voter.last_name}".strip() or obj.voter.username


class COVoteVerificationSerializer(serializers.Serializer):
    """
    Serializer for CO to verify identity and approve/reject vote
    """
    vote_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # This would contain the decrypted identity (for CO's verification only)
    # In production, this decryption would happen server-side with CO's private key
    # For now, we'll handle this as a comment/placeholder
    # decrypted_identity = serializers.JSONField(required=False)


class DecryptedBallotSerializer(serializers.ModelSerializer):
    """
    Serializer for DecryptedBallot model
    """
    election_title = serializers.CharField(source='election.title', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = DecryptedBallot
        fields = [
            'id', 'election', 'election_title', 'candidate',
            'candidate_name', 'unique_id', 'decrypted_by',
            'decrypted_at'
        ]
        read_only_fields = ['id', 'decrypted_at', 'decrypted_by']


class DEBallotDecryptSerializer(serializers.Serializer):
    """
    Serializer for DE to decrypt and count ballots
    """
    unique_id = serializers.CharField()
    candidate_id = serializers.IntegerField()
    
    def validate_candidate_id(self, value):
        """Ensure candidate exists"""
        if not Candidate.objects.filter(id=value).exists():
            raise serializers.ValidationError("Candidat invalide.")
        return value


class VoteReceiptSerializer(serializers.ModelSerializer):
    """
    Serializer for VoteReceipt model
    """
    election_title = serializers.CharField(source='vote.election.title', read_only=True)
    
    class Meta:
        model = VoteReceipt
        fields = [
            'id', 'vote', 'receipt_code', 'election_title',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']