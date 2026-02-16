# from django.contrib.auth.models import AbstractUser
# from django.db import models

# class User(AbstractUser):
#     """
#     Custom User Model
#     Roles: admin, voter, co (Counting Office), de (Decryption Entity)
#     """
#     ROLE_CHOICES = (
#         ('admin', 'Administrateur'),
#         ('voter', 'Électeur'),
#         ('co', 'Centre de Comptage'),
#         ('de', 'Centre de Déploiement'),
#     )
    
#     # Fields
#     email = models.EmailField(unique=True, verbose_name="Email")
#     role = models.CharField(
#         max_length=10, 
#         choices=ROLE_CHOICES, 
#         default='voter',
#         verbose_name="Rôle"
#     )
#     phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
#     photo = models.ImageField(upload_to='user_photos/', blank=True, null=True, verbose_name="Photo")
#     is_email_verified = models.BooleanField(default=False, verbose_name="Email vérifié")
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
#     class Meta:
#         ordering = ['-created_at']
#         verbose_name = 'Utilisateur'
#         verbose_name_plural = 'Utilisateurs'
    
#     def __str__(self):
#         return f"{self.username} ({self.get_role_display()})"
    
#     # Helper properties
#     @property
#     def is_admin(self):
#         return self.role == 'admin'
    
#     @property
#     def is_voter(self):
#         return self.role == 'voter'
    
#     @property
#     def is_co(self):
#         return self.role == 'co'
    
#     @property
#     def is_de(self):
#         return self.role == 'de'
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from datetime import timedelta
from django.utils import timezone


class User(AbstractUser):
    """
    Custom User Model
    Roles: admin, voter, co (Counting Office), de (Decryption Entity)
    """
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('voter', 'Électeur'),
        ('co', 'Centre de Comptage'),
        ('de', 'Centre de Déploiement'),
    )
    
    # Fields
    email = models.EmailField(unique=True, verbose_name="Email")
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        default='voter',
        verbose_name="Rôle"
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    photo = models.ImageField(upload_to='user_photos/', blank=True, null=True, verbose_name="Photo")
    avatar = models.CharField(max_length=500, blank=True, null=True)  # URL avatar
    bio = models.TextField(blank=True, null=True, verbose_name="Biographie")
    organization = models.CharField(max_length=255, blank=True, null=True, verbose_name="Organisation")
    is_email_verified = models.BooleanField(default=False, verbose_name="Email vérifié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    # Helper properties
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_voter(self):
        return self.role == 'voter'
    
    @property
    def is_co(self):
        return self.role == 'co'
    
    @property
    def is_de(self):
        return self.role == 'de'


class VoterInvitation(models.Model):
    """
    Gère le processus d'invitation et de validation des votants
    """
    STATUS_CHOICES = [
        ('INVITED', 'Invité'),
        ('PENDING', 'En attente de validation'),
        ('AUTHORIZED', 'Autorisé'),
        ('VOTED', 'A voté'),
        ('REJECTED', 'Rejeté'),
        ('EXPIRED', 'Expiré'),
    ]
    
    # Identité
    email = models.EmailField()
    full_name = models.CharField(max_length=255)
    
    # Élection liée
    election = models.ForeignKey('elections.Election', on_delete=models.CASCADE, related_name='invitations')
    
    # Sécurité
    unique_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    generated_password = models.CharField(max_length=128, blank=True, null=True)
    
    # Statut & Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INVITED')
    
    # Timestamps
    invited_at = models.DateTimeField(auto_now_add=True)
    form_submitted_at = models.DateTimeField(blank=True, null=True)
    validated_at = models.DateTimeField(blank=True, null=True)
    voted_at = models.DateTimeField(blank=True, null=True)
    
    # Utilisateur lié (créé après validation)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invitation')
    
    # Validation admin
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_invitations')
    
    class Meta:
        db_table = 'voter_invitations'
        ordering = ['-invited_at']
        unique_together = [['email', 'election']]
    
    def __str__(self):
        return f"{self.full_name} ({self.email}) - {self.status}"
    
    @property
    def is_expired(self):
        """Vérifie si l'invitation a expiré (30 jours)"""
        expiry_date = self.invited_at + timedelta(days=30)
        return timezone.now() > expiry_date
    
    @property
    def invitation_url(self):
        """Génère l'URL unique d'invitation"""
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{base_url}/voter/register/{self.unique_token}"