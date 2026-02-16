
from django.urls import path
from .views import (
    # Auth de base
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    UserListView,
    UserDetailView,
    ChangePasswordView,
    UserProfileView,
    # Système d'invitation
    VoterInvitationListCreateView,
    VoterRegistrationView,
    VoterValidationView,
    PendingInvitationsView,
    InvitationDetailView,
)

app_name = 'authentication'

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Invitation endpoints
    path('invitations/', VoterInvitationListCreateView.as_view(), name='invitations-list'),
    path('voter/register/', VoterRegistrationView.as_view(), name='voter-register'),
    path('voter/invitation/<uuid:unique_token>/', InvitationDetailView.as_view(), name='invitation-detail'),
    path('admin/validate-voter/', VoterValidationView.as_view(), name='validate-voter'),
    path('admin/pending-invitations/', PendingInvitationsView.as_view(), name='pending-invitations'),
]