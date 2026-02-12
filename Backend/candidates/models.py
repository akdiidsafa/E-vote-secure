from django.db import models

from elections.models import Election


class Candidate(models.Model):
    """
    Candidate Model
    Represents a candidate in an election
    """
    # Basic information
    name = models.CharField(max_length=255, verbose_name="Nom complet")
    party = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Parti politique"
    )
    program = models.TextField(verbose_name="Programme électoral")
    photo = models.ImageField(
        upload_to='candidate_photos/',
        blank=True,
        null=True,
        verbose_name="Photo"
    )
    
    # Election relationship
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name='candidates',
        verbose_name="Élection"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
    # Order in ballot
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    
    class Meta:
        ordering = ['election', 'order', 'name']
        verbose_name = 'Candidat'
        verbose_name_plural = 'Candidats'
        unique_together = ['election', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.election.title}"
    
    @property
    def total_votes(self):
        """Get total votes for this candidate"""
        return self.votes.count()