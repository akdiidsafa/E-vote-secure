
from django.contrib import admin
from .models import Election, ElectionVoterAssignment


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    """
    Admin interface for Election model
    """
    list_display = [
        'title', 'status', 'start_date', 'end_date',
        'total_candidates', 'total_votes', 'created_by', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'start_date']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'total_candidates', 'total_voters', 'total_votes']
    
    fieldsets = (
        ('Informations Générales', {
            'fields': ('title', 'description', 'status')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Paramètres', {
            'fields': ('allow_multiple_votes', 'is_public')
        }),
        ('Statistiques', {
            'fields': ('total_candidates', 'total_voters', 'total_votes'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ElectionVoterAssignment)
class ElectionVoterAssignmentAdmin(admin.ModelAdmin):
    """
    Admin interface for ElectionVoterAssignment model
    """
    list_display = ['election', 'voter', 'has_voted', 'assigned_at']
    list_filter = ['has_voted', 'assigned_at', 'election']
    search_fields = ['voter__username', 'voter__email', 'election__title']
    readonly_fields = ['assigned_at']