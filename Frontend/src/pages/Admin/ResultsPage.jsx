import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Award, Download, RefreshCw, Vote, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI, votesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError } = useNotification();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const response = await electionsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // Filtrer UNIQUEMENT les élections fermées avec des votes
      const closedElectionsWithVotes = data.filter(e => 
        e.status === 'closed' && e.total_votes > 0
      );
      
      setElections(closedElectionsWithVotes);
      
      // Sélectionner la première élection par défaut
      if (closedElectionsWithVotes.length > 0 && !selectedElection) {
        loadResults(closedElectionsWithVotes[0].id);
        setSelectedElection(closedElectionsWithVotes[0]);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (electionId) => {
    try {
      setLoading(true);
      const response = await votesAPI.getResults(electionId);
      setResults(response.data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les résultats');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = (election) => {
    setSelectedElection(election);
    loadResults(election.id);
  };

  const handleDownloadResults = () => {
    if (!results) return;
    
    // Créer un CSV
    let csv = 'Position,Candidat,Profession,Nombre de votes,Pourcentage\n';
    results.results.forEach((result, index) => {
      const percentage = results.total_counted > 0 
        ? ((result.vote_count / results.total_counted) * 100).toFixed(1)
        : '0';
      csv += `${index + 1},${result.candidate_name},${result.candidate_party || 'N/A'},${result.vote_count},${percentage}%\n`;
    });
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_${selectedElection.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    success('Téléchargement réussi!', 'Les résultats ont été téléchargés en CSV');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Vote Électronique Sécurisé</h1>
                <Badge variant="warning" className="mt-1">Administrateur</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Tableau de bord
            </button>
            <button 
              onClick={() => navigate('/admin/elections')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Élections
            </button>
            <button 
              onClick={() => navigate('/admin/candidates')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Candidats
            </button>
            <button 
              onClick={() => navigate('/admin/voters')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Électeurs
            </button>
            <button 
              onClick={() => navigate('/admin/assignment')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Assignation
            </button>
            <button 
              onClick={() => navigate('/admin/results')}
              className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              Résultats
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Résultats des Élections</h1>
              <p className="text-gray-600">Consultez les résultats détaillés de chaque élection fermée</p>
            </div>
            <Button variant="ghost" onClick={loadElections}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Sélecteur d'élection */}
        {elections.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Sélectionner une élection fermée</h3>
                <select
                  value={selectedElection?.id || ''}
                  onChange={(e) => {
                    const election = elections.find(el => el.id === parseInt(e.target.value));
                    if (election) handleSelectElection(election);
                  }}
                  className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Sélectionnez une élection --</option>
                  {elections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.title} - {election.total_votes} vote(s)
                    </option>
                  ))}
                </select>
              </div>
              {selectedElection && (
                <Badge variant="secondary">
                  Fermée
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Main Content - Results */}
        <div>
          {/* Message si aucune élection fermée */}
          {!selectedElection && elections.length === 0 ? (
            <Card className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune élection fermée
              </h3>
              <p className="text-gray-600 mb-4">
                Les résultats ne seront disponibles qu'après la fermeture de l'élection.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Pour fermer une élection et voir ses résultats, 
                  retournez au tableau de bord et cliquez sur "Fermer le Vote".
                </p>
              </div>
            </Card>
          ) : !selectedElection ? (
            <Card className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une élection
              </h3>
              <p className="text-gray-600">
                Choisissez une élection dans la liste ci-dessus pour voir ses résultats
              </p>
            </Card>
          ) : loading ? (
            <Card className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des résultats...</p>
            </Card>
          ) : !results ? (
            <Card className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun résultat disponible
              </h3>
              <p className="text-gray-600">
                Les résultats apparaîtront une fois les votes déchiffrés par le DE
              </p>
            </Card>
          ) : (
            <>
              {/* Header */}
              <Card className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedElection.title}</h2>
                    {selectedElection.description && (
                      <p className="text-gray-600 mt-1">{selectedElection.description}</p>
                    )}
                  </div>
                  <Button variant="primary" onClick={handleDownloadResults}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger CSV
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Votes comptés</p>
                      <p className="text-2xl font-bold text-gray-900">{results.total_counted}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Électeurs assignés</p>
                      <p className="text-2xl font-bold text-gray-900">{results.total_voters}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Participation</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {results.participation_rate ? `${results.participation_rate.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Candidats</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {results.results ? results.results.length : 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Results */}
              <Card>
                <h3 className="text-xl font-semibold mb-6">Classement des candidats</h3>

                {results.results && results.results.length > 0 ? (
                  <div className="space-y-4">
                    {results.results.map((result, index) => {
                      const percentage = results.total_counted > 0 
                        ? ((result.vote_count / results.total_counted) * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div key={result.candidate_id} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-4">
                              {/* Position Badge */}
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' : 
                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gray-400'
                              }`}>
                                {index + 1}
                              </div>

                              {/* Candidate Info */}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold text-lg text-gray-900">{result.candidate_name}</p>
                                  {index === 0 && (
                                    <Award className="w-5 h-5 text-yellow-500" />
                                  )}
                                </div>
                                {result.candidate_party && (
                                  <p className="text-sm text-gray-600">{result.candidate_party}</p>
                                )}
                              </div>
                            </div>

                            {/* Vote Count */}
                            <div className="text-right">
                              <p className="text-3xl font-bold text-gray-900">{result.vote_count}</p>
                              <p className="text-sm text-gray-600">{percentage}%</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                                index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gray-400'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun vote comptabilisé</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Les résultats apparaîtront une fois les votes déchiffrés par le DE
                    </p>
                  </div>
                )}
              </Card>

              {/* Info */}
              <Card className="mt-6 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">À propos des résultats</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Les résultats sont basés uniquement sur les votes déchiffrés par le DE</li>
                      <li>• L'anonymat des votants est préservé à tout moment</li>
                      <li>• Les votes sont comptabilisés de manière sécurisée et vérifiable</li>
                      <li>• Les résultats ne sont visibles qu'après la fermeture de l'élection</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;