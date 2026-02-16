import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Eye, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { votesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { decryptMessage } from '../../utils/crypto';

const CODashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError } = useNotification();

  const [pendingVotes, setPendingVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decryptedIdentity, setDecryptedIdentity] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadPendingVotes();
  }, []);

  const loadPendingVotes = async () => {
    try {
      setLoading(true);
      const response = await votesAPI.getPendingVotes();
      const data = Array.isArray(response.data) ? response.data : [];
      setPendingVotes(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les votes en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVote = async (vote) => {
    setSelectedVote(vote);
    setShowModal(true);
    setDecrypting(true);
    setDecryptedIdentity(null);

    try {
      // TODO: Récupérer la clé privée CO depuis le backend
      // Pour l'instant, afficher le message chiffré
      setDecryptedIdentity({
        voter_id: '***',
        voter_name: 'Chiffré - Nécessite clé privée CO',
        voter_email: '***@***.***',
        encrypted: true,
        m1_preview: vote.m1_identity.substring(0, 100) + '...'
      });
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      showError('Erreur', 'Impossible de déchiffrer l\'identité');
    } finally {
      setDecrypting(false);
    }
  };

  const handleVerify = async (action) => {
    if (!selectedVote) return;

    try {
      setVerifying(true);
      
      await votesAPI.verifyVote({
        vote_id: selectedVote.id,
        action: action,
        notes: '',
      });

      success(
        action === 'approve' ? 'Vote approuvé!' : 'Vote rejeté',
        action === 'approve' 
          ? 'Le vote a été approuvé et transféré au DE'
          : 'Le vote a été rejeté'
      );

      setShowModal(false);
      setSelectedVote(null);
      loadPendingVotes();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de vérification', 'Impossible de traiter le vote');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Centre d'Identification (CO)</h1>
                <Badge variant="warning" className="mt-1">Certificate Officer</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={loadPendingVotes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">CO</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Votes en attente de vérification</h2>
          <p className="text-gray-600">
            Vérifiez l'identité des votants avant de transférer les votes au centre de comptage
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">En attente</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingVotes.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Approuvés aujourd'hui</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Rejetés aujourd'hui</p>
            <p className="text-3xl font-bold text-red-600">0</p>
          </Card>
        </div>

        {/* Votes List */}
        {pendingVotes.length === 0 ? (
          <Card className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun vote en attente
            </h3>
            <p className="text-gray-600">
              Tous les votes ont été traités.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingVotes.map((vote) => (
              <Card key={vote.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Vote #{vote.id}</p>
                    <p className="text-sm text-gray-600">
                      Élection: {vote.election_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Soumis le: {new Date(vote.submitted_at).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID unique: {vote.unique_id}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewVote(vote)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Vérifier
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de vérification */}
      {showModal && selectedVote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Vérification d'identité - Vote #{selectedVote.id}</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Message M1 (Identité)
              </h3>
              {decrypting ? (
                <p className="text-sm text-blue-800">⏳ Déchiffrement en cours...</p>
              ) : decryptedIdentity ? (
                decryptedIdentity.encrypted ? (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-800">
                      🔒 <strong>Message chiffré</strong>
                    </p>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
                      {decryptedIdentity.m1_preview}
                    </p>
                    <p className="text-xs text-orange-700 mt-2">
                      ⚠️ Le déchiffrement nécessite la clé privée CO stockée de manière sécurisée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>ID Votant:</strong> {decryptedIdentity.voter_id}
                    </p>
                    <p className="text-sm">
                      <strong>Nom:</strong> {decryptedIdentity.voter_name}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {decryptedIdentity.voter_email}
                    </p>
                  </div>
                )
              ) : (
                <p className="text-sm text-red-800">❌ Erreur de déchiffrement</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Le message M2 (bulletin) reste chiffré et sera transféré au DE.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedVote(null);
                }}
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => handleVerify('reject')}
                disabled={verifying}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                variant="success"
                onClick={() => handleVerify('approve')}
                disabled={verifying}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {verifying ? 'Traitement...' : 'Approuver'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CODashboardPage;