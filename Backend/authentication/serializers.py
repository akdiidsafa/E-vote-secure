from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    Used for displaying user information
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'photo', 'is_email_verified',
            'is_active', 'created_at', 'updated_at'
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
        validated_data.pop('password2')  # Remove password2 before creating
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
            # Try to authenticate user
            user = authenticate(username=username, password=password)
            
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