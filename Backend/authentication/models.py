from django.contrib.auth.models import AbstractUser
from django.db import models

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
    is_email_verified = models.BooleanField(default=False, verbose_name="Email vérifié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
    
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