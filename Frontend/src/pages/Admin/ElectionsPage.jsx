import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, BarChart,TriangleAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
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

const ElectionsPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, electionId: null, electionTitle: '' });
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await electionsAPI.getAll();
      const electionsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      setElections(electionsData);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Impossible de charger les élections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
  if (!deleteDialog.electionId) return;

  try {
    await electionsAPI.delete(deleteDialog.electionId);
    success('Élection supprimée!', 'L\'élection a été supprimée avec succès.');
    fetchElections();
  } catch (err) {
    showError('Erreur de suppression', 'Impossible de supprimer l\'élection.');
  } finally {
    setDeleteDialog({ isOpen: false, electionId: null, electionTitle: '' });
  }
};

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { label: 'Brouillon', variant: 'secondary' },
      'waiting': { label: 'En attente', variant: 'warning' },
      'open': { label: 'Ouverte', variant: 'success' },
      'closed': { label: 'Fermée', variant: 'danger' },
      'archived': { label: 'Archivée', variant: 'secondary' },
    };
    const config = statusConfig[status] || statusConfig['draft'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredElections = elections.filter(election => {
    if (filter === 'all') return true;
    return election.status === filter;
  });

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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Toutes les Élections</h1>
              <p className="text-gray-600">Gérez toutes vos élections</p>
            </div>
            <Button 
              variant="primary"
              onClick={() => navigate('/admin/elections/create')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Élection
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {[
            { value: 'all', label: 'Tout' },
            { value: 'draft', label: 'Brouillon' },
            { value: 'waiting', label: 'En attente' },
            { value: 'open', label: 'Ouverte' },
            { value: 'closed', label: 'Fermée' },
            { value: 'archived', label: 'Archivée' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Elections Table */}
        <Card>
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchElections}>Réessayer</Button>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune élection
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre première élection
              </p>
              <Button onClick={() => navigate('/admin/elections/create')}>
                <Plus className="w-5 h-5 mr-2" />
                Créer une élection
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Nom de l'élection
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Période
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Candidats
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Participation
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredElections.map((election) => (
                    <tr
                      key={election.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {election.title}
                        </div>
                        {election.description && (
                          <div className="text-sm text-gray-500">
                            {election.description.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(election.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(election.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        -{' '}
                        {new Date(election.end_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{election.total_candidates || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <BarChart className="w-4 h-4 text-gray-400" />
                          <span>{election.participation_rate || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/elections/${election.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Voir
                          </button>
                          <button
                            onClick={() => navigate(`/admin/elections/${election.id}/edit`)}
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ 
                              isOpen: true, 
                              electionId: election.id, 
                              electionTitle: election.title 
                            })}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Info Box */}
        {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Astuce:</strong> Les élections créées ici sont stockées dans la base de données Django.
            Vous pouvez aussi les gérer depuis l'admin Django à http://localhost:8000/admin/
          </p>
        </div> */}
      </div>
      {/* ✅ AlertDialog de suppression */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => setDeleteDialog({ isOpen: open, electionId: null, electionTitle: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-red-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <TriangleAlert className="text-red-600 size-6" />
            </div>
            <AlertDialogTitle>Supprimer cette élection ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Cette action ne peut pas être annulée. Cela supprimera définitivement l'élection
              <strong> {deleteDialog.electionTitle}</strong> ainsi que tous ses candidats et votes associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
   
    </div>
  );
};

export default ElectionsPage;