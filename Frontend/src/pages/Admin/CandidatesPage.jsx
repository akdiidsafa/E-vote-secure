
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User, Upload, X,TriangleAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { candidatesAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import {  AlertDialog,  AlertDialogAction,  AlertDialogCancel,  AlertDialogContent,  AlertDialogDescription,  AlertDialogFooter,  AlertDialogHeader,
  AlertDialogTitle,} from '../../components/ui/AlertDialog';



const CandidatesPage = () => {
  const navigate = useNavigate();
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    candidateId: null, 
    candidateName: '' 
  });
  const { success, error: showError } = useNotification();
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    party: '', 
    program: '', 
    photo: null, 
    election: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      loadCandidatesByElection(selectedElection);
    } else {
      loadCandidates();
    }
  }, [selectedElection]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadElections(), loadCandidates()]);
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadElections = async () => {
    try {
      const response = await electionsAPI.getAll();
      const electionsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setElections(electionsData);
    } catch (error) {
      console.error('❌ Erreur chargement élections:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      const response = await candidatesAPI.getAll();
      const candidatesData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setCandidates(candidatesData);
    } catch (error) {
      console.error('❌ Erreur chargement candidats:', error);
    }
  };

  const loadCandidatesByElection = async (electionId) => {
    try {
      const response = await candidatesAPI.getByElection(electionId);
      const candidatesData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setCandidates(candidatesData);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setCandidates([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ NOUVEAU: Gestion de l'upload de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      showError('Fichier invalide', 'Veuillez sélectionner une image (.jpg, .png)');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Fichier trop volumineux', 'La taille maximale est de 5 MB');
      return;
    }

    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setFormData(prev => ({ ...prev, photo: file }));
    };
    reader.readAsDataURL(file);
  };

  // ✅ NOUVEAU: Supprimer la photo
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo: null }));
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.election) {
      showError('Champs manquants', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // ✅ MODIFIÉ: Utiliser FormData pour l'upload de fichier
      const candidateFormData = new FormData();
      candidateFormData.append('name', formData.name);
      candidateFormData.append('party', formData.party || ''); // Profession/Poste
      candidateFormData.append('program', formData.program || ''); // Description
      candidateFormData.append('election', parseInt(formData.election));
      candidateFormData.append('order', 0);

      // Ajouter la photo si elle existe
      if (formData.photo) {
        candidateFormData.append('photo', formData.photo);
      }

      console.log('📤 Envoi candidat avec photo...');

      const response = await candidatesAPI.create(candidateFormData);
      console.log('✅ Réponse:', response.data);
      
      success('Candidat créé!', 'Le candidat a été ajouté avec succès à l\'élection.');
      
      // Reset form
      setFormData({
        name: '',
        party: '',
        program: '',
        photo: null,
        election: '',
      });
      setPhotoPreview(null);
      setShowAddModal(false);
      
      if (selectedElection) {
        loadCandidatesByElection(selectedElection);
      } else {
        loadCandidates();
      }
    } catch (err) {
      console.error('❌ Erreur complète:', err);
      console.error('❌ Réponse:', err.response?.data);
      
      const errorMsg = err.response?.data?.name?.[0]
        || err.response?.data?.election?.[0]
        || err.response?.data?.order?.[0]
        || err.response?.data?.photo?.[0]
        || err.response?.data?.detail
        || err.response?.data?.message
        || JSON.stringify(err.response?.data)
        || 'Une erreur est survenue';
      
      showError('Erreur de création', errorMsg);
    }
  };

  const handleDelete = async () => {
  if (!deleteDialog.candidateId) return;

  try {
    await candidatesAPI.delete(deleteDialog.candidateId);
    success('Candidat supprimé!', 'Le candidat a été supprimé avec succès.');
    
    if (selectedElection) {
      loadCandidatesByElection(selectedElection);
    } else {
      loadCandidates();
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
    showError('Erreur de suppression', 'Impossible de supprimer le candidat.');
  } finally {
    setDeleteDialog({ isOpen: false, candidateId: null, candidateName: '' });
  }
};

  const handleEdit = (id) => {
    showError('Fonctionnalité indisponible', 'La modification sera bientôt disponible.');
  };

  const selectedElectionData = elections.find(e => e.id === parseInt(selectedElection));
  const isElectionLocked = selectedElectionData && (selectedElectionData.status === 'open' || selectedElectionData.status === 'closed');

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
                className="text-blue-600 hover:text-blue-800"
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
              disabled={isElectionLocked}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isElectionLocked ? 'Élection verrouillée' : 'Créer Candidat'}
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
              <h3 className="font-semibold">Filtrer par élection</h3>
              <p className="text-sm text-gray-600">Afficher les candidats d'une élection spécifique</p>
            </div>
            {isElectionLocked && (
              <Badge variant="warning">
                {selectedElectionData.status === 'open' ? 'Ouverte' : 'Fermée'} - Modifications verrouillées
              </Badge>
            )}
          </div>
          
          <select
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Toutes les élections --</option>
            {elections.map(election => (
              <option key={election.id} value={election.id}>
                {election.title} ({election.status === 'open' ? 'Ouverte' : election.status === 'draft' ? 'Brouillon' : election.status === 'closed' ? 'Fermée' : 'En attente'})
              </option>
            ))}
          </select>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total Candidats</p>
            <p className="text-3xl font-bold">{candidates.length}</p>
            <p className="text-xs text-gray-500">
              {selectedElection ? 'Dans cette élection' : 'Dans toutes les élections'}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Élections</p>
            <p className="text-3xl font-bold text-blue-600">{elections.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Statut</p>
            {isElectionLocked ? (
              <Badge variant="warning" className="text-lg">Verrouillé</Badge>
            ) : (
              <Badge variant="success" className="text-lg">Modifiable</Badge>
            )}
          </Card>
        </div>

        {/* Candidates List */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            {selectedElection 
              ? `Candidats de : ${selectedElectionData?.title}` 
              : 'Tous les Candidats'}
          </h3>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun candidat trouvé</p>
              <Button 
                variant="primary" 
                onClick={() => setShowAddModal(true)}
                disabled={isElectionLocked}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter votre premier candidat
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {candidate.photo ? (
                        <img
                          src={candidate.photo}
                          alt={candidate.name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{candidate.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {candidate.party || 'Profession non renseignée'}
                      </p>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {candidate.program || 'Aucune description'}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Élection: {candidate.election_title}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(candidate.id)}
                          disabled={isElectionLocked}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDialog({ 
                            isOpen: true, 
                            candidateId: candidate.id, 
                            candidateName: candidate.name 
                          })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isElectionLocked}
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
          )}
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Ajouter un Nouveau Candidat</h2>
            
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Élection <span className="text-red-500">*</span>
                </label>
                <select
                  name="election"
                  value={formData.election}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Sélectionnez une élection --</option>
                  {elections
                    .filter(e => e.status === 'draft' || e.status === 'waiting')
                    .map(election => (
                      <option key={election.id} value={election.id}>
                        {election.title}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                name="name"
                label="Nom complet"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={handleChange}
                icon={User}
                required
              />

              {/* ✅ MODIFIÉ: Profession au lieu de Parti */}
              <Input
                name="party"
                label="Profession / Poste actuel"
                placeholder="Ex: Directeur Général, Entrepreneur, Professeur..."
                value={formData.party}
                onChange={handleChange}
              />

              {/* ✅ MODIFIÉ: Description au lieu de Programme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description & Objectifs
                </label>
                <textarea
                  name="program"
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Décrivez le parcours du candidat et ses objectifs..."
                  value={formData.program}
                  onChange={handleChange}
                />
              </div>

              {/* ✅ NOUVEAU: Upload de photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photo du candidat
                </label>
                
                {!photoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Cliquez pour télécharger une photo
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG - Max 5 MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Prévisualisation"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      party: '',
                      program: '',
                      photo: null,
                      election: '',
                    });
                    setPhotoPreview(null);
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
       {/* ✅ AlertDialog de suppression */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => setDeleteDialog({ isOpen: open, candidateId: null, candidateName: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-red-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <TriangleAlert className="text-red-600 size-6" />
            </div>
            <AlertDialogTitle>Supprimer ce candidat ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Cette action ne peut pas être annulée. Cela supprimera définitivement le candidat
              <strong> {deleteDialog.candidateName}</strong> de cette élection.
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

export default CandidatesPage;