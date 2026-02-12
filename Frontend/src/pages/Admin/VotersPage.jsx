import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User, Mail, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { usersAPI } from '../../services/api';

const VotersPage = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    loadVoters();
  }, []);

  const loadVoters = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      const usersData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      // Filtrer uniquement les électeurs
      const votersOnly = usersData.filter(u => u.role === 'voter');
      setVoters(votersOnly);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du chargement des électeurs');
    } finally {
      setLoading(false);
    }
  };

  const filteredVoters = voters.filter(voter => 
    voter.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddVoter = async (e) => {
  e.preventDefault();
  
  try {
    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Préparer les données avec password2 (confirmation)
    const voterData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password2: formData.password,  // ← AJOUTER CETTE LIGNE
      role: 'voter',
    };

    // Ajouter first_name et last_name seulement s'ils sont remplis
    if (formData.first_name) {
      voterData.first_name = formData.first_name;
    }
    if (formData.last_name) {
      voterData.last_name = formData.last_name;
    }

    console.log('📤 Création électeur:', voterData);

    const response = await usersAPI.create(voterData);
    
    console.log('✅ Réponse:', response.data);
    alert('✅ Électeur créé avec succès!');
    
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
    console.error('❌ Erreur complète:', error);
    console.error('❌ Détails:', error.response?.data);
    
    // Afficher le message d'erreur exact du backend
    const errorMsg = error.response?.data?.username?.[0] 
      || error.response?.data?.email?.[0]
      || error.response?.data?.password?.[0]
      || error.response?.data?.password2?.[0]
      || error.response?.data?.detail 
      || error.response?.data?.message
      || JSON.stringify(error.response?.data)
      || 'Erreur lors de la création de l\'électeur';
    
    alert('❌ ' + errorMsg);
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet électeur?')) return;

    try {
      await usersAPI.delete(id);
      alert('✅ Électeur supprimé avec succès!');
      loadVoters();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (id) => {
    alert(`Modifier l'électeur #${id}\nCette fonctionnalité sera implémentée prochainement.`);
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
    
    alert('✅ Liste des électeurs exportée avec succès!');
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
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Électeur
              </Button>
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
            <p className="text-3xl font-bold">{voters.length}</p>
            <p className="text-xs text-gray-500">Dans la base de données</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Actifs</p>
            <p className="text-3xl font-bold text-green-600">{voters.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Recherche</p>
            <p className="text-3xl font-bold text-blue-600">{filteredVoters.length}</p>
          </Card>
        </div>

        {/* Voters Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Liste des Électeurs</h3>
            <Input
              placeholder="Rechercher par nom..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredVoters.length === 0 ? (
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
                            onClick={() => handleEdit(voter.id)}
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
          )}
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Les électeurs sont stockés dans la base de données Django.
            Vous pouvez aussi les créer via Django Admin.
          </p>
        </div>
      </div>

      {/* Add Voter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ajouter un Nouvel Électeur</h2>
            
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  L'électeur pourra se connecter avec son nom d'utilisateur et son mot de passe.
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
    </div>
  );
};

export default VotersPage;