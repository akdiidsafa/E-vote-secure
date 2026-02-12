import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

const CandidatesPage = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('candidates');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: 1,
        name: 'Jean-Pierre Martin',
        party: 'Parti Moderne',
        program: 'Pour une France moderne et unie. Économie durable, équité sociale',
        photo: 'https://via.placeholder.com/80',
        assignedElections: ['Élection Présidentielle 2024']
      },
      {
        id: 2,
        name: 'Sophie Dubois',
        party: 'Écologie Unie',
        program: 'Transition écologique urgente. Emploi vert, innovation technologique',
        photo: 'https://via.placeholder.com/80',
        assignedElections: ['Élection Présidentielle 2024']
      },
      {
        id: 3,
        name: 'Michel Rousseau',
        party: 'Sécurité Nationale',
        program: 'Sécurité et ordre public prioritaires. Protection des citoyens',
        photo: 'https://via.placeholder.com/80',
        assignedElections: ['Élection Présidentielle 2024']
      },
      {
        id: 4,
        name: 'Émilie Leroy',
        party: 'Jeunesse Active',
        program: 'Jeunesse au pouvoir. Révolution numérique, entrepreneuriat',
        photo: 'https://via.placeholder.com/80',
        assignedElections: ['Élection Présidentielle 2024']
      }
    ];
  });

  // Save to localStorage whenever candidates change
  useEffect(() => {
    localStorage.setItem('candidates', JSON.stringify(candidates));
  }, [candidates]);

  const [formData, setFormData] = useState({
    name: '',
    party: '',
    program: '',
    photo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    const newCandidate = {
    //   id: candidates.length + 1,
    id: Date.now(),
      ...formData,
      photo: formData.photo || 'https://via.placeholder.com/80',
      assignedElections: ['Élection Présidentielle 2024']
    };
    setCandidates([...candidates, newCandidate]);
    setFormData({ name: '', party: '', program: '', photo: '' });
    setShowAddModal(false);
    alert('Candidat ajouté avec succès!');
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat?')) {
      setCandidates(candidates.filter(c => c.id !== id));
      alert('Candidat supprimé avec succès!');
    }
  };

  const handleEdit = (id) => {
    alert(`Modifier le candidat #${id}\nCette fonctionnalité sera implémentée prochainement.`);
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
                <h1 className="text-xl font-semibold">Gestion des Candidats</h1>
                <p className="text-sm text-gray-600">Assignez des candidats aux élections et gérez leurs informations</p>
              </div>
            </div>
            <Button 
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer Candidat/Électeur
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Election Selector */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Sélectionner une élection</h3>
              <p className="text-sm text-gray-600">Élection Présidentielle 2024</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Cette élection est</span>
              <Badge variant="success">Ouverte</Badge>
              <span className="text-sm text-gray-500">Les candidats ne peuvent plus être modifiés.</span>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total Candidats</p>
            <p className="text-3xl font-bold">{candidates.length}</p>
            <p className="text-xs text-gray-500">Dans la base de données</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Assignés à cette élection</p>
            <p className="text-3xl font-bold text-blue-600">{candidates.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Non assignés</p>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </Card>
        </div>

        {/* Candidates List */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            Candidats de l'élection : Élection Présidentielle 2024
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-20 h-20 rounded-full bg-gray-200"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{candidate.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{candidate.party}</p>
                    <p className="text-sm text-gray-700 mb-3">{candidate.program}</p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(candidate.id)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(candidate.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Ajouter un Nouveau Candidat</h2>
            
            <form onSubmit={handleAddCandidate} className="space-y-4">
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
                name="party"
                label="Parti politique"
                placeholder="Ex: Parti Moderne"
                value={formData.party}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Programme électoral
                </label>
                <textarea
                  name="program"
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Décrivez le programme du candidat..."
                  value={formData.program}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                name="photo"
                label="URL de la photo (optionnel)"
                placeholder="https://example.com/photo.jpg"
                value={formData.photo}
                onChange={handleChange}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', party: '', program: '', photo: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le Candidat
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage;