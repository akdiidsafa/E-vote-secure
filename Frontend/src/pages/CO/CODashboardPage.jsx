
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Eye, User, RefreshCw, Download, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { coAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { decryptMessage } from '../../utils/crypto';
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

const CODashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError, info } = useNotification();

  const [approveDialog, setApproveDialog] = useState({ isOpen: false, voteId: null, voterName: '' });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, voteId: null, voterName: '' });

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [pendingVotes, setPendingVotes] = useState([]);
  const [approvedVotes, setApprovedVotes] = useState([]);
  const [rejectedVotes, setRejectedVotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const [activeTab, setActiveTab] = useState('pending');

  const [selectedVote, setSelectedVote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decryptedIdentity, setDecryptedIdentity] = useState(null);
  const [decrypting, setDecrypting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(false);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const response = await electionsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      const activeElections = data.filter(e => ['open', 'closed'].includes(e.status));
      setElections(activeElections);
      
      if (activeElections.length > 0 && !selectedElection) {
        setSelectedElection(activeElections[0]);
        loadElectionVotes(activeElections[0].id);
      }
    } catch (err) {
      console.error(' Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const loadElectionVotes = async (electionId) => {
    try {
      setLoadingVotes(true);
      console.log(' Chargement des votes pour l\'élection:', electionId);
      
      const response = await coAPI.getElectionVotes(electionId);
      const data = response.data;
      
      console.log(' Votes reçus:', data);
      
      setPendingVotes(data.pending || []);
      setApprovedVotes(data.approved || []);
      setRejectedVotes(data.rejected || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      console.error(' Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les votes');
    } finally {
      setLoadingVotes(false);
    }
  };

  const handleElectionChange = (election) => {
    setSelectedElection(election);
    setActiveTab('pending'); 
    loadElectionVotes(election.id);
  };

  const handleViewVote = async (vote) => {
    setSelectedVote(vote);
    setShowModal(true);
    setDecrypting(true);
    setDecryptedIdentity(null);

    try {
      console.log('🔓 Déchiffrement PGP de M1...');

      const keysResponse = await electionsAPI.getPrivateKeys(vote.election);
      const { co_private_key } = keysResponse.data;

      if (!co_private_key) {
        throw new Error('Clé privée CO non disponible');
      }

      console.log(' Clé privée PGP CO récupérée');

      const decryptedText = await decryptMessage(vote.m1_identity, co_private_key);

      if (!decryptedText) {
        throw new Error('Échec du déchiffrement PGP');
      }

      console.log('M1 déchiffré avec PGP');

      const identityData = JSON.parse(decryptedText);

      console.log(' Identité déchiffrée:', identityData);

      setDecryptedIdentity({
        voter_id: identityData.voter_id,
        voter_name: identityData.voter_name,
        voter_email: identityData.voter_email,
        linking_id: identityData.linking_id,
        timestamp: identityData.timestamp,
        encrypted: false,
      });

    } catch (error) {
      console.error(' Erreur de déchiffrement PGP:', error);

      setDecryptedIdentity({
        voter_id: '***',
        voter_name: 'Erreur de déchiffrement PGP',
        voter_email: '***@***.***',
        encrypted: true,
        m1_preview: vote.m1_identity.substring(0, 100) + '...',
        error: error.message
      });
    } finally {
      setDecrypting(false);
    }
  };

  const handleApprove = async () => {
    if (!approveDialog.voteId) return;

    try {
      console.log(' Approbation du vote...');
      
      await coAPI.approveVote(approveDialog.voteId);

      success('Vote approuvé!', 'Le vote a été approuvé et le PDF M2 a été généré.');
      
      if (selectedElection) {
        loadElectionVotes(selectedElection.id);
      }
    } catch (err) {
      console.error(' Erreur:', err);
      showError('Erreur d\'approbation', err.response?.data?.error || 'Impossible d\'approuver le vote');
    } finally {
      setApproveDialog({ isOpen: false, voteId: null, voterName: '' });
      setShowModal(false);
      setSelectedVote(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.voteId) return;

    try {
      console.log(' Rejet du vote...');
      
      await coAPI.rejectVote(rejectDialog.voteId);

      success('Vote rejeté', 'Le vote a été rejeté.');
      
      if (selectedElection) {
        loadElectionVotes(selectedElection.id);
      }
    } catch (err) {
      console.error(' Erreur:', err);
      showError('Erreur de rejet', 'Impossible de rejeter le vote');
    } finally {
      setRejectDialog({ isOpen: false, voteId: null, voterName: '' });
      setShowModal(false);
      setSelectedVote(null);
    }
  };

  const handleDownloadM2 = async (vote) => {
    try {
      console.log(' Téléchargement du PDF M2...');
      const response = await coAPI.downloadM2PDF(vote.id);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `M2_Vote_${vote.unique_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      success('PDF téléchargé', 'Bulletin M2 téléchargé avec succès');
    } catch (err) {
      console.error(' Erreur téléchargement M2:', err);
      showError('Erreur', 'Impossible de télécharger le PDF M2');
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                    src="/logo.png" 
                    alt="Logo"
                    className="w-20 h-20 object-contain"
                  />
              <div>
                <h1 className="text-xl font-semibold">Centre de Comptage (CO)</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => selectedElection && loadElectionVotes(selectedElection.id)}
              >
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sélectionnez une élection</h2>
          
          {elections.length === 0 ? (
            <Card className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune élection active disponible</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elections.map((election) => (
                <Card
                  key={election.id}
                  className={`cursor-pointer transition-all ${
                    selectedElection?.id === election.id
                      ? 'ring-2 ring-purple-600 bg-purple-50'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleElectionChange(election)}
                >
                  <h3 className="font-semibold text-lg mb-2">{election.title}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant={election.status === 'open' ? 'success' : 'secondary'}>
                      {election.status === 'open' ? 'Ouverte' : 'Fermée'}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      {election.total_votes || 0} vote(s)
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedElection && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <Card>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600 mb-1">Approuvés</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600 mb-1">Rejetés</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </Card>
            </div>

            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button 
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'pending'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('pending')}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    En attente ({stats.pending})
                  </button>
                  <button 
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'approved'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('approved')}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Approuvés ({stats.approved})
                  </button>
                  <button 
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'rejected'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('rejected')}
                  >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Rejetés ({stats.rejected})
                  </button>
                </nav>
              </div>
            </div>

            {loadingVotes ? (
              <Card className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Chargement des votes...</p>
              </Card>
            ) : (
              <>
                {activeTab === 'pending' && (
                  pendingVotes.length === 0 ? (
                    <Card className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun vote en attente
                      </h3>
                      <p className="text-gray-600">
                        Tous les votes de cette élection ont été traités.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {pendingVotes.map((vote) => (
                        <Card key={vote.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{vote.voter_full_name || vote.voter_username}</h3>
                                  <p className="text-sm text-gray-600">{vote.voter_email}</p>
                                </div>
                              </div>
                              
                              <div className="ml-13 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <strong>ID Vote:</strong> {vote.unique_id}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Soumis le: {new Date(vote.submitted_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2">
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
                  )
                )}

                {activeTab === 'approved' && (
                  approvedVotes.length === 0 ? (
                    <Card className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun vote approuvé
                      </h3>
                      <p className="text-gray-600">
                        Les votes approuvés apparaîtront ici.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {approvedVotes.map((vote) => (
                        <Card key={vote.id} className="bg-green-50 border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{vote.voter_full_name || vote.voter_username}</p>
                                  <Badge variant="success">Approuvé</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{vote.voter_email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Approuvé le: {new Date(vote.co_verified_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleDownloadM2(vote)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              PDF M2
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                )}

                {activeTab === 'rejected' && (
                  rejectedVotes.length === 0 ? (
                    <Card className="text-center py-12">
                      <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun vote rejeté
                      </h3>
                      <p className="text-gray-600">
                        Les votes rejetés apparaîtront ici.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {rejectedVotes.map((vote) => (
                        <Card key={vote.id} className="bg-red-50 border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{vote.voter_full_name || vote.voter_username}</p>
                                  <Badge variant="danger">Rejeté</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{vote.voter_email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Rejeté le: {new Date(vote.co_verified_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {showModal && selectedVote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Vérification d'identité - {selectedVote.voter_full_name || selectedVote.voter_username}
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Message M1 (Identité chiffrée)
              </h3>
              {decrypting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <p className="text-sm text-blue-800">⏳ Déchiffrement PGP en cours...</p>
                </div>
              ) : decryptedIdentity ? (
                decryptedIdentity.encrypted ? (
                  <div className="space-y-2">
                    {decryptedIdentity.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <p className="text-sm text-red-800">
                           <strong>Erreur:</strong> {decryptedIdentity.error}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-orange-800">
                       <strong>Message chiffré PGP</strong>
                    </p>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
                      {decryptedIdentity.m1_preview}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">ID Votant</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_id}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_email}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Date du vote</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(decryptedIdentity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                      <p className="text-xs text-green-800">
                         Identité déchiffrée avec succès
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm text-red-800"> Erreur de déchiffrement</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                 <strong>Important:</strong> Le bulletin M2 sera automatiquement généré en PDF après approbation.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedVote(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowModal(false);
                  setRejectDialog({ 
                    isOpen: true, 
                    voteId: selectedVote.id, 
                    voterName: decryptedIdentity?.voter_name || selectedVote.voter_full_name 
                  });
                }}
                disabled={decryptedIdentity?.encrypted}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setShowModal(false);
                  setApproveDialog({ 
                    isOpen: true, 
                    voteId: selectedVote.id, 
                    voterName: decryptedIdentity?.voter_name || selectedVote.voter_full_name 
                  });
                }}
                disabled={decryptedIdentity?.encrypted}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </div>
          </Card>
        </div>
      )}

      <AlertDialog 
        open={approveDialog.isOpen} 
        onOpenChange={(open) => setApproveDialog({ isOpen: open, voteId: null, voterName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-green-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <CheckCircle className="text-green-600 size-6" />
            </div>
            <AlertDialogTitle>Approuver ce vote ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirmez-vous l'approbation du vote de <strong>{approveDialog.voterName}</strong> ?
              <br /><br />
              Le bulletin M2 sera généré en PDF et transféré au DE pour dépouillement.
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

      <AlertDialog 
        open={rejectDialog.isOpen} 
        onOpenChange={(open) => setRejectDialog({ isOpen: open, voteId: null, voterName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-red-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <XCircle className="text-red-600 size-6" />
            </div>
            <AlertDialogTitle>Rejeter ce vote ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirmez-vous le rejet du vote de <strong>{rejectDialog.voterName}</strong> ?
              <br /><br />
              Cette action est irréversible.
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

export default CODashboardPage;