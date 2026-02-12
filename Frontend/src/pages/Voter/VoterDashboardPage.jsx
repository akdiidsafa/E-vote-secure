import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Info, Vote, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const VoterDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Check if user has voted (from localStorage for now)
  const [hasVoted, setHasVoted] = useState(() => {
    const votedElections = JSON.parse(localStorage.getItem('voted_elections') || '[]');
    return votedElections.includes(1); // election ID 1
  });

  // Mock election data
  const election = {
    id: 1,
    title: 'Élection Présidentielle 2024',
    status: 'open',
    start_date: '2024-12-15T08:00:00',
    end_date: '2024-12-20T20:00:00',
    hasVoted: hasVoted,
  };

  const handleVote = () => {
    navigate(`/voter/vote/${election.id}`);
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
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold">Vote Électronique Sécurisé</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">{user?.name}</span>
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
          <p className="text-gray-600">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {election.title}
              </h2>
              <Badge variant="success">Ouverte</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-2">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                <p className="font-medium">15 décembre 2024, 08:00</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="font-medium">20 décembre 2024, 20:00</p>
              </div>
            </div>
          </div>

          {election.hasVoted ? (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <p className="font-medium text-success-800">Vous avez déjà voté</p>
                  <p className="text-sm text-success-700">
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
                <span className="text-primary-600 mr-2">•</span>
                Vous ne pouvez voter qu'une seule fois par élection
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Votre vote est crypté immédiatement après soumission
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Votre identité n'est jamais liée à votre choix de vote
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Les résultats seront publiés après la fermeture de l'élection
              </li>
            </ul>
          </div>

          {!election.hasVoted && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleVote}
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
      </div>
    </div>
  );
};

export default VoterDashboardPage;