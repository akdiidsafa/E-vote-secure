

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, User, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { invitationsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/AlertDialog';

const PendingValidationsPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState({ isOpen: false, invitationId: null, voterName: '' });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, invitationId: null, voterName: '' });

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

  const handleApprove = async () => {
    if (!approveDialog.invitationId) return;

    try {
      await invitationsAPI.validate(approveDialog.invitationId, 'approve');
      success('Demande approuvée!', 'Les identifiants ont été envoyés au votant par email.');
      loadPendingInvitations();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de validation', 'Impossible de traiter la demande');
    } finally {
      setApproveDialog({ isOpen: false, invitationId: null, voterName: '' });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.invitationId) return;

    try {
      await invitationsAPI.validate(rejectDialog.invitationId, 'reject');
      success('Demande rejetée', 'Le votant a été notifié du rejet.');
      loadPendingInvitations();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de validation', 'Impossible de traiter la demande');
    } finally {
      setRejectDialog({ isOpen: false, invitationId: null, voterName: '' });
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
                      onClick={() => setApproveDialog({ 
                        isOpen: true, 
                        invitationId: invitation.id, 
                        voterName: invitation.full_name 
                      })}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectDialog({ 
                        isOpen: true, 
                        invitationId: invitation.id, 
                        voterName: invitation.full_name 
                      })}
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

      {/* ✅ AlertDialog: Approuver */}
      <AlertDialog 
        open={approveDialog.isOpen} 
        onOpenChange={(open) => setApproveDialog({ isOpen: open, invitationId: null, voterName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-green-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <CheckCircle className="text-green-600 size-6" />
            </div>
            <AlertDialogTitle>Approuver cette demande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Voulez-vous approuver la demande de <strong>{approveDialog.voterName}</strong> ?
              <br /><br />
              Les identifiants de connexion seront automatiquement envoyés par email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
            >
              Approuver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ AlertDialog: Rejeter */}
      <AlertDialog 
        open={rejectDialog.isOpen} 
        onOpenChange={(open) => setRejectDialog({ isOpen: open, invitationId: null, voterName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-red-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <XCircle className="text-red-600 size-6" />
            </div>
            <AlertDialogTitle>Rejeter cette demande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Voulez-vous rejeter la demande de <strong>{rejectDialog.voterName}</strong> ?
              <br /><br />
              Le votant sera notifié par email du rejet de sa demande.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingValidationsPage;