import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, User, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { invitationsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const PendingValidationsPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationsAPI.getPending();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setInvitations(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les demandes en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (invitationId, action) => {
    const actionText = action === 'approve' ? 'approuver' : 'rejeter';
    
    if (!window.confirm(`Voulez-vous vraiment ${actionText} cette demande?`)) {
      return;
    }

    try {
      await invitationsAPI.validate(invitationId, action);
      
      if (action === 'approve') {
        success(
          'Demande approuvée!',
          'Les identifiants ont été envoyés au votant par email.'
        );
      } else {
        success('Demande rejetée', 'Le votant a été notifié du rejet.');
      }
      
      loadPendingInvitations();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de validation', 'Impossible de traiter la demande');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => navigate('/admin/dashboard')}
            >
               <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Demandes de validation en attente</h1>
              <p className="text-sm text-gray-600">
                {invitations.length} demande(s) en attente de votre approbation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {invitations.length === 0 ? (
          <Card className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande en attente
            </h3>
            <p className="text-gray-600">
              Toutes les demandes d'accès ont été traitées.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{invitation.full_name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{invitation.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-15 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="warning">En attente</Badge>
                        <span className="text-sm text-gray-600">
                          Élection: <strong>{invitation.election_title}</strong>
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Soumis le: {new Date(invitation.form_submitted_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleValidate(invitation.id, 'approve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleValidate(invitation.id, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingValidationsPage;