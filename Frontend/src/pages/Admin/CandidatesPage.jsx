// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Plus, Edit2, Trash2, User, Users as UsersIcon } from 'lucide-react';
// import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
// import Input from '../../components/ui/Input';
// import Badge from '../../components/ui/Badge';
// import { candidatesAPI, electionsAPI } from '../../services/api';

// const CandidatesPage = () => {
//   const navigate = useNavigate();
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [candidates, setCandidates] = useState([]);
//   const [elections, setElections] = useState([]);
//   const [selectedElection, setSelectedElection] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     name: '',
//     party: '',
//     program: '',
//     photo: '',
//     election: '',
//   });

//   useEffect(() => {
//     loadData();
//   }, []);

//   useEffect(() => {
//     if (selectedElection) {
//       loadCandidatesByElection(selectedElection);
//     } else {
//       loadCandidates();
//     }
//   }, [selectedElection]);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       await Promise.all([loadElections(), loadCandidates()]);
//     } catch (error) {
//       console.error('❌ Erreur:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadElections = async () => {
//     try {
//       const response = await electionsAPI.getAll();
//       const electionsData = Array.isArray(response.data)
//         ? response.data
//         : response.data.results || [];
//       setElections(electionsData);
//     } catch (error) {
//       console.error('❌ Erreur chargement élections:', error);
//     }
//   };

//   const loadCandidates = async () => {
//     try {
//       const response = await candidatesAPI.getAll();
//       const candidatesData = Array.isArray(response.data)
//         ? response.data
//         : response.data.results || [];
//       setCandidates(candidatesData);
//     } catch (error) {
//       console.error('❌ Erreur chargement candidats:', error);
//     }
//   };

//   const loadCandidatesByElection = async (electionId) => {
//     try {
//       const response = await candidatesAPI.getByElection(electionId);
//       const candidatesData = Array.isArray(response.data)
//         ? response.data
//         : response.data.results || [];
//       setCandidates(candidatesData);
//     } catch (error) {
//       console.error('❌ Erreur:', error);
//       setCandidates([]);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleAddCandidate = async (e) => {
//     e.preventDefault();
    
//     if (!formData.name || !formData.election) {
//       alert('Veuillez remplir tous les champs obligatoires');
//       return;
//     }

//     try {
//       const candidateData = {
//   name: formData.name,
//   party: formData.party || '',
//   program: formData.program || '',
//   election: parseInt(formData.election),
//   order: 0,
// };


// if (formData.photo && formData.photo.trim() !== '') {
//   candidateData.photo = formData.photo;
// }

//       console.log('📤 Envoi candidat:', candidateData);

//       const response = await candidatesAPI.create(candidateData);
//       console.log('✅ Réponse:', response.data);
      
//       alert('✅ Candidat créé avec succès!');
      
//       setFormData({
//         name: '',
//         party: '',
//         program: '',
//         photo: '',
//         election: '',
//       });
//       setShowAddModal(false);
      
//       if (selectedElection) {
//         loadCandidatesByElection(selectedElection);
//       } else {
//         loadCandidates();
//       }
//     } catch (error) {
//       console.error('❌ Erreur complète:', error);
//       console.error('❌ Réponse:', error.response?.data);
      
//       // Afficher l'erreur exacte du backend
//       const errorMsg = error.response?.data?.name?.[0]
//         || error.response?.data?.election?.[0]
//         || error.response?.data?.order?.[0]
//         || error.response?.data?.detail
//         || error.response?.data?.message
//         || JSON.stringify(error.response?.data)
//         || 'Erreur lors de la création du candidat';
      
//       alert('❌ ' + errorMsg);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat?')) return;

//     try {
//       await candidatesAPI.delete(id);
//       alert('✅ Candidat supprimé avec succès!');
      
//       if (selectedElection) {
//         loadCandidatesByElection(selectedElection);
//       } else {
//         loadCandidates();
//       }
//     } catch (error) {
//       console.error('❌ Erreur:', error);
//       alert('Erreur lors de la suppression');
//     }
//   };

//   const handleEdit = (id) => {
//     alert(`Modifier le candidat #${id}\nCette fonctionnalité sera implémentée prochainement.`);
//   };

//   const selectedElectionData = elections.find(e => e.id === parseInt(selectedElection));
//   const isElectionLocked = selectedElectionData && (selectedElectionData.status === 'open' || selectedElectionData.status === 'closed');

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <p className="text-gray-600">Chargement...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <Button 
//                 variant="ghost" 
//                 size="sm"
//                 onClick={() => navigate('/admin/dashboard')}
//               >
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Retour
//               </Button>
//               <div>
//                 <h1 className="text-xl font-semibold">Gestion des Candidats</h1>
//                 <p className="text-sm text-gray-600">Assignez des candidats aux élections et gérez leurs informations</p>
//               </div>
//             </div>
//             <Button 
//               variant="primary"
//               onClick={() => setShowAddModal(true)}
//               disabled={isElectionLocked}
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               {isElectionLocked ? 'Élection verrouillée' : 'Créer Candidat'}
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Election Selector */}
//         <Card className="mb-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="font-semibold">Filtrer par élection</h3>
//               <p className="text-sm text-gray-600">Afficher les candidats d'une élection spécifique</p>
//             </div>
//             {isElectionLocked && (
//               <Badge variant="warning">
//                 {selectedElectionData.status === 'open' ? 'Ouverte' : 'Fermée'} - Modifications verrouillées
//               </Badge>
//             )}
//           </div>
          
//           <select
//             value={selectedElection}
//             onChange={(e) => setSelectedElection(e.target.value)}
//             className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="">-- Toutes les élections --</option>
//             {elections.map(election => (
//               <option key={election.id} value={election.id}>
//                 {election.title} ({election.status === 'open' ? 'Ouverte' : election.status === 'draft' ? 'Brouillon' : election.status === 'closed' ? 'Fermée' : 'En attente'})
//               </option>
//             ))}
//           </select>
//         </Card>

//         {/* Stats */}
//         <div className="grid grid-cols-3 gap-6 mb-6">
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">Total Candidats</p>
//             <p className="text-3xl font-bold">{candidates.length}</p>
//             <p className="text-xs text-gray-500">
//               {selectedElection ? 'Dans cette élection' : 'Dans toutes les élections'}
//             </p>
//           </Card>
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">Élections</p>
//             <p className="text-3xl font-bold text-blue-600">{elections.length}</p>
//           </Card>
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">Statut</p>
//             {isElectionLocked ? (
//               <Badge variant="warning" className="text-lg">Verrouillé</Badge>
//             ) : (
//               <Badge variant="success" className="text-lg">Modifiable</Badge>
//             )}
//           </Card>
//         </div>

//         {/* Candidates List */}
//         <Card>
//           <h3 className="text-lg font-semibold mb-4">
//             {selectedElection 
//               ? `Candidats de : ${selectedElectionData?.title}` 
//               : 'Tous les Candidats'}
//           </h3>

//           {candidates.length === 0 ? (
//             <div className="text-center py-12">
//               <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//               <p className="text-gray-600 mb-4">Aucun candidat trouvé</p>
//               <Button 
//                 variant="primary" 
//                 onClick={() => setShowAddModal(true)}
//                 disabled={isElectionLocked}
//               >
//                 <Plus className="w-4 h-4 mr-2" />
//                 Ajouter votre premier candidat
//               </Button>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {candidates.map((candidate) => (
//                 <div
//                   key={candidate.id}
//                   className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
//                 >
//                   <div className="flex items-start space-x-4">
//                     <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
//                       {candidate.photo ? (
//                         <img
//                           src={candidate.photo}
//                           alt={candidate.name}
//                           className="w-20 h-20 rounded-full object-cover"
//                         />
//                       ) : (
//                         <User className="w-10 h-10 text-gray-400" />
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <h4 className="font-semibold text-lg">{candidate.name}</h4>
//                       <p className="text-sm text-gray-600 mb-2">{candidate.party || 'Indépendant'}</p>
//                       <p className="text-sm text-gray-700 mb-3">{candidate.program || 'Pas de programme'}</p>
//                       <p className="text-xs text-gray-500 mb-2">
//                         Élection: {candidate.election_title}
//                       </p>
//                       <div className="flex space-x-2">
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => handleEdit(candidate.id)}
//                           disabled={isElectionLocked}
//                         >
//                           <Edit2 className="w-4 h-4 mr-1" />
//                           Modifier
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => handleDelete(candidate.id)}
//                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                           disabled={isElectionLocked}
//                         >
//                           <Trash2 className="w-4 h-4 mr-1" />
//                           Supprimer
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card>

//         {/* Back Button */}
//         <div className="mt-6 text-center">
//           <Button
//             variant="ghost"
//             onClick={() => navigate('/admin/dashboard')}
//           >
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Retour au tableau de bord
//           </Button>
//         </div>
//       </div>

//       {/* Add Candidate Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Ajouter un Nouveau Candidat</h2>
            
//             <form onSubmit={handleAddCandidate} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                   Élection <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="election"
//                   value={formData.election}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 >
//                   <option value="">-- Sélectionnez une élection --</option>
//                   {elections
//                     .filter(e => e.status === 'draft' || e.status === 'waiting')
//                     .map(election => (
//                       <option key={election.id} value={election.id}>
//                         {election.title}
//                       </option>
//                     ))}
//                 </select>
//               </div>

//               <Input
//                 name="name"
//                 label="Nom complet"
//                 placeholder="Ex: Jean Dupont"
//                 value={formData.name}
//                 onChange={handleChange}
//                 icon={User}
//                 required
//               />

//               <Input
//                 name="party"
//                 label="Parti politique"
//                 placeholder="Ex: Parti Moderne"
//                 value={formData.party}
//                 onChange={handleChange}
//               />

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                   Programme électoral
//                 </label>
//                 <textarea
//                   name="program"
//                   rows="4"
//                   className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                   placeholder="Décrivez le programme du candidat..."
//                   value={formData.program}
//                   onChange={handleChange}
//                 />
//               </div>

//               <Input
//                 name="photo"
//                 label="URL de la photo (optionnel)"
//                 placeholder="https://example.com/photo.jpg"
//                 value={formData.photo}
//                 onChange={handleChange}
//               />

//               <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
//                 <Button
//                   type="button"
//                   variant="secondary"
//                   onClick={() => {
//                     setShowAddModal(false);
//                     setFormData({
//                       name: '',
//                       party: '',
//                       program: '',
//                       photo: '',
//                       election: '',
//                     });
//                   }}
//                 >
//                   Annuler
//                 </Button>
//                 <Button type="submit" variant="primary">
//                   <Plus className="w-4 h-4 mr-2" />
//                   Ajouter le Candidat
//                 </Button>
//               </div>
//             </form>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CandidatesPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { candidatesAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const CandidatesPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    program: '',
    photo: '',
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

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.election) {
      showError('Champs manquants', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const candidateData = {
        name: formData.name,
        party: formData.party || '',
        program: formData.program || '',
        election: parseInt(formData.election),
        order: 0,
      };

      if (formData.photo && formData.photo.trim() !== '') {
        candidateData.photo = formData.photo;
      }

      console.log('📤 Envoi candidat:', candidateData);

      const response = await candidatesAPI.create(candidateData);
      console.log('✅ Réponse:', response.data);
      
      success('Candidat créé!', 'Le candidat a été ajouté avec succès à l\'élection.');
      
      setFormData({
        name: '',
        party: '',
        program: '',
        photo: '',
        election: '',
      });
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
        || err.response?.data?.detail
        || err.response?.data?.message
        || JSON.stringify(err.response?.data)
        || 'Une erreur est survenue';
      
      showError('Erreur de création', errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat?')) return;

    try {
      await candidatesAPI.delete(id);
      success('Candidat supprimé!', 'Le candidat a été supprimé avec succès.');
      
      if (selectedElection) {
        loadCandidatesByElection(selectedElection);
      } else {
        loadCandidates();
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de suppression', 'Impossible de supprimer le candidat.');
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
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
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
                      <p className="text-sm text-gray-600 mb-2">{candidate.party || 'Indépendant'}</p>
                      <p className="text-sm text-gray-700 mb-3">{candidate.program || 'Pas de programme'}</p>
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
                          onClick={() => handleDelete(candidate.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

              <Input
                name="party"
                label="Parti politique"
                placeholder="Ex: Parti Moderne"
                value={formData.party}
                onChange={handleChange}
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
                    setFormData({
                      name: '',
                      party: '',
                      program: '',
                      photo: '',
                      election: '',
                    });
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