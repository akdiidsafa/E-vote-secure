import React, { useState, useEffect } from 'react';
import { Users, Vote, TrendingUp, Plus, UserPlus, UserCheck, Lock, LockOpen, User, Clock, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { electionsAPI, usersAPI, invitationsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    totalVoters: 0,
    totalVotes: 0,
    participationRate: 0,
  });
  const [recentElections, setRecentElections] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showElectionSelector, setShowElectionSelector] = useState(false);
  const [actionType, setActionType] = useState(null);
  
  // NOUVEAU: Validations en attente
  const [pendingValidationsCount, setPendingValidationsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    loadPendingValidations();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const electionsResponse = await electionsAPI.getAll();
      const electionsData = Array.isArray(electionsResponse.data) 
        ? electionsResponse.data 
        : electionsResponse.data.results || [];
      
      setElections(electionsData);
      
      const usersResponse = await usersAPI.getAll();
      const users = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data.results || [];
      
      const voters = users.filter(u => u.role === 'voter');
      const activeElections = electionsData.filter(e => e.status === 'open');
      const totalVotes = electionsData.reduce((sum, e) => sum + (e.total_votes || 0), 0);
      
      setStats({
        totalElections: electionsData.length,
        activeElections: activeElections.length,
        totalVoters: voters.length,
        totalVotes: totalVotes,
        participationRate: voters.length > 0 ? ((totalVotes / voters.length) * 100).toFixed(1) : 0,
      });
      
      setRecentElections(electionsData.slice(0, 5));
      
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // NOUVEAU: Charger les validations en attente
  const loadPendingValidations = async () => {
    try {
      const response = await invitationsAPI.getPending();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPendingValidationsCount(data.length);
    } catch (err) {
      console.error('❌ Erreur validations:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenVote = () => {
    const draftElections = elections.filter(e => e.status === 'draft');
    
    if (draftElections.length === 0) {
      showError(
        'Aucune élection disponible',
        'Aucune élection en brouillon à ouvrir. Créez d\'abord une élection avec des candidats et des électeurs assignés.'
      );
      return;
    }

    if (draftElections.length === 1) {
      openElection(draftElections[0].id, draftElections[0].title);
    } else {
      setActionType('open');
      setShowElectionSelector(true);
    }
  };

  const handleCloseVote = () => {
    const openElections = elections.filter(e => e.status === 'open');
    
    if (openElections.length === 0) {
      showError('Aucune élection ouverte', 'Aucune élection ouverte à fermer.');
      return;
    }

    if (openElections.length === 1) {
      closeElection(openElections[0].id, openElections[0].title);
    } else {
      setActionType('close');
      setShowElectionSelector(true);
    }
  };

  const openElection = async (id, title) => {
    if (window.confirm(`Voulez-vous ouvrir l'élection "${title}" ?`)) {
      try {
        await electionsAPI.open(id);
        success('Vote ouvert!', `L'élection "${title}" est maintenant ouverte au vote.`);
        fetchDashboardData();
      } catch (error) {
        console.error('❌ Erreur:', error);
        const errorMsg = error.response?.data?.error || 'Erreur lors de l\'ouverture du vote';
        showError('Erreur d\'ouverture', errorMsg);
      }
    }
    setShowElectionSelector(false);
  };

  const closeElection = async (id, title) => {
    if (window.confirm(`⚠️ Voulez-vous vraiment fermer l'élection "${title}" ?\n\nAprès fermeture, aucun vote ne pourra plus être soumis.`)) {
      try {
        await electionsAPI.close(id);
        success('Vote fermé!', `L'élection "${title}" a été fermée avec succès.`);
        fetchDashboardData();
      } catch (error) {
        console.error('❌ Erreur:', error);
        showError('Erreur de fermeture', 'Impossible de fermer l\'élection.');
      }
    }
    setShowElectionSelector(false);
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

  const getElectionsToShow = () => {
    if (actionType === 'open') {
      return elections.filter(e => e.status === 'draft');
    } else if (actionType === 'close') {
      return elections.filter(e => e.status === 'open');
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Réessayer</Button>
        </Card>
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
              <div>
                <h1 className="text-xl font-semibold">Vote Électronique Sécurisé</h1>
                <Badge variant="warning" className="mt-1">Administrateur</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* NOUVEAU: Badge de notifications */}
              {pendingValidationsCount > 0 && (
                <Button 
                  variant="warning" 
                  size="sm"
                  onClick={() => navigate('/admin/pending-validations')}
                  className="relative"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Validations
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingValidationsCount}
                  </span>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profil
              </Button>
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
              className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium"
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
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 relative"
            >
              Électeurs
              {/* NOUVEAU: Badge sur l'onglet */}
              {pendingValidationsCount > 0 && (
                <span className="absolute top-2 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingValidationsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/admin/assignment')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Assignation
            </button>
            <button 
              onClick={() => navigate('/admin/results')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Résultats
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-2">Tableau de Bord Administrateur</h2>
        <p className="text-gray-600 mb-8">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })} - {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* NOUVEAU: Alerte validations en attente */}
        {pendingValidationsCount > 0 && (
          <Card className="mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  {pendingValidationsCount} demande(s) de validation en attente
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Des électeurs ont soumis leur formulaire d'inscription et attendent votre approbation.
                </p>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => navigate('/admin/pending-validations')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Voir les demandes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Électeurs Inscrits</p>
                <p className="text-3xl font-bold">{stats.totalVoters}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Votes Soumis</p>
                <p className="text-3xl font-bold">{stats.totalVotes}</p>
                <p className="text-xs text-gray-500">Total toutes élections</p>
              </div>
              <Vote className="w-12 h-12 text-green-500" />
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600 mb-1">Élections Actives</p>
              <p className="text-xl font-bold mb-2">{stats.activeElections}</p>
              <Badge variant="success">
                {stats.totalElections} élection(s) au total
              </Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taux de Participation</p>
                <p className="text-3xl font-bold">{stats.participationRate}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Actions Rapides */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="primary" 
              className="w-full justify-center"
              onClick={() => navigate('/admin/elections/create')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer une Nouvelle Élection
            </Button>
            
            <Button 
              variant="primary" 
              className="w-full justify-center"
              onClick={() => navigate('/admin/candidates')}
            >
              <Users className="w-5 h-5 mr-2" />
              Gérer les Candidats
            </Button>
            
            <Button 
              variant="primary" 
              className="w-full justify-center"
              onClick={() => navigate('/admin/voters')}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Gérer les Électeurs
            </Button>
            
            <Button 
              variant="success" 
              className="w-full justify-center"
              onClick={() => navigate('/admin/assignment')}
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Assigner aux Élections
            </Button>
                       
            <Button 
              variant="success"
              className="w-full justify-center"
              onClick={handleOpenVote}
            >
              <Lock className="w-5 h-5 mr-2" />
              Ouvrir le Vote
            </Button>
            
            <Button 
              variant="danger"
              className="w-full justify-center"
              onClick={handleCloseVote}
            >
              <LockOpen className="w-5 h-5 mr-2" />
              Fermer le Vote
            </Button>
          </div>
        </Card>

        {/* Élections Récentes */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Élections Récentes</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/elections')}
            >
              Voir tout
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nom de l'élection</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Période</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Candidats</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Participation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentElections.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      Aucune élection pour le moment. Créez-en une!
                    </td>
                  </tr>
                ) : (
                  recentElections.map((election) => (
                    <tr key={election.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">{election.title}</td>
                      <td className="py-3 px-4">
                        {getStatusBadge(election.status)}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(election.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} -{' '}
                        {new Date(election.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">{election.total_candidates || 0}</td>
                      <td className="py-3 px-4">{election.participation_rate || 0}%</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/elections/${election.id}/edit`)}
                            className={`font-medium text-sm ${
                              election.status === 'open' || election.status === 'closed'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                            disabled={election.status === 'open' || election.status === 'closed'}
                          >
                            Modifier
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/elections/${election.id}`)}
                            className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                          >
                            Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Security Reminder */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Rappel de Sécurité</h4>
              <p className="text-sm text-blue-800">
                En tant qu'administrateur, vous n'avez accès qu'aux données agrégées. 
                Les votes individuels sont cryptés et ne peuvent être consultés par personne, y compris vous.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Election Selector Modal */}
      {showElectionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {actionType === 'open' ? 'Sélectionnez l\'élection à ouvrir' : 'Sélectionnez l\'élection à fermer'}
            </h2>
            
            <div className="space-y-3">
              {getElectionsToShow().map((election) => (
                <button
                  key={election.id}
                  onClick={() => actionType === 'open' ? openElection(election.id, election.title) : closeElection(election.id, election.title)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{election.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(election.start_date).toLocaleDateString('fr-FR')} - {new Date(election.end_date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {election.total_candidates || 0} candidats • {election.total_voters || 0} électeurs
                      </p>
                    </div>
                    {getStatusBadge(election.status)}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowElectionSelector(false)}
              >
                Annuler
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;