from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class Election(models.Model):
    """
    Election Model
    Represents an election with its details and status
    """
    STATUS_CHOICES = (
        ('draft', 'Brouillon'),
        ('waiting', 'En attente'),
        ('open', 'Ouverte'),
        ('closed', 'Fermée'),
        ('archived', 'Archivée'),
    )
    
    # Basic information
    title = models.CharField(max_length=255, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    
    # Dates
    start_date = models.DateTimeField(verbose_name="Date de début")
    end_date = models.DateTimeField(verbose_name="Date de fin")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="Statut"
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_elections',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
    # Settings
    allow_multiple_votes = models.BooleanField(
        default=False,
        verbose_name="Permettre plusieurs votes"
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Élection publique"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Élection'
        verbose_name_plural = 'Élections'
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self):
        """Validate that end_date is after start_date"""
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': 'La date de fin doit être après la date de début.'
            })
    
    @property
    def is_active(self):
        """Check if election is currently active"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status == 'open' and
            self.start_date <= now <= self.end_date
        )
    
    @property
    def total_candidates(self):
        """Get total number of candidates"""
        return self.candidates.count()
    
    @property
    def total_voters(self):
        """Get total number of assigned voters"""
        return self.assigned_voters.count()
    
    @property
    def total_votes(self):
        """Get total number of votes cast"""
        return self.votes.count()
    
    @property
    def participation_rate(self):
        """Calculate participation rate"""
        if self.total_voters == 0:
            return 0.0
        return round((self.total_votes / self.total_voters) * 100, 2)


class ElectionVoterAssignment(models.Model):
    """
    Model to assign voters to specific elections
    Many-to-Many relationship with additional fields
    """
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name='assigned_voters',
        verbose_name="Élection"
    )
    voter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'voter'},
        related_name='assigned_elections',
        verbose_name="Électeur"
    )
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'assignation")
    has_voted = models.BooleanField(default=False, verbose_name="A voté")
    
    class Meta:
        unique_together = ['election', 'voter']
        verbose_name = 'Assignation Électeur'
        verbose_name_plural = 'Assignations Électeurs'
    
    def __str__(self):
        return f"{self.voter.username} → {self.election.title}"