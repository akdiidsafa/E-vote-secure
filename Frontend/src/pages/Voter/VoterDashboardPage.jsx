import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Info, Vote, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const VoterDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { error: showError } = useNotification();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const response = await electionsAPI.getAll();
      const electionsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      // Filtrer uniquement les élections ouvertes assignées au votant
      const openElections = electionsData.filter(e => e.status === 'open');
      setElections(openElections);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (electionId) => {
    navigate(`/voter/vote/${electionId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const config = {
      'open': { label: 'Ouverte', variant: 'success' },
      'closed': { label: 'Fermée', variant: 'danger' },
      'draft': { label: 'Brouillon', variant: 'secondary' },
    };
    const c = config[status] || config['draft'];
    return <Badge variant={c.variant}>{c.label}</Badge>;
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold">Vote Électronique Sécurisé</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'Électeur'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue, {user?.first_name || user?.username}!
          </h2>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
            })} - {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {elections.length === 0 ? (
          <Card className="text-center py-12">
            <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune élection disponible
            </h3>
            <p className="text-gray-600">
              Il n'y a actuellement aucune élection ouverte à laquelle vous pouvez participer.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {elections.map((election) => (
              <Card key={election.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {election.title}
                    </h2>
                    {getStatusBadge(election.status)}
                  </div>
                </div>

                {election.description && (
                  <p className="text-gray-700 mb-4">{election.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date de début</p>
                      <p className="font-medium">
                        {new Date(election.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date de fin</p>
                      <p className="font-medium">
                        {new Date(election.end_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {election.has_voted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Vous avez déjà voté</p>
                        <p className="text-sm text-green-700">
                          Vous ne pouvez plus voter pour cette élection
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Vous n'avez pas encore voté</p>
                        <p className="text-sm text-blue-700">
                          L'élection est ouverte, vous pouvez voter dès maintenant
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Comment fonctionne le vote sécurisé ?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Vous ne pouvez voter qu'une seule fois par élection
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Votre vote est crypté immédiatement après soumission
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Votre identité n'est jamais liée à votre choix de vote
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Les résultats seront publiés après la fermeture de l'élection
                    </li>
                  </ul>
                </div>

                {!election.has_voted && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={() => handleVote(election.id)}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Vote className="w-5 h-5 mr-2" />
                      Aller Voter
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">
                      Cliquez pour accéder au bulletin de vote sécurisé
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Info sécurité */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Rappel de Sécurité</h4>
              <p className="text-sm text-blue-800">
                Votre vote est entièrement anonyme et crypté. Personne, y compris les administrateurs,
                ne peut voir pour qui vous avez voté. Seuls les résultats agrégés seront publiés.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoterDashboardPage;