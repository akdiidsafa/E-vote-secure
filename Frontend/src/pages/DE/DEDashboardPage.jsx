import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Eye, User, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { votesAPI, electionsAPI } from '../../services/api';
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

const DEDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError } = useNotification();

  // States pour AlertDialog
  const [countDialog, setCountDialog] = useState({ isOpen: false, voteId: null, candidateName: '' });

  // States pour les élections et votes
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [pendingVotes, setPendingVotes] = useState([]);
  const [countedVotes, setCountedVotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, counted: 0 });

  // States pour le modal de déchiffrement
  const [selectedVote, setSelectedVote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decryptedBallot, setDecryptedBallot] = useState(null);
  const [decrypting, setDecrypting] = useState(false);

  // States pour l'onglet actif
  const [activeTab, setActiveTab] = useState('pending');

  // Loading states
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
      
      // Filtrer les élections ouvertes ou fermées
      const activeElections = data.filter(e => ['open', 'closed'].includes(e.status));
      setElections(activeElections);
      
      // Sélectionner automatiquement la première élection
      if (activeElections.length > 0 && !selectedElection) {
        setSelectedElection(activeElections[0]);
        loadElectionVotes(activeElections[0].id);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const loadElectionVotes = async (electionId) => {
    try {
      setLoadingVotes(true);
      console.log('📡 Chargement des votes pour l\'élection:', electionId);
      
      // Récupérer les votes en attente (status='pending_de')
      const response = await votesAPI.getPendingDE(electionId);
      const allVotes = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Votes reçus:', allVotes);
      
      // Séparer en pending et counted (on ne peut pas avoir counted via getPendingDE)
      // On va faire une requête séparée pour les résultats
      setPendingVotes(allVotes);
      
      // Charger les résultats pour avoir les votes comptés
      try {
        const resultsResponse = await votesAPI.getResults(electionId);
        const results = resultsResponse.data;
        setCountedVotes(results.results || []);
        setStats({
          total: allVotes.length + (results.total_counted || 0),
          pending: allVotes.length,
          counted: results.total_counted || 0
        });
      } catch (err) {
        console.log('Pas encore de résultats');
        setCountedVotes([]);
        setStats({
          total: allVotes.length,
          pending: allVotes.length,
          counted: 0
        });
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
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
    setDecryptedBallot(null);

    try {
      console.log('🔓 Déchiffrement PGP de M2 (bulletin)...');

      // Récupérer la clé privée DE
      const keysResponse = await electionsAPI.getPrivateKeys(vote.election_id);
      const { de_private_key } = keysResponse.data;

      if (!de_private_key) {
        throw new Error('Clé privée DE non disponible');
      }

      console.log('✅ Clé privée PGP DE récupérée');

      // Déchiffrer M2 avec PGP
      const decryptedText = await decryptMessage(vote.m2_ballot, de_private_key);

      if (!decryptedText) {
        throw new Error('Échec du déchiffrement PGP');
      }

      console.log('✅ M2 déchiffré avec PGP');

      // Parser le JSON
      const ballotData = JSON.parse(decryptedText);

      console.log('📋 Bulletin déchiffré:', ballotData);

      setDecryptedBallot({
        candidate_id: ballotData.candidate_id,
        candidate_name: ballotData.candidate_name,
        linking_id: ballotData.linking_id,
        timestamp: ballotData.timestamp,
        encrypted: false,
      });

    } catch (error) {
      console.error('❌ Erreur de déchiffrement PGP:', error);

      setDecryptedBallot({
        candidate_id: null,
        candidate_name: 'Erreur de déchiffrement PGP',
        encrypted: true,
        m2_preview: vote.m2_ballot.substring(0, 100) + '...',
        error: error.message
      });
    } finally {
      setDecrypting(false);
    }
  };

  const handleCountVote = async () => {
    if (!countDialog.voteId) return;

    try {
      console.log('📤 Comptabilisation du vote...');
      
      await votesAPI.decryptDE({
        vote_id: countDialog.voteId
      });

      success('Vote comptabilisé!', 'Le vote a été ajouté aux résultats.');
      
      // Recharger les votes
      if (selectedElection) {
        loadElectionVotes(selectedElection.id);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de comptabilisation', err.response?.data?.error || 'Impossible de comptabiliser le vote');
    } finally {
      setCountDialog({ isOpen: false, voteId: null, candidateName: '' });
      setShowModal(false);
      setSelectedVote(null);
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
            <div className="flex items-center space-x-2">
                  <img 
                    src="/logo.png" 
                    alt="Logo"
                    className="w-20 h-20 object-contain"
                  />
              
              <div>
                <h1 className="text-xl font-semibold">Centre de Dépouillement (DE)</h1>
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
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">DE</p>
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
        {/* Sélecteur d'élection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sélectionnez une élection</h2>
          
          {elections.length === 0 ? (
            <Card className="text-center py-8">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune élection active disponible</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elections.map((election) => (
                <Card
                  key={election.id}
                  className={`cursor-pointer transition-all ${
                    selectedElection?.id === election.id
                      ? 'ring-2 ring-indigo-600 bg-indigo-50'
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

        {/* Votes de l'élection sélectionnée */}
        {selectedElection && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <Card>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600 mb-1">À dépouiller</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600 mb-1">Comptabilisés</p>
                <p className="text-3xl font-bold text-green-600">{stats.counted}</p>
              </Card>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button 
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'pending'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('pending')}
                  >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    À dépouiller ({stats.pending})
                  </button>
                  <button 
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'counted'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('counted')}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Comptabilisés ({stats.counted})
                  </button>
                </nav>
              </div>
            </div>

            {/* Contenu des tabs */}
            {loadingVotes ? (
              <Card className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Chargement des votes...</p>
              </Card>
            ) : (
              <>
                {/* Tab: À dépouiller */}
                {activeTab === 'pending' && (
                  pendingVotes.length === 0 ? (
                    <Card className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun vote à dépouiller
                      </h3>
                      <p className="text-gray-600">
                        Tous les votes approuvés par le CO ont été traités.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {pendingVotes.map((vote) => (
                        <Card key={vote.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">Vote #{vote.id}</h3>
                                  <p className="text-sm text-gray-600">Élection: {vote.election_title}</p>
                                </div>
                              </div>
                              
                              <div className="ml-13 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <strong>ID Vote:</strong> {vote.unique_id}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Approuvé par CO le: {new Date(vote.co_verified_at).toLocaleString('fr-FR')}
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                                  <p className="text-xs text-yellow-800">
                                    🔒 <strong>Anonyme:</strong> L'identité du votant (M1) n'est pas accessible au DE
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleViewVote(vote)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Dépouiller
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                )}

                {/* Tab: Comptabilisés */}
                {activeTab === 'counted' && (
                  countedVotes.length === 0 ? (
                    <Card className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun vote comptabilisé
                      </h3>
                      <p className="text-gray-600">
                        Les votes comptabilisés apparaîtront ici.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-green-900 mb-2">Résultats actuels:</h3>
                        {countedVotes.map((result, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-green-800">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{result.candidate_name}</p>
                                {result.candidate_party && (
                                  <p className="text-xs text-gray-600">{result.candidate_party}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="success">
                              {result.vote_count} vote(s)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de dépouillement */}
      {showModal && selectedVote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Dépouillement - Vote #{selectedVote.id}
            </h2>

            {/* Info anonymat */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                🔒 <strong>Vote anonyme:</strong> Seul le bulletin (M2) est déchiffré. L'identité (M1) reste confidentielle.
              </p>
            </div>

            {/* Bulletin déchiffré */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Message M2 (Bulletin chiffré)
              </h3>
              {decrypting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  <p className="text-sm text-indigo-800">⏳ Déchiffrement PGP en cours...</p>
                </div>
              ) : decryptedBallot ? (
                decryptedBallot.encrypted ? (
                  <div className="space-y-2">
                    {decryptedBallot.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <p className="text-sm text-red-800">
                          ❌ <strong>Erreur:</strong> {decryptedBallot.error}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-orange-800">
                      🔒 <strong>Message chiffré PGP</strong>
                    </p>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
                      {decryptedBallot.m2_preview}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded border-2 border-green-300">
                      <p className="text-xs text-gray-600 mb-2">Vote pour:</p>
                      <p className="text-2xl font-bold text-gray-900">{decryptedBallot.candidate_name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        ID Candidat: {decryptedBallot.candidate_id}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Date du vote</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(decryptedBallot.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                      <p className="text-xs text-green-800">
                        ✅ Bulletin déchiffré avec succès
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm text-red-800">❌ Erreur de déchiffrement</p>
              )}
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
                variant="success"
                onClick={() => {
                  setShowModal(false);
                  setCountDialog({ 
                    isOpen: true, 
                    voteId: selectedVote.id, 
                    candidateName: decryptedBallot?.candidate_name || 'Candidat inconnu'
                  });
                }}
                disabled={decryptedBallot?.encrypted}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Comptabiliser ce vote
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* AlertDialog: Comptabiliser */}
      <AlertDialog 
        open={countDialog.isOpen} 
        onOpenChange={(open) => setCountDialog({ isOpen: open, voteId: null, candidateName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-green-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <CheckCircle className="text-green-600 size-6" />
            </div>
            <AlertDialogTitle>Comptabiliser ce vote ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirmez-vous la comptabilisation de ce vote pour <strong>{countDialog.candidateName}</strong> ?
              <br /><br />
              Le vote sera ajouté aux résultats de l'élection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCountVote}
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
            >
              Comptabiliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DEDashboardPage;