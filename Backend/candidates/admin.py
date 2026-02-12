
from django.contrib import admin
from .models import Candidate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    """
    Admin interface for Candidate model
    """
    list_display = ['name', 'party', 'election', 'order', 'total_votes', 'created_at']
    list_filter = ['election', 'created_at']
    search_fields = ['name', 'party', 'election__title']
    readonly_fields = ['created_at', 'updated_at', 'total_votes']
    
    fieldsets = (
        ('Informations du Candidat', {
            'fields': ('name', 'party', 'program', 'photo')
        }),
        ('Élection', {
            'fields': ('election', 'order')
        }),
        ('Statistiques', {
            'fields': ('total_votes',),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )