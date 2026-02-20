

from django.contrib import admin
from .models import Vote, DecryptedBallot, VoteReceipt


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'election',
        'voter',
        'status',
        'co_verified_by',
        'de_verified_by',
        'submitted_at'
    ]
    list_filter = ['status', 'election', 'submitted_at']
    search_fields = ['unique_id', 'voter__username', 'election__title']
    readonly_fields = [
        'unique_id',
        'linking_id',
        'submitted_at',
        'co_verified_at',
        'co_verified_by',
        'de_verified_at',
        'de_verified_by'
    ]
    fieldsets = (
        ('Information Générale', {
            'fields': ('election', 'voter', 'status', 'unique_id', 'linking_id')
        }),
        ('Messages Chiffrés', {
            'fields': ('m1_identity', 'm2_ballot'),
            'classes': ('collapse',)
        }),
        ('Vérification CO', {
            'fields': ('co_verified_at', 'co_verified_by')
        }),
        ('Vérification DE', {
            'fields': ('de_verified_at', 'de_verified_by')
        }),
        ('Timestamps', {
            'fields': ('submitted_at',)
        }),
    )
    
    def has_add_permission(self, request):
        # Empêcher la création manuelle de votes
        return False
    
    def has_change_permission(self, request, obj=None):
        # Seul l'admin peut modifier
        return request.user.is_superuser


@admin.register(DecryptedBallot)
class DecryptedBallotAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'election',
        'candidate',
        'unique_id',
        'decrypted_by',
        'decrypted_at'
    ]
    list_filter = ['election', 'candidate', 'decrypted_at']
    search_fields = ['unique_id', 'election__title', 'candidate__name']
    readonly_fields = ['unique_id', 'decrypted_at', 'decrypted_by']
    
    def has_add_permission(self, request):
        # Empêcher la création manuelle
        return False
    
    def has_change_permission(self, request, obj=None):
        # Aucune modification autorisée
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Seul le superuser peut supprimer
        return request.user.is_superuser


@admin.register(VoteReceipt)
class VoteReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'vote', 'receipt_code', 'created_at']
    list_filter = ['created_at']
    search_fields = ['receipt_code', 'vote__unique_id']
    readonly_fields = ['vote', 'receipt_code', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser