
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, VoterInvitation
import secrets
import string

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    Used for displaying user information
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'photo', 'avatar', 'bio', 'organization',
            'is_email_verified', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users
    Includes password validation
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True, 
        label='Confirmer le mot de passe',
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role', 'phone'
        ]
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    Returns user object if credentials are valid
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True, 
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate credentials and return user"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Essayer d'abord avec le username
            user = authenticate(username=username, password=password)
            
            # Si ça ne marche pas, essayer avec l'email
            if not user:
                try:
                    # Chercher l'utilisateur par email
                    user_obj = User.objects.get(email=username)
                    # Authentifier avec le vrai username
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError(
                    'Identifiants incorrects. Veuillez réessayer.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Ce compte est désactivé. Contactez l\'administrateur.'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Le nom d\'utilisateur et le mot de passe sont requis.'
            )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        """Validate that new passwords match"""
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur"""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'phone', 'avatar', 'bio', 'organization'
        ]
        read_only_fields = ['id', 'role']


# ============= INVITATION SYSTEM =============

class VoterInvitationSerializer(serializers.ModelSerializer):
    invitation_url = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    election_title = serializers.CharField(source='election.title', read_only=True)
    validated_by_username = serializers.CharField(source='validated_by.username', read_only=True)
    
    class Meta:
        model = VoterInvitation
        fields = [
            'id', 'email', 'full_name', 'election', 'election_title',
            'unique_token', 'status', 'invited_at', 'form_submitted_at', 
            'validated_at', 'voted_at', 'invitation_url', 'is_expired', 
            'user', 'validated_by_username'
        ]
        read_only_fields = ['id', 'unique_token', 'invited_at', 'status']


class VoterInvitationCreateSerializer(serializers.ModelSerializer):
    """Création d'invitation par l'admin"""
    class Meta:
        model = VoterInvitation
        fields = ['email', 'full_name', 'election']
    
    def validate(self, attrs):
        # Vérifier si déjà invité pour cette élection
        if VoterInvitation.objects.filter(
            email=attrs['email'], 
            election=attrs['election']
        ).exists():
            raise serializers.ValidationError({
                'email': "Cette personne a déjà été invitée pour cette élection."
            })
        return attrs


class VoterRegistrationSerializer(serializers.Serializer):
    """Formulaire de validation par le votant"""
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    token = serializers.UUIDField()
    
    def validate(self, attrs):
        try:
            invitation = VoterInvitation.objects.get(unique_token=attrs['token'])
        except VoterInvitation.DoesNotExist:
            raise serializers.ValidationError({
                'token': "Lien d'invitation invalide."
            })
        
        # Vérifier l'email
        if invitation.email.lower() != attrs['email'].lower():
            raise serializers.ValidationError({
                'email': "L'email ne correspond pas à l'invitation."
            })
        
        # Vérifier le statut
        if invitation.status != 'INVITED':
            raise serializers.ValidationError({
                'token': "Cette invitation a déjà été traitée."
            })
        
        # Vérifier expiration
        if invitation.is_expired:
            invitation.status = 'EXPIRED'
            invitation.save()
            raise serializers.ValidationError({
                'token': "Cette invitation a expiré."
            })
        
        attrs['invitation'] = invitation
        return attrs


class VoterValidationSerializer(serializers.Serializer):
    """Validation par l'admin"""
    invitation_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    
    def validate_invitation_id(self, value):
        try:
            invitation = VoterInvitation.objects.get(id=value)
        except VoterInvitation.DoesNotExist:
            raise serializers.ValidationError("Invitation introuvable.")
        
        if invitation.status != 'PENDING':
            raise serializers.ValidationError("Cette invitation ne peut pas être validée.")
        
        return value


def generate_secure_password(length=12):
    """Génère un mot de passe sécurisé"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password