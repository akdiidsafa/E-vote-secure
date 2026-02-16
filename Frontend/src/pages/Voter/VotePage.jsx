import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Vote as VoteIcon, CheckCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI, candidatesAPI, votesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const VotePage = () => {
  const { id } = useParams(); // ← IMPORTANT: "id" pas "electionId"
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadElectionData();
  }, [id]);

  const loadElectionData = async () => {
    try {
      setLoading(true);
      
      // Charger l'élection
      const electionResponse = await electionsAPI.getById(id);
      setElection(electionResponse.data);

      // Vérifier si l'élection est ouverte
      if (electionResponse.data.status !== 'open') {
        showError('Élection fermée', 'Cette élection n\'est pas ouverte au vote.');
        navigate('/voter/dashboard');
        return;
      }

      // Vérifier si déjà voté
      if (electionResponse.data.has_voted) {
        showError('Déjà voté', 'Vous avez déjà voté pour cette élection.');
        navigate('/voter/dashboard');
        return;
      }

      // Charger les candidats
      const candidatesResponse = await candidatesAPI.getByElection(id);
      const candidatesData = Array.isArray(candidatesResponse.data)
        ? candidatesResponse.data
        : candidatesResponse.data.results || [];
      
      setCandidates(candidatesData);
    } catch (err) {
      console.error('❌ Erreur:', err);
      console.error('❌ Réponse serveur:', err.response?.data); 
      const errorMsg = err.response?.data?.detail  || err.response?.data?.error || 'Une erreur est survenue';
  
      showError('Erreur de vote', errorMsg);
      setShowConfirmation(false);

      navigate('/voter/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleSubmitVote = () => {
    if (!selectedCandidate) {
      showError('Aucun choix', 'Veuillez sélectionner un candidat');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
  if (!selectedCandidate) return;

  try {
    setSubmitting(true);

    // UTILISEZ submit au lieu de create
    await votesAPI.submit({
      election: parseInt(id),
      candidate: selectedCandidate.id,
    });

    success(
      'Vote enregistré!',
      'Votre vote a été enregistré avec succès. Merci d\'avoir participé!'
    );

    // Rediriger vers la page de confirmation
    navigate('/voter/confirmation');

  } catch (err) {
    console.error('❌ Erreur:', err);
    const errorMsg = err.response?.data?.detail 
      || err.response?.data?.error
      || 'Une erreur est survenue lors de l\'enregistrement de votre vote';
    
    showError('Erreur de vote', errorMsg);
    setShowConfirmation(false);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement du bulletin de vote...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Élection introuvable</h2>
          <Button onClick={() => navigate('/voter/dashboard')}>
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/voter/dashboard')}
          className="mb-4"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </Button>

        <Card>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Tableau de bord {'>'} Vote</p>
            <h1 className="text-2xl font-bold">{election.title}</h1>
            {election.description && (
              <p className="text-gray-600 mt-2">{election.description}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Sélectionnez un candidat en cliquant sur sa carte</li>
              <li>• Vérifiez votre choix avant de confirmer</li>
              <li>• Votre vote est définitif et ne peut pas être modifié</li>
              <li>• Votre vote est totalement anonyme</li>
            </ul>
          </div>

          <p className="text-gray-600 mb-2">
            Sélectionnez un candidat et soumettez votre vote. Vous ne pourrez voter qu'une seule fois.
          </p>
          <p className="text-sm text-gray-500 mb-6">{candidates.length} candidat(s) au total</p>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun candidat disponible pour cette élection</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {candidate.photo ? (
                        <img
                          src={candidate.photo}
                          alt={candidate.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{candidate.name}</h3>
                      {candidate.party && (
                        <p className="text-sm text-gray-600 mb-1">{candidate.party}</p>
                      )}
                      {candidate.program && (
                        <p className="text-sm text-gray-700">{candidate.program}</p>
                      )}
                    </div>
                    {selectedCandidate?.id === candidate.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {candidates.length > 0 && (
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                onClick={() => navigate('/voter/dashboard')}
                disabled={submitting}
              >
                Annuler et retourner au tableau de bord
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitVote}
                disabled={!selectedCandidate || submitting}
                size="lg"
              >
                <VoteIcon className="w-5 h-5 mr-2" />
                Soumettre mon Vote
              </Button>
            </div>
          )}
        </Card>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Confirmer votre vote</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-center text-gray-700 mb-2">
                  Vous êtes sur le point de soumettre votre vote pour:
                </p>
                <p className="text-center font-semibold text-lg text-gray-900 mb-3">
                  {selectedCandidate?.name}
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
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : 'Confirmer et Soumettre'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowConfirmation(false)}
                  disabled={submitting}
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