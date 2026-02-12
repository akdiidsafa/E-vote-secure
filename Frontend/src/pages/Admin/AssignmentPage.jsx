import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserCheck, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI, usersAPI } from '../../services/api';

const AssignmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const electionIdFromUrl = searchParams.get('election');

  const [elections, setElections] = useState([]);
  const [voters, setVoters] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Pré-sélectionner l'élection depuis l'URL
  useEffect(() => {
    if (electionIdFromUrl && elections.length > 0 && !selectedElection) {
      console.log('🔵 Pré-sélection élection:', electionIdFromUrl);
      setSelectedElection(electionIdFromUrl);
    }
  }, [electionIdFromUrl, elections]);

  // Charger les assignations quand une élection est sélectionnée
  useEffect(() => {
    if (selectedElection && voters.length > 0) {
      console.log('🔵 Chargement assignations pour élection:', selectedElection);
      loadAssignedVoters(selectedElection);
    }
  }, [selectedElection, voters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les élections
      const electionsRes = await electionsAPI.getAll();
      const electionsData = Array.isArray(electionsRes.data) 
        ? electionsRes.data 
        : electionsRes.data.results || [];
      setElections(electionsData);
      console.log('✅ Élections chargées:', electionsData.length);

      // Charger les électeurs
      const usersRes = await usersAPI.getAll();
      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.results || [];
      
      const votersOnly = usersData.filter(u => u.role === 'voter');
      setVoters(votersOnly);
      console.log('✅ Électeurs chargés:', votersOnly.length);
      
      // Initialiser les assignations (tous non assignés par défaut)
      setAssignments(votersOnly.map(v => ({ ...v, assigned: false })));

    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les électeurs déjà assignés à une élection
  const loadAssignedVoters = async (electionId) => {
    try {
      const response = await electionsAPI.getVoters(electionId);
      const assignedData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      // Extraire les IDs des électeurs assignés
      const assignedVoterIds = assignedData.map(item => 
        item.voter?.id || item.voter_details?.id
      ).filter(Boolean);
      
      console.log('✅ Électeurs déjà assignés:', assignedVoterIds);
      
      // Mettre à jour les assignations
      setAssignments(voters.map(v => ({
        ...v,
        assigned: assignedVoterIds.includes(v.id)
      })));
      
    } catch (error) {
      console.error('❌ Erreur chargement assignations:', error);
      // Réinitialiser tous à non assignés en cas d'erreur
      setAssignments(voters.map(v => ({ ...v, assigned: false })));
    }
  };

  const handleToggleAssignment = (voterId) => {
    setAssignments(prev => 
      prev.map(v => 
        v.id === voterId ? { ...v, assigned: !v.assigned } : v
      )
    );
  };

  const handleAssignAll = () => {
    setAssignments(assignments.map(v => ({ ...v, assigned: true })));
  };

  const handleUnassignAll = () => {
    setAssignments(assignments.map(v => ({ ...v, assigned: false })));
  };

  const handleSave = async () => {
    if (!selectedElection) {
      alert('Veuillez sélectionner une élection');
      return;
    }

    try {
      const assignedVoterIds = assignments
        .filter(v => v.assigned)
        .map(v => v.id);

      console.log('📤 Assignation:', {
        election_id: selectedElection,
        voter_ids: assignedVoterIds
      });

      await electionsAPI.assignVoters(selectedElection, assignedVoterIds);
      
      alert(`✅ ${assignedVoterIds.length} électeur(s) assigné(s) avec succès!`);
      navigate(`/admin/elections/${selectedElection}`);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  const assignedCount = assignments.filter(v => v.assigned).length;
  const unassignedCount = assignments.length - assignedCount;

  const selectedElectionData = elections.find(e => e.id === parseInt(selectedElection));

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
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Assignation des Électeurs aux Élections</h1>
              <p className="text-sm text-gray-600">Contrôlez quels électeurs peuvent voter dans chaque élection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total Électeurs</p>
            <p className="text-3xl font-bold">{assignments.length}</p>
            <p className="text-xs text-gray-500">Dans la base de données</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Assignés à cette élection</p>
            <p className="text-3xl font-bold text-green-600">{assignedCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Non assignés</p>
            <p className="text-3xl font-bold text-orange-600">{unassignedCount}</p>
          </Card>
        </div>

        {/* Election Selector */}
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Sélectionner une élection</h3>
          
          {elections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Aucune élection disponible</p>
              <Button onClick={() => navigate('/admin/elections/create')}>
                Créer une élection
              </Button>
            </div>
          ) : (
            <>
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Sélectionnez une élection --</option>
                {elections.map(election => (
                  <option key={election.id} value={election.id}>
                    {election.title} - {election.status === 'open' ? 'Ouverte' : election.status === 'draft' ? 'Brouillon' : 'Fermée'}
                  </option>
                ))}
              </select>

              {selectedElectionData && selectedElectionData.status === 'open' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Attention:</strong> Cette élection est <strong>Ouverte</strong>. 
                    Modifier les électeurs peut affecter le vote en cours.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {selectedElection && (
          <>
            {/* Assignment Controls */}
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Électeurs de l'élection : {selectedElectionData?.title}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleAssignAll}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Assigner Tous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUnassignAll}
                  >
                    Désassigner Tous
                  </Button>
                </div>
              </div>
            </Card>

            {/* Voters List */}
            <Card>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Aucun électeur dans la base de données</p>
                  <Button onClick={() => navigate('/admin/voters')}>
                    Ajouter des électeurs
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {assignments.map((voter) => (
                      <div
                        key={voter.id}
                        className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                          voter.assigned
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleAssignment(voter.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              voter.assigned
                                ? 'border-green-600 bg-green-600'
                                : 'border-gray-300'
                            }`}>
                              {voter.assigned && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{voter.username}</p>
                              <p className="text-sm text-gray-600">{voter.email}</p>
                            </div>
                          </div>
                          {voter.assigned && (
                            <Badge variant="success">Assigné</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {assignedCount} électeur(s) assigné(s) sur {assignments.length}
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        variant="secondary"
                        onClick={() => navigate('/admin/dashboard')}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSave}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Enregistrer les Assignations
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentPage;