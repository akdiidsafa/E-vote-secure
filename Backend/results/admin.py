from django.contrib import admin
from .models import ElectionResult, CandidateResult


class CandidateResultInline(admin.TabularInline):
    """
    Inline admin for CandidateResult
    """
    model = CandidateResult
    extra = 0
    readonly_fields = ['vote_count', 'percentage', 'rank']


@admin.register(ElectionResult)
class ElectionResultAdmin(admin.ModelAdmin):
    """
    Admin interface for ElectionResult model
    """
    list_display = [
        'election', 'total_votes_cast', 'is_published',
        'published_at', 'calculated_at'
    ]
    list_filter = ['is_published', 'calculated_at', 'published_at']
    search_fields = ['election__title']
    readonly_fields = ['calculated_at', 'updated_at']
    inlines = [CandidateResultInline]
    
    fieldsets = (
        ('Élection', {
            'fields': ('election',)
        }),
        ('Votes', {
            'fields': ('total_votes_cast', 'total_valid_votes', 'total_invalid_votes')
        }),
        ('Publication', {
            'fields': ('is_published', 'published_at', 'published_by')
        }),
        ('Métadonnées', {
            'fields': ('calculated_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CandidateResult)
class CandidateResultAdmin(admin.ModelAdmin):
    """
    Admin interface for CandidateResult model
    """
    list_display = [
        'candidate', 'election_result', 'vote_count',
        'percentage', 'rank'
    ]
    list_filter = ['election_result__election']
    search_fields = ['candidate__name', 'election_result__election__title']