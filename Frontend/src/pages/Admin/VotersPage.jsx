import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User, Mail, Upload, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

const VotersPage = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [voters, setVoters] = useState([
    {
      id: 1,
      name: 'Marie Dupont',
      email: 'marie.dupont@email.com',
      username: 'voter1',
      status: 'active',
      hasVoted: false,
      assignedElections: ['Élection Présidentielle 2024']
    },
    {
      id: 2,
      name: 'Pierre Martin',
      email: 'pierre.martin@email.com',
      username: 'voter2',
      status: 'active',
      hasVoted: false,
      assignedElections: ['Élection Présidentielle 2024']
    },
    {
      id: 3,
      name: 'fifi',
      email: 'fifi@gmail.com',
      username: 'fifif',
      status: 'active',
      hasVoted: false,
      assignedElections: []
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: ''
  });

  const filteredVoters = voters.filter(voter => 
    voter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVoter = (e) => {
    e.preventDefault();
    const newVoter = {
      id: voters.length + 1,
      ...formData,
      status: 'active',
      hasVoted: false,
      assignedElections: []
    };
    setVoters([...voters, newVoter]);
    setFormData({ name: '', email: '', username: '' });
    setShowAddModal(false);
    alert('Électeur ajouté avec succès!');
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet électeur?')) {
      setVoters(voters.filter(v => v.id !== id));
      alert('Électeur supprimé avec succès!');
    }
  };

  const handleEdit = (id) => {
    alert(`Modifier l'électeur #${id}\nCette fonctionnalité sera implémentée prochainement.`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        alert(`Fichier sélectionné: ${file.name}\nL'importation sera implémentée avec le backend.`);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const csvContent = [
      ['Nom', 'Email', 'Nom d\'utilisateur', 'Statut'],
      ...voters.map(v => [v.name, v.email, v.username, v.status])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electeurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('Liste des électeurs exportée avec succès!');
  };

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
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
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
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total Électeurs</p>
            <p className="text-3xl font-bold">{voters.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Assignés à cette élection</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Non assignés</p>
            <p className="text-3xl font-bold text-orange-600">{voters.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Ont voté</p>
            <p className="text-3xl font-bold text-green-600">
              {voters.filter(v => v.hasVoted).length}
            </p>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nom d'utilisateur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">A voté</th>
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
                        <button
                          onClick={() => alert(`Profil de ${voter.name}\nCette page sera implémentée prochainement.`)}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {voter.name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{voter.email}</td>
                    <td className="py-3 px-4 text-gray-600">{voter.username}</td>
                    <td className="py-3 px-4">
                      <Badge variant={voter.status === 'active' ? 'success' : 'danger'}>
                        {voter.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {voter.hasVoted ? (
                        <Badge variant="success">Oui</Badge>
                      ) : (
                        <Badge variant="warning">Non</Badge>
                      )}
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
        </Card>
      </div>

      {/* Add Voter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ajouter un Nouvel Électeur</h2>
            
            <form onSubmit={handleAddVoter} className="space-y-4">
              <Input
                name="name"
                label="Nom complet"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
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
                name="username"
                label="Nom d'utilisateur"
                placeholder="jeandupont"
                value={formData.username}
                onChange={handleChange}
                icon={User}
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Un mot de passe temporaire sera envoyé à l'électeur par email.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', email: '', username: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter l'Électeur
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