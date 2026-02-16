import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User, Mail, Download, Send, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { usersAPI, invitationsAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const VotersPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voters, setVoters] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVoter, setEditingVoter] = useState(null);
  const [activeTab, setActiveTab] = useState('voters'); // 'voters' or 'invitations'
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  
  const [inviteFormData, setInviteFormData] = useState({
    full_name: '',
    email: '',
    election: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadVoters(),
        loadInvitations(),
        loadElections()
      ]);
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoters = async () => {
    try {
      const response = await usersAPI.getAll();
      const usersData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      const votersOnly = usersData.filter(u => u.role === 'voter');
      setVoters(votersOnly);
    } catch (error) {
      console.error('❌ Erreur:', error);
      showError('Erreur de chargement', 'Impossible de charger les électeurs');
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await invitationsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setInvitations(data);
    } catch (error) {
      console.error('❌ Erreur invitations:', error);
    }
  };

  const loadElections = async () => {
    try {
      const response = await electionsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setElections(data);
    } catch (error) {
      console.error('❌ Erreur élections:', error);
    }
  };

  const filteredVoters = voters.filter(voter => 
    voter.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitations = invitations.filter(inv => 
    inv.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSendInvitation = async (e) => {
  e.preventDefault();
  
  if (!inviteFormData.full_name || !inviteFormData.email || !inviteFormData.election) {
    showError('Champs manquants', 'Veuillez remplir tous les champs');
    return;
  }

  // VÉRIFIER SI L'INVITATION EXISTE DÉJÀ (côté client)
  const existingInvitation = invitations.find(
    inv => inv.email.toLowerCase() === inviteFormData.email.toLowerCase() && 
           inv.election === parseInt(inviteFormData.election)
  );

  if (existingInvitation) {
    showError(
      'Invitation déjà envoyée',
      `Cette personne a déjà été invitée pour cette élection.\nStatut actuel: ${existingInvitation.status}`
    );
    return;
  }

  try {
    const dataToSend = {
      full_name: inviteFormData.full_name,
      email: inviteFormData.email,
      election: parseInt(inviteFormData.election)
    };

    await invitationsAPI.create(dataToSend);
    
    success(
      'Invitation envoyée!',
      `Une invitation a été envoyée à ${inviteFormData.email}`
    );
    
    setInviteFormData({
      full_name: '',
      email: '',
      election: '',
    });
    setShowInviteModal(false);
    loadInvitations();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('❌ Réponse serveur:', error.response?.data);
    
    let errorMsg = 'Une erreur est survenue';
    
    // Gestion spécifique de l'erreur de doublon
    if (error.response?.data?.non_field_errors) {
      showError(
        'Invitation déjà envoyée',
        'Cette personne a déjà été invitée pour cette élection. Vérifiez l\'onglet "Invitations".'
      );
      return;
    }
    
    // Autres erreurs de validation
    if (error.response?.data) {
      if (error.response.data.email) {
        errorMsg = error.response.data.email[0];
      } else if (error.response.data.election) {
        errorMsg = error.response.data.election[0];
      } else if (error.response.data.full_name) {
        errorMsg = error.response.data.full_name[0];
      } else if (error.response.data.detail) {
        errorMsg = error.response.data.detail;
      }
    }
    
    showError('Erreur d\'invitation', errorMsg);
  }
};

  const handleAddVoter = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.username || !formData.email || !formData.password) {
        showError('Champs manquants', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      const voterData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password,
        role: 'voter',
      };

      if (formData.first_name) {
        voterData.first_name = formData.first_name;
      }
      if (formData.last_name) {
        voterData.last_name = formData.last_name;
      }

      await usersAPI.create(voterData);
      success('Électeur créé!', 'L\'électeur a été ajouté avec succès.');
      
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
      });
      setShowAddModal(false);
      loadVoters();
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      const errorMsg = error.response?.data?.username?.[0] 
        || error.response?.data?.email?.[0]
        || error.response?.data?.password?.[0]
        || error.response?.data?.password2?.[0]
        || error.response?.data?.detail 
        || JSON.stringify(error.response?.data)
        || 'Une erreur est survenue';
      
      showError('Erreur de création', errorMsg);
    }
  };

  const handleEdit = (voter) => {
    setEditingVoter(voter);
    setEditFormData({
      username: voter.username,
      email: voter.email,
      first_name: voter.first_name || '',
      last_name: voter.last_name || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateVoter = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        username: editFormData.username,
        email: editFormData.email,
        first_name: editFormData.first_name || '',
        last_name: editFormData.last_name || '',
      };

      await usersAPI.update(editingVoter.id, updateData);
      success('Électeur modifié!', 'Les informations ont été mises à jour.');
      
      setShowEditModal(false);
      setEditingVoter(null);
      loadVoters();
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      const errorMsg = error.response?.data?.username?.[0] 
        || error.response?.data?.email?.[0]
        || error.response?.data?.detail 
        || JSON.stringify(error.response?.data)
        || 'Une erreur est survenue';
      
      showError('Erreur de modification', errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet électeur?')) return;

    try {
      await usersAPI.delete(id);
      success('Électeur supprimé!', 'L\'électeur a été supprimé avec succès.');
      loadVoters();
    } catch (error) {
      console.error('❌ Erreur:', error);
      showError('Erreur de suppression', 'Impossible de supprimer l\'électeur.');
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Nom d\'utilisateur', 'Email', 'Prénom', 'Nom'],
      ...voters.map(v => [v.username, v.email, v.first_name || '', v.last_name || ''])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electeurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    success('Export réussi!', 'La liste des électeurs a été téléchargée.');
  };

  const getStatusBadge = (status) => {
    const config = {
      'INVITED': { label: 'Invité', variant: 'secondary' },
      'PENDING': { label: 'En attente', variant: 'warning' },
      'AUTHORIZED': { label: 'Autorisé', variant: 'success' },
      'VOTED': { label: 'A voté', variant: 'success' },
      'REJECTED': { label: 'Rejeté', variant: 'danger' },
      'EXPIRED': { label: 'Expiré', variant: 'secondary' },
    };
    const c = config[status] || config['INVITED'];
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const pendingCount = invitations.filter(i => i.status === 'PENDING').length;

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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Gestion des Électeurs</h1>
                <p className="text-sm text-gray-600">Gérez la liste des électeurs autorisés</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="success"
                onClick={() => setShowInviteModal(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Inviter un électeur
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter directement
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total Électeurs</p>
            <p className="text-3xl font-bold">{voters.length}</p>
            <p className="text-xs text-gray-500">Comptes créés</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Invitations envoyées</p>
            <p className="text-3xl font-bold text-blue-600">{invitations.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">En attente de validation</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            {pendingCount > 0 && (
              <Button
                size="sm"
                variant="warning"
                className="mt-2"
                onClick={() => navigate('/admin/pending-validations')}
              >
                <Clock className="w-3 h-3 mr-1" />
                Voir les validations
              </Button>
            )}
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Autorisés</p>
            <p className="text-3xl font-bold text-green-600">
              {invitations.filter(i => i.status === 'AUTHORIZED').length}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('voters')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'voters'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Électeurs ({voters.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Invitations ({invitations.length})
          </button>
        </div>

        {/* Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {activeTab === 'voters' ? 'Liste des Électeurs' : 'Liste des Invitations'}
            </h3>
            <Input
              placeholder="Rechercher..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'voters' ? (
            // TABLE ÉLECTEURS
            filteredVoters.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucun électeur trouvé</p>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter votre premier électeur
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nom d'utilisateur</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nom complet</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVoters.map((voter) => (
                      <tr key={voter.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{voter.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{voter.email}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {voter.first_name || voter.last_name 
                            ? `${voter.first_name || ''} ${voter.last_name || ''}`.trim()
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success">Actif</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(voter)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(voter.id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // TABLE INVITATIONS
            filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune invitation envoyée</p>
                <Button variant="success" onClick={() => setShowInviteModal(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer votre première invitation
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nom complet</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Élection</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((invitation) => (
                      <tr key={invitation.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Mail className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-medium">{invitation.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{invitation.email}</td>
                        <td className="py-3 px-4 text-gray-600">{invitation.election_title}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(invitation.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(invitation.invited_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Card>
      </div>

      {/* Modal: Inviter un électeur */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Inviter un nouvel électeur</h2>
            
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <Input
                name="full_name"
                label="Nom complet"
                placeholder="Ex: Jean Dupont"
                value={inviteFormData.full_name}
                onChange={handleInviteChange}
                icon={User}
                required
              />

              <Input
                name="email"
                type="email"
                label="Adresse email"
                placeholder="jean.dupont@email.com"
                value={inviteFormData.email}
                onChange={handleInviteChange}
                icon={Mail}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Élection <span className="text-red-500">*</span>
                </label>
                <select
                  name="election"
                  value={inviteFormData.election}
                  onChange={handleInviteChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Sélectionnez une élection --</option>
                  {elections.map(election => (
                    <option key={election.id} value={election.id}>
                      {election.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Un email d'invitation sera envoyé à cette adresse avec un lien unique.
                  Le votant devra soumettre un formulaire, puis vous devrez valider sa demande.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteFormData({
                      full_name: '',
                      email: '',
                      election: '',
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="success">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'invitation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Ajouter directement */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ajouter un électeur directement</h2>
            
            <form onSubmit={handleAddVoter} className="space-y-4">
              <Input
                name="username"
                label="Nom d'utilisateur"
                placeholder="Ex: jdupont"
                value={formData.username}
                onChange={handleChange}
                icon={User}
                required
              />

              <Input
                name="email"
                type="email"
                label="Adresse email"
                placeholder="jean.dupont@email.com"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <Input
                name="password"
                type="password"
                label="Mot de passe"
                placeholder="Mot de passe initial"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="first_name"
                  label="Prénom (optionnel)"
                  placeholder="Jean"
                  value={formData.first_name}
                  onChange={handleChange}
                />

                <Input
                  name="last_name"
                  label="Nom (optionnel)"
                  placeholder="Dupont"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Création directe:</strong> L'électeur est créé immédiatement sans processus de validation.
                  Préférez le système d'invitation pour plus de sécurité.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      username: '',
                      email: '',
                      password: '',
                      first_name: '',
                      last_name: '',
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer l'Électeur
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Modifier */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Modifier l'Électeur</h2>
            
            <form onSubmit={handleUpdateVoter} className="space-y-4">
              <Input
                name="username"
                label="Nom d'utilisateur"
                placeholder="Ex: jdupont"
                value={editFormData.username}
                onChange={handleEditChange}
                icon={User}
                required
              />

              <Input
                name="email"
                type="email"
                label="Adresse email"
                placeholder="jean.dupont@email.com"
                value={editFormData.email}
                onChange={handleEditChange}
                icon={Mail}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="first_name"
                  label="Prénom (optionnel)"
                  placeholder="Jean"
                  value={editFormData.first_name}
                  onChange={handleEditChange}
                />

                <Input
                  name="last_name"
                  label="Nom (optionnel)"
                  placeholder="Dupont"
                  value={editFormData.last_name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Le mot de passe ne peut pas être modifié via cette interface.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVoter(null);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VotersPage;