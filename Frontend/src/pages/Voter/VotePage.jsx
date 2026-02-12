import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Vote, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const VotePage = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const candidates = [
    {
      id: 1,
      name: 'Jean-Pierre Martin',
      program: 'Pour une France moderne et unie. Économie durable, équité sociale',
      photo: 'https://via.placeholder.com/80'
    },
    {
      id: 2,
      name: 'Sophie Dubois',
      program: 'Transition écologique urgente. Emploi vert, innovation technologique, égalité',
      photo: 'https://via.placeholder.com/80'
    },
    {
      id: 3,
      name: 'Michel Rousseau',
      program: 'Sécurité et ordre public prioritaires. Protection des citoyens',
      photo: 'https://via.placeholder.com/80'
    },
    {
      id: 4,
      name: 'Émilie Leroy',
      program: 'Jeunesse au pouvoir. Révolution numérique, entrepreneuriat, réforme des institutions',
      photo: 'https://via.placeholder.com/80'
    }
  ];

  const handleSubmitVote = () => {
    setShowConfirm(true);
  };

  const handleConfirmVote = () => {
    // Here you would call the encryption service and submit vote
    // Save vote
  const votedElections = JSON.parse(localStorage.getItem('voted_elections') || '[]');
  votedElections.push(parseInt(electionId));
  localStorage.setItem('voted_elections', JSON.stringify(votedElections));
  
  // Navigate to confirmation
  navigate('/voter/confirmation');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/voter/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </Button>

        <Card>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Tableau de bord {'>'} Vote</p>
            <h1 className="text-2xl font-bold">Élection Élection Présidentielle 2024</h1>
          </div>

          <p className="text-gray-600 mb-2">
            Sélectionnez un candidat et soumettez votre vote. Vous ne pourrez voter qu'une seule fois.
          </p>
          <p className="text-sm text-gray-500 mb-6">4 candidats au total</p>

          <div className="space-y-4 mb-8">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCandidate?.id === candidate.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-full bg-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.program}</p>
                  </div>
                  {selectedCandidate?.id === candidate.id && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={() => navigate('/voter/dashboard')}
            >
              Annuler et retourner au tableau de bord
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitVote}
              disabled={!selectedCandidate}
              size="lg"
            >
              <Vote className="w-5 h-5 mr-2" />
              Soumettre mon Vote
            </Button>
          </div>
        </Card>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Confirmer votre vote</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-center text-gray-700 mb-2">
                  Vous êtes sur le point de soumettre votre vote.
                </p>
                <p className="text-center text-sm text-gray-600 mb-1">
                  Votre vote sera immédiatement crypté sur le serveur.
                </p>
                <p className="text-center text-sm text-gray-600 mb-1">
                  Votre identité ne sera jamais associée à votre choix.
                </p>
                <p className="text-center text-sm font-semibold text-gray-800 mt-3">
                  Vous ne pourrez pas modifier votre vote après cette étape.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleConfirmVote}
                >
                  Confirmer et Soumettre
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowConfirm(false)}
                >
                  Annuler
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotePage;