from django.db import models
from elections.models import Election
from candidates.models import Candidate
from django.contrib.auth import get_user_model

User = get_user_model()


class ElectionResult(models.Model):
    """
    Election Result Model
    Stores final aggregated results for an election
    """
    election = models.OneToOneField(
        Election,
        on_delete=models.CASCADE,
        related_name='result',
        verbose_name="Élection"
    )
    
    # Result data
    total_votes_cast = models.IntegerField(default=0, verbose_name="Total votes")
    total_valid_votes = models.IntegerField(default=0, verbose_name="Votes valides")
    total_invalid_votes = models.IntegerField(default=0, verbose_name="Votes invalides")
    
    # Publication
    is_published = models.BooleanField(default=False, verbose_name="Publié")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de publication")
    published_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_results',
        verbose_name="Publié par"
    )
    
    # Metadata
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de calcul")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
    class Meta:
        verbose_name = 'Résultat d\'Élection'
        verbose_name_plural = 'Résultats d\'Élections'
    
    def __str__(self):
        return f"Résultat - {self.election.title}"


class CandidateResult(models.Model):
    """
    Candidate Result Model
    Stores vote count for each candidate
    """
    election_result = models.ForeignKey(
        ElectionResult,
        on_delete=models.CASCADE,
        related_name='candidate_results',
        verbose_name="Résultat de l'élection"
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name="Candidat"
    )
    
    # Vote counts
    vote_count = models.IntegerField(default=0, verbose_name="Nombre de votes")
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        verbose_name="Pourcentage"
    )
    
    # Ranking
    rank = models.IntegerField(default=0, verbose_name="Rang")
    
    class Meta:
        ordering = ['rank', '-vote_count']
        unique_together = ['election_result', 'candidate']
        verbose_name = 'Résultat de Candidat'
        verbose_name_plural = 'Résultats des Candidats'
    
    def __str__(self):
        return f"{self.candidate.name}: {self.vote_count} votes ({self.percentage}%)"