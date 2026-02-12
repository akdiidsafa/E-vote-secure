from django.db import models
from django.contrib.auth import get_user_model
from elections.models import Election
from candidates.models import Candidate

User = get_user_model()


class Vote(models.Model):
    """
    Vote Model
    Stores encrypted vote data with double encryption
    M1 (Message 1): Encrypted identity for CO (Counting Office)
    M2 (Message 2): Encrypted ballot for DE (Decryption Entity)
    """
    STATUS_CHOICES = (
        ('pending_co', 'En attente CO'),
        ('approved_co', 'Approuvé par CO'),
        ('rejected_co', 'Rejeté par CO'),
        ('pending_de', 'En attente DE'),
        ('counted', 'Compté'),
    )
    
    # Election and voter reference
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name="Élection"
    )
    voter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='votes',
        limit_choices_to={'role': 'voter'},
        verbose_name="Électeur"
    )
    
    # Encrypted messages
    m1_identity = models.TextField(
        verbose_name="Message 1 (Identité chiffrée)",
        help_text="Encrypted with CO's public key"
    )
    m2_ballot = models.TextField(
        verbose_name="Message 2 (Bulletin chiffré)",
        help_text="Encrypted with DE's public key"
    )
    
    # Unique ID to link M1 and M2 without revealing identity
    unique_id = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="ID Unique"
    )
    
    # Status and timestamps
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_co',
        verbose_name="Statut"
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de soumission"
    )
    
    # CO verification
    verified_by_co = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_votes',
        limit_choices_to={'role': 'co'},
        verbose_name="Vérifié par CO"
    )
    co_verification_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de vérification CO"
    )
    co_notes = models.TextField(
        blank=True,
        verbose_name="Notes CO"
    )
    
    # Decrypted data (only after CO approval)
    # IMPORTANT: This is stored ONLY after identity verification
    # The actual vote choice is NEVER stored here
    decrypted_identity = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Identité déchiffrée",
        help_text="Only contains voter info, NOT vote choice"
    )
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'
        unique_together = ['election', 'voter']
    
    def __str__(self):
        return f"Vote {self.unique_id} - {self.election.title}"


class DecryptedBallot(models.Model):
    """
    Decrypted Ballot Model
    Stores ONLY the decrypted vote choice (candidate)
    NO link to voter identity - completely anonymous
    This is what DE (Decryption Entity) works with
    """
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name='decrypted_ballots',
        verbose_name="Élection"
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name="Candidat"
    )
    
    # Link to M2 but NOT to voter
    unique_id = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="ID Unique"
    )
    
    # Decryption info
    decrypted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='decrypted_ballots',
        limit_choices_to={'role': 'de'},
        verbose_name="Déchiffré par"
    )
    decrypted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de déchiffrement"
    )
    
    class Meta:
        ordering = ['-decrypted_at']
        verbose_name = 'Bulletin Déchiffré'
        verbose_name_plural = 'Bulletins Déchiffrés'
    
    def __str__(self):
        return f"Ballot {self.unique_id} → {self.candidate.name}"


class VoteReceipt(models.Model):
    """
    Vote Receipt Model
    Stores a receipt for the voter to confirm their vote was recorded
    Does NOT contain the vote choice
    """
    vote = models.OneToOneField(
        Vote,
        on_delete=models.CASCADE,
        related_name='receipt',
        verbose_name="Vote"
    )
    receipt_code = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="Code de reçu"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Reçu de Vote'
        verbose_name_plural = 'Reçus de Vote'
    
    def __str__(self):
        return f"Receipt {self.receipt_code}"