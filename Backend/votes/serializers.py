

from rest_framework import serializers
from .models import Vote, DecryptedBallot, VoteReceipt
from candidates.models import Candidate


class VoteSubmitSerializer(serializers.Serializer):
    """
    Serializer for submitting a vote
    Receives the double-encrypted vote package from frontend
    """
    election_id = serializers.IntegerField()
    m1_identity = serializers.CharField()  
    m2_ballot = serializers.CharField()    
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
    ✅ CORRIGÉ: Utilisation de SerializerMethodField pour voter_full_name
    """
    # Informations du votant depuis la relation
    voter_username = serializers.CharField(source='voter.username', read_only=True)
    voter_email = serializers.EmailField(source='voter.email', read_only=True)
    voter_first_name = serializers.CharField(source='voter.first_name', read_only=True)
    voter_last_name = serializers.CharField(source='voter.last_name', read_only=True)
    
    # ✅ CORRIGÉ: SerializerMethodField au lieu de CharField avec source
    voter_full_name = serializers.SerializerMethodField()
    
    # Informations de l'élection
    election_title = serializers.CharField(source='election.title', read_only=True)
    
    # PDF M2
    m2_pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Vote
        fields = [
            'id',
            'election',
            'election_title',
            'voter',
            'voter_username',
            'voter_email',
            'voter_full_name',
            'voter_first_name',
            'voter_last_name',
            'm1_identity',
            'm2_ballot',
            'unique_id',
            'linking_id',
            'status',
            'submitted_at',
            'co_verified_at',
            'co_verified_by',
            'de_verified_at',
            'de_verified_by',
            'm2_pdf',
            'm2_pdf_url',
        ]
        read_only_fields = [
            'id',
            'submitted_at',
            'co_verified_at',
            'de_verified_at',
        ]
    
    def get_voter_full_name(self, obj):
        """
        Retourne le nom complet du votant
        ✅ NOUVEAU: Méthode pour générer voter_full_name
        """
        if obj.voter:
            if obj.voter.first_name and obj.voter.last_name:
                return f"{obj.voter.first_name} {obj.voter.last_name}"
            return obj.voter.username
        return "Anonyme"
    
    def get_m2_pdf_url(self, obj):
        """
        Retourne l'URL du PDF M2 si disponible
        """
        if obj.m2_pdf:
            return obj.m2_pdf.url
        return None


class COVoteVerificationSerializer(serializers.Serializer):
    """
    Serializer for CO to verify identity and approve/reject vote
    """
    vote_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)


class DecryptedBallotSerializer(serializers.ModelSerializer):
    """
    Serializer for DecryptedBallot model
    """
    election_title = serializers.CharField(source='election.title', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = DecryptedBallot
        fields = [
            'id',
            'election',
            'election_title',
            'candidate',
            'candidate_name',
            'unique_id',
            'decrypted_by',
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
            'id',
            'vote',
            'receipt_code',
            'election_title',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']