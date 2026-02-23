
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle, Lock, Unlock, User, RefreshCw, BarChart3, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { votesAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { decryptMessage } from '../../utils/crypto';

const DEDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError } = useNotification();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [pendingBallots, setPendingBallots] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // États pour le modal de déchiffrement
  const [selectedBallot, setSelectedBallot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decryptedBallot, setDecryptedBallot] = useState(null);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      console.log('📡 Chargement des élections...');
      
      // Charger toutes les élections
      const response = await electionsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      console.log('✅ Élections reçues:', data);
      
      // Filtrer les élections fermées ou avec des votes
      const electionsWithVotes = data.filter(e =>
        e.status === 'closed' || e.total_votes > 0
      );

      setElections(electionsWithVotes);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBallots = async (electionId) => {
    try {
      setLoading(true);
      console.log('📡 Chargement des bulletins pour élection:', electionId);
      
      const response = await votesAPI.getPendingDE(electionId);
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Bulletins reçus:', data);
      setPendingBallots(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les bulletins');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (electionId) => {
    try {
      setLoading(true);
      const response = await votesAPI.getResults(electionId);
      setResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les résultats');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = (election) => {
    console.log('🔍 Élection sélectionnée:', election);
    setSelectedElection(election);
    setShowResults(false);
    setResults(null);
    loadPendingBallots(election.id);
  };

  // ✅ NOUVEAU: Télécharger M2 PDF
  const handleDownloadM2 = async (ballot) => {
    try {
      console.log('📥 Téléchargement M2 PDF...');
      const response = await votesAPI.downloadM2PDF(ballot.id);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_vote_${ballot.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      success('PDF téléchargé', 'Bulletin M2 téléchargé avec succès');
    } catch (err) {
      console.error('❌ Erreur téléchargement M2:', err);
      showError('Erreur', 'Impossible de télécharger M2');
    }
  };

  // ✅ MODIFIÉ: Déchiffrer avec modal
  const handleDecryptBallot = async (ballot) => {
    setSelectedBallot(ballot);
    setShowModal(true);
    setDecrypting(true);
    setDecryptedBallot(null);

    try {
      console.log('🔓 Déchiffrement PGP de M2...');

      // Récupérer la clé privée DE
      const keysResponse = await electionsAPI.getPrivateKeys(ballot.election_id);
      const { de_private_key } = keysResponse.data;

      console.log('✅ Clé privée PGP DE récupérée');

      // Déchiffrer M2 avec PGP
      const decryptedText = await decryptMessage(ballot.m2_ballot, de_private_key);

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
    } catch (err) {
      console.error('❌ Erreur déchiffrement:', err);
      setDecryptedBallot({
        candidate_name: 'Erreur de déchiffrement PGP',
        encrypted: true,
        error: err.message
      });
    } finally {
      setDecrypting(false);
    }
  };

  // ✅ NOUVEAU: Confirmer le déchiffrement
  const handleConfirmDecryption = async () => {
    if (!selectedBallot) return;

    try {
      setDecrypting(true);
      
      console.log('📤 Comptabilisation du vote...');
      
      await votesAPI.decryptDE({
        vote_id: selectedBallot.id,
      });

      success('Bulletin déchiffré!', 'Le bulletin a été déchiffré et comptabilisé');
      
      setShowModal(false);
      setSelectedBallot(null);
      setDecryptedBallot(null);
      
      // Recharger les bulletins
      if (selectedElection) {
        loadPendingBallots(selectedElection.id);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de déchiffrement', err.response?.data?.error || 'Impossible de déchiffrer le bulletin');
    } finally {
      setDecrypting(false);
    }
  };

  const handleViewResults = () => {
    if (selectedElection) {
      loadResults(selectedElection.id);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading && !selectedElection) {
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
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Centre de Dépouillement (DE)</h1>
                {/* <Badge variant="success" className="mt-1">Decryption Entity</Badge> */}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={loadElections}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Elections */}
          <div>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Élections</h2>

              {elections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">Aucune élection disponible</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Les élections fermées apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {elections.map((election) => (
                    <div
                      key={election.id}
                      onClick={() => handleSelectElection(election)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${selectedElection?.id === election.id
                          ? 'bg-green-50 border-2 border-green-600'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                    >
                      <p className="font-semibold text-sm">{election.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge
                          variant={election.status === 'closed' ? 'secondary' : 'success'}
                          className="text-xs"
                        >
                          {election.status === 'closed' ? 'Fermée' : 'Ouverte'}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          {election.total_votes} vote(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {!selectedElection ? (
              <Card className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Sélectionnez une élection pour commencer le dépouillement
                </p>
              </Card>
            ) : showResults ? (
              /* Résultats */
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Résultats - {selectedElection.title}</h2>
                  <Button variant="secondary" size="sm" onClick={() => setShowResults(false)}>
                    Retour aux bulletins
                  </Button>
                </div>

                {results && (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Votes comptés</p>
                        <p className="text-2xl font-bold text-blue-600">{results.total_counted}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Électeurs assignés</p>
                        <p className="text-2xl font-bold text-purple-600">{results.total_voters}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Taux de participation</p>
                        <p className="text-2xl font-bold text-green-600">
                          {results.participation_rate ? `${results.participation_rate.toFixed(1)}%` : '0%'}
                        </p>
                      </div>
                    </div>

                    {/* Résultats par candidat */}
                    <h3 className="font-semibold mb-4">Résultats par candidat</h3>
                    {results.results && results.results.length > 0 ? (
                      <div className="space-y-3">
                        {results.results.map((result, index) => (
                          <div key={result.candidate_id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold">{result.candidate_name}</p>
                                  {result.candidate_party && (
                                    <p className="text-xs text-gray-600">{result.candidate_party}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{result.vote_count}</p>
                                <p className="text-xs text-gray-600">
                                  {results.total_counted > 0
                                    ? `${((result.vote_count / results.total_counted) * 100).toFixed(1)}%`
                                    : '0%'
                                  }
                                </p>
                              </div>
                            </div>
                            {/* Barre de progression */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                                  }`}
                                style={{
                                  width: results.total_counted > 0
                                    ? `${(result.vote_count / results.total_counted) * 100}%`
                                    : '0%'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">Aucun vote comptabilisé</p>
                    )}
                  </>
                )}
              </Card>
            ) : (
              /* Bulletins en attente */
             /* Bulletins en attente */
              <Card>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    Dépouillement - {selectedElection.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedElection.status === 'closed' 
                      ? '🔒 Élection fermée - Déchiffrement des bulletins' 
                      : '🔓 Élection en cours - Déchiffrement des bulletins approuvés'}
                  </p>
                </div>

                {loading ? (
                  <p className="text-center py-8 text-gray-600">Chargement...</p>
                ) : pendingBallots.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun bulletin en attente</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Tous les bulletins ont été déchiffrés
                    </p>
                    {selectedElection.status === 'closed' && (
                      <div className="mt-4">
                        <Badge variant="success">Dépouillement terminé</Badge>
                        <p className="text-xs text-gray-500 mt-2">
                          Les résultats seront publiés par l'administrateur
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBallots.map((ballot) => (
                      <div key={ballot.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Bulletin #{ballot.id}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Approuvé par CO: {new Date(ballot.co_verified_at).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              ID unique: {ballot.unique_id}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadM2(ballot)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              M2 PDF
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDecryptBallot(ballot)}
                              disabled={decrypting}
                            >
                              <Unlock className="w-4 h-4 mr-2" />
                              {decrypting ? 'Déchiffrement...' : 'Déchiffrer'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="mt-6 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Note de Sécurité</h4>
                      <p className="text-sm text-yellow-800">
                        Vous ne pouvez voir que les choix de vote (bulletins cryptés).
                        Les identités des votants restent anonymes et ne peuvent être liées aux votes.
                      </p>
                      <p className="text-sm text-yellow-800 mt-2">
                        ⚠️ Les résultats finaux seront consultables uniquement après que l'administrateur 
                        ait fermé l'élection et publié les résultats.
                      </p>
                    </div>
                  </div>
                </Card>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de déchiffrement */}
      {showModal && selectedBallot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                Déchiffrement du bulletin - Vote #{selectedBallot.id}
              </h2>

              {decrypting ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Déchiffrement de M2 en cours...</p>
                </div>
              ) : decryptedBallot ? (
                <div className="space-y-6">
                  {decryptedBallot.encrypted ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-semibold mb-2">
                        ❌ Erreur de déchiffrement
                      </p>
                      <p className="text-sm text-red-600">
                        {decryptedBallot.error}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-semibold mb-2">
                          ✅ Bulletin déchiffré avec PGP
                        </p>
                        <p className="text-sm text-green-600">
                          Le bulletin est anonyme - Aucune information d'identité visible
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="border-b pb-4">
                            <p className="text-sm text-gray-600 mb-1">Choix du votant</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {decryptedBallot.candidate_name}
                            </p>
                          </div>

                          <div className="border-b pb-4">
                            <p className="text-sm text-gray-600 mb-1">ID Candidat</p>
                            <p className="text-lg font-semibold text-gray-900">
                              #{decryptedBallot.candidate_id}
                            </p>
                          </div>

                          <div className="border-b pb-4">
                            <p className="text-sm text-gray-600 mb-1">Date du vote</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(decryptedBallot.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-xs text-yellow-800">
                              <strong>Note:</strong> Le linking_id permet de vérifier l'intégrité 
                              mais ne révèle pas l'identité du votant
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex gap-3 mt-8">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBallot(null);
                    setDecryptedBallot(null);
                  }}
                  disabled={decrypting}
                >
                  Annuler
                </Button>
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={handleConfirmDecryption}
                  disabled={decrypting || decryptedBallot?.encrypted}
                >
                  {decrypting ? (
                    'Comptabilisation...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmer et Comptabiliser
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DEDashboardPage;