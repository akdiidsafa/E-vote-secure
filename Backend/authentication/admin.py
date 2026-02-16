from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, VoterInvitation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin interface for User model
    """
    list_display = ['username', 'email', 'role', 'is_active', 'is_staff', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations Supplémentaires', {
            'fields': ('role', 'phone', 'photo', 'avatar', 'bio', 'organization', 'is_email_verified')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations Supplémentaires', {
            'fields': ('role', 'email', 'phone')
        }),
    )


@admin.register(VoterInvitation)
class VoterInvitationAdmin(admin.ModelAdmin):
    """
    Admin interface for VoterInvitation model
    """
    list_display = ['full_name', 'email', 'election', 'status', 'invited_at', 'validated_at']
    list_filter = ['status', 'invited_at', 'election']
    search_fields = ['full_name', 'email', 'election__title']
    readonly_fields = ['unique_token', 'invited_at', 'form_submitted_at', 'validated_at', 'voted_at', 'invitation_url', 'is_expired']
    
    fieldsets = (
        ('Identité', {
            'fields': ('full_name', 'email', 'election')
        }),
        ('Sécurité', {
            'fields': ('unique_token', 'generated_password', 'invitation_url', 'is_expired')
        }),
        ('Statut', {
            'fields': ('status', 'user', 'validated_by')
        }),
        ('Timestamps', {
            'fields': ('invited_at', 'form_submitted_at', 'validated_at', 'voted_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields read-only when editing"""
        if obj:  # Editing existing object
            return self.readonly_fields + ['email', 'election']
        return self.readonly_fields