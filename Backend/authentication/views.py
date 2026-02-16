
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from .models import VoterInvitation
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    VoterInvitationSerializer,
    VoterInvitationCreateSerializer,
    VoterRegistrationSerializer,
    VoterValidationSerializer,
    generate_secure_password
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Utilisateur créé avec succès.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API endpoint for user login
    POST /api/auth/login/
    Returns JWT access and refresh tokens
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Connexion réussie.'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    API endpoint for user logout
    POST /api/auth/logout/
    Blacklists the refresh token
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Déconnexion réussie.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Token invalide ou déjà blacklisté.'
            }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    API endpoint to get current authenticated user
    GET /api/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListView(generics.ListAPIView):
    """
    API endpoint to list all users (Admin only)
    GET /api/auth/users/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to retrieve, update or delete a user
    GET/PUT/PATCH/DELETE /api/auth/users/<id>/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class ChangePasswordView(APIView):
    """
    API endpoint to change user password
    POST /api/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'old_password': 'Mot de passe incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Mot de passe changé avec succès.'
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/auth/profile/ - Profil de l'utilisateur connecté
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# ============= INVITATION SYSTEM =============

class VoterInvitationListCreateView(generics.ListCreateAPIView):
    """
    GET /api/invitations/ - Liste des invitations
    POST /api/invitations/ - Créer une invitation (Admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VoterInvitationCreateSerializer
        return VoterInvitationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return VoterInvitation.objects.all()
        return VoterInvitation.objects.filter(user=user)
    
    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Seul un administrateur peut créer des invitations.")
        
        invitation = serializer.save()
        self.send_invitation_email(invitation)
    
    def send_invitation_email(self, invitation):
        """Envoie l'email d'invitation avec le lien unique"""
        subject = f"Invitation pour l'élection {invitation.election.title}"
        
        message = f"""
Bonjour {invitation.full_name},

Vous avez été inscrit pour participer au vote "{invitation.election.title}".

Veuillez cliquer sur le lien ci-dessous pour confirmer votre identité et demander vos accès :
{invitation.invitation_url}

Ce lien est strictement personnel.

Cordialement,
L'équipe Vote Électronique Sécurisé
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )


class VoterRegistrationView(APIView):
    """
    POST /api/voter/register/ - Le votant soumet le formulaire de validation
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = VoterRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        invitation = serializer.validated_data['invitation']
        
        invitation.status = 'PENDING'
        invitation.form_submitted_at = timezone.now()
        invitation.full_name = serializer.validated_data['full_name']
        invitation.save()
        
        self.notify_admin(invitation)
        
        return Response({
            'message': 'Votre demande a été soumise. Vous recevrez vos identifiants après validation par l\'administrateur.',
            'status': 'PENDING'
        }, status=status.HTTP_200_OK)
    
    def notify_admin(self, invitation):
        """Notifie l'admin qu'une validation est en attente"""
        admin_users = User.objects.filter(role='admin')
        admin_emails = [admin.email for admin in admin_users]
        
        if not admin_emails:
            return
        
        subject = f"Nouvelle demande d'accès - {invitation.full_name}"
        message = f"""
Une nouvelle demande d'accès a été soumise :

Nom : {invitation.full_name}
Email : {invitation.email}
Élection : {invitation.election.title}

Veuillez valider ou rejeter cette demande dans votre tableau de bord.
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=False,
        )


class VoterValidationView(APIView):
    """
    POST /api/admin/validate-voter/ - L'admin valide ou rejette une demande
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = VoterValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        invitation_id = serializer.validated_data['invitation_id']
        action = serializer.validated_data['action']
        
        invitation = get_object_or_404(VoterInvitation, id=invitation_id)
        
        if action == 'approve':
            password = generate_secure_password()
  
            invitation.generated_password = password
            invitation.status = 'AUTHORIZED'
            invitation.validated_at = timezone.now()
            invitation.validated_by = request.user
            
            # Créer le compte utilisateur
            username = invitation.email.split('@')[0] + str(invitation.id)
            try:
                user = User.objects.get(email=invitation.email)
                user.set_password(password)
                user.save()
                print(f" Utilisateur existant mis à jour: {user.username}")
            except User.DoesNotExist:
                user = User.objects.create_user(
                username=username,
                email=invitation.email,
                password=password,  # create_user() hash automatiquement
                first_name=invitation.full_name.split()[0] if invitation.full_name else '',
                last_name=' '.join(invitation.full_name.split()[1:]) if len(invitation.full_name.split()) > 1 else '',
                role='voter'
                )
                print(f" Nouvel utilisateur créé: {user.username}")
                invitation.user = user
                invitation.save()
                    
                
                print(f" Mot de passe généré: {password}")
                print(f" Vérification: {user.check_password(password)}")

                self.send_credentials_email(invitation, password)
                invitation.user = user
                invitation.save()
                        
                self.send_credentials_email(invitation, password)
                return Response({
                    'message': 'Votant autorisé avec succès. Les identifiants ont été envoyés.',
                    'invitation': VoterInvitationSerializer(invitation).data}, 
                    status=status.HTTP_200_OK)
        elif action == 'reject':
            invitation.status = 'REJECTED'
            invitation.save()
            
            return Response({
                'message': 'Demande rejetée.',
                'invitation': VoterInvitationSerializer(invitation).data
            }, status=status.HTTP_200_OK)
    
    def send_credentials_email(self, invitation, password):
        """Envoie les identifiants au votant"""
        subject = "Vos accès sécurisés pour le vote"
        
        message = f"""
Bonjour {invitation.full_name},

Votre demande d'accès a été validée par l'administrateur.

Voici vos paramètres de connexion :

Identifiant : {invitation.email}
Mot de passe : {password}

Conservez ces informations précieusement jusqu'au jour du vote.

Cordialement,
L'équipe Vote Électronique Sécurisé
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )


class PendingInvitationsView(generics.ListAPIView):
    """
    GET /api/admin/pending-invitations/ - Liste des invitations en attente
    """
    serializer_class = VoterInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return VoterInvitation.objects.none()
        return VoterInvitation.objects.filter(status='PENDING').order_by('-form_submitted_at')


class InvitationDetailView(generics.RetrieveAPIView):
    """
    GET /api/voter/invitation/<token>/ - Récupérer les détails d'une invitation
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = VoterInvitationSerializer
    lookup_field = 'unique_token'
    queryset = VoterInvitation.objects.all()