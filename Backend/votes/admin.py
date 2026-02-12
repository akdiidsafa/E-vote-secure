from django.contrib import admin
from .models import Vote, DecryptedBallot, VoteReceipt


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    """
    Admin interface for Vote model
    """
    list_display = [
        'unique_id', 'election', 'voter', 'status',
        'submitted_at', 'verified_by_co'
    ]
    list_filter = ['status', 'submitted_at', 'election']
    search_fields = ['unique_id', 'voter__username', 'election__title']
    readonly_fields = ['submitted_at', 'co_verification_date']
    
    fieldsets = (
        ('Vote Information', {
            'fields': ('election', 'voter', 'unique_id', 'status')
        }),
        ('Encrypted Data', {
            'fields': ('m1_identity', 'm2_ballot'),
            'classes': ('collapse',)
        }),
        ('CO Verification', {
            'fields': ('verified_by_co', 'co_verification_date', 'co_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('submitted_at',)
        }),
    )


@admin.register(DecryptedBallot)
class DecryptedBallotAdmin(admin.ModelAdmin):
    """
    Admin interface for DecryptedBallot model
    """
    list_display = [
        'unique_id', 'election', 'candidate',
        'decrypted_by', 'decrypted_at'
    ]
    list_filter = ['election', 'decrypted_at']
    search_fields = ['unique_id', 'candidate__name', 'election__title']
    readonly_fields = ['decrypted_at']


@admin.register(VoteReceipt)
class VoteReceiptAdmin(admin.ModelAdmin):
    """
    Admin interface for VoteReceipt model
    """
    list_display = ['receipt_code', 'vote', 'created_at']
    search_fields = ['receipt_code', 'vote__unique_id']
    readonly_fields = ['created_at']