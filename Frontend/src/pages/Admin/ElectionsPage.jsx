import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI } from '../../services/api';

const ElectionsPage = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      console.log('🔍 Chargement des élections depuis le backend...');
      const response = await electionsAPI.getAll();
      console.log('✅ Données reçues:', response.data);
      setElections(response.data);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du chargement des élections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette élection ?')) return;

    try {
      await electionsAPI.delete(id);
      alert('Élection supprimée!');
      loadElections();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      waiting: { label: 'En attente', variant: 'warning' },
      open: { label: 'Ouverte', variant: 'success' },
      closed: { label: 'Fermée', variant: 'danger' },
    };
    const { label, variant } = config[status] || config.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </button>
              <h1 className="text-2xl font-bold">Toutes les Élections</h1>
              <p className="text-gray-600">Gérez toutes vos élections</p>
            </div>
            <Button onClick={() => navigate('/admin/elections/create')}>
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Élection
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          {elections.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">Aucune élection</h3>
              <p className="text-gray-600 mb-4">
                Les élections sont stockées dans la base de données Django.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Créez votre première élection ou ajoutez-en une depuis Django Admin.
              </p>
              <Button onClick={() => navigate('/admin/elections/create')}>
                Créer une élection
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Nom de l'élection</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Période</th>
                  <th className="text-left py-3 px-4">Candidats</th>
                  <th className="text-left py-3 px-4">Participation</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((election) => (
                  <tr key={election.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{election.title}</td>
                    <td className="py-3 px-4">{getStatusBadge(election.status)}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(election.start_date).toLocaleDateString('fr-FR')} - {new Date(election.end_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-center">{election.total_candidates || 0}</td>
                    <td className="py-3 px-4 text-center">{election.participation_rate || 0}%</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/elections/${election.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => navigate(`/admin/elections/${election.id}/edit`)}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(election.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Les données affichées proviennent de la base de données Django (http://localhost:8000).
            Vous pouvez aussi créer des élections via Django Admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;
