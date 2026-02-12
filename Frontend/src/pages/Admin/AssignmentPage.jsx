import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const AssignmentPage = () => {
  const navigate = useNavigate();
  const [selectedElection, setSelectedElection] = useState('election-1');

  const voters = [
    { id: 1, name: 'Marie Dupont', email: 'marie.dupont@email.com', assigned: false },
    { id: 2, name: 'Pierre Martin', email: 'pierre.martin@email.com', assigned: false },
    { id: 3, name: 'Sophie Bernard', email: 'sophie.bernard@email.com', assigned: false },
  ];

  const [assignments, setAssignments] = useState([
    { id: 1, name: 'Marie Dupont', email: 'marie.dupont@email.com', assigned: false },
    { id: 2, name: 'Pierre Martin', email: 'pierre.martin@email.com', assigned: true },
    { id: 3, name: 'Sophie Bernard', email: 'sophie.bernard@email.com', assigned: true },
  ]);

  
  const handleToggleAssignment = (voterId) => {
    setAssignments(prevAssignments => 
      prevAssignments.map(v => 
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

  const handleSave = () => {
    const assignedCount = assignments.filter(v => v.assigned).length;
    alert(`${assignedCount} électeur(s) assigné(s) avec succès!`);
  };

  const assignedCount = assignments.filter(v => v.assigned).length;
  const unassignedCount = assignments.length - assignedCount;

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
          <select
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="election-1">Élection Présidentielle 2024 - Ouverte</option>
          </select>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Cette élection est <strong>Ouverte</strong>. Les électeurs ne peuvent plus être modifiés.
            </p>
          </div>
        </Card>

        {/* Assignment Controls */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Électeurs de l'élection : Élection Présidentielle 2024</h3>
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
                      <p className="font-medium">{voter.name}</p>
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
        </Card>
      </div>
    </div>
  );
};

export default AssignmentPage;