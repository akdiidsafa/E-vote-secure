// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { ArrowLeft, Calendar, Users, Vote, Edit2 } from 'lucide-react';
// import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
// import Badge from '../../components/ui/Badge';
// import { electionsAPI } from '../../services/api';

// const ViewElectionPage = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [election, setElection] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchElection();
//   }, [id]);

//   const fetchElection = async () => {
//     try {
//       setLoading(true);
//       const response = await electionsAPI.getById(id);
//       setElection(response.data);
//     } catch (err) {
//       console.error('❌ Erreur:', err);
//       setError('Impossible de charger l\'élection');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const config = {
//       draft: { label: 'Brouillon', variant: 'secondary' },
//       waiting: { label: 'En attente', variant: 'warning' },
//       open: { label: 'Ouverte', variant: 'success' },
//       closed: { label: 'Fermée', variant: 'danger' },
//       archived: { label: 'Archivée', variant: 'secondary' },
//     };
//     const { label, variant } = config[status] || config.draft;
//     return <Badge variant={variant}>{label}</Badge>;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <p className="text-gray-600">Chargement...</p>
//       </div>
//     );
//   }

//   if (error || !election) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <Card className="p-8 max-w-md">
//           <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
//           <p className="text-gray-700 mb-4">{error || 'Élection introuvable'}</p>
//           <Button onClick={() => navigate('/admin/elections')}>
//             Retour aux élections
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 shadow-sm">
//         <div className="max-w-5xl mx-auto px-4 py-6">
//           <button
//             onClick={() => navigate('/admin/elections')}
//             className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
//           >
//             <ArrowLeft className="w-4 h-4 mr-1" />
//             Retour aux élections
//           </button>
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
//               <p className="text-gray-600 mt-1">{election.description || 'Aucune description'}</p>
//             </div>
//             <Button
//               variant="primary"
//               onClick={() => navigate(`/admin/elections/${id}/edit`)}
//             >
//               <Edit2 className="w-4 h-4 mr-2" />
//               Modifier
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-5xl mx-auto px-4 py-8">
//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Statut</p>
//                 {getStatusBadge(election.status)}
//               </div>
//               <Vote className="w-8 h-8 text-blue-500" />
//             </div>
//           </Card>

//           <Card>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Candidats</p>
//                 <p className="text-2xl font-bold">{election.total_candidates || 0}</p>
//               </div>
//               <Users className="w-8 h-8 text-green-500" />
//             </div>
//           </Card>

//           <Card>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Votes</p>
//                 <p className="text-2xl font-bold">{election.total_votes || 0}</p>
//               </div>
//               <Vote className="w-8 h-8 text-purple-500" />
//             </div>
//           </Card>

//           <Card>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Participation</p>
//                 <p className="text-2xl font-bold">{election.participation_rate || 0}%</p>
//               </div>
//               <Calendar className="w-8 h-8 text-orange-500" />
//             </div>
//           </Card>
//         </div>

//         {/* Details */}
//         <Card className="mb-8">
//           <h2 className="text-lg font-semibold mb-4">Détails de l'Élection</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Date de début
//               </label>
//               <div className="flex items-center space-x-2 text-gray-900">
//                 <Calendar className="w-5 h-5 text-gray-400" />
//                 <span>
//                   {new Date(election.start_date).toLocaleString('fr-FR', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                   })}
//                 </span>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Date de fin
//               </label>
//               <div className="flex items-center space-x-2 text-gray-900">
//                 <Calendar className="w-5 h-5 text-gray-400" />
//                 <span>
//                   {new Date(election.end_date).toLocaleString('fr-FR', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                   })}
//                 </span>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Créée le
//               </label>
//               <p className="text-gray-900">
//                 {new Date(election.created_at).toLocaleString('fr-FR', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                   hour: '2-digit',
//                   minute: '2-digit'
//                 })}
//               </p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Dernière modification
//               </label>
//               <p className="text-gray-900">
//                 {new Date(election.updated_at).toLocaleString('fr-FR', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                   hour: '2-digit',
//                   minute: '2-digit'
//                 })}
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Actions */}
//         <Card>
//           <h2 className="text-lg font-semibold mb-4">Actions Disponibles</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Button
//               variant="primary"
//               className="w-full justify-center"
//               onClick={() => navigate(`/admin/elections/${id}/edit`)}
//             >
//               <Edit2 className="w-5 h-5 mr-2" />
//               Modifier l'Élection
//             </Button>
            
//             <Button
//               variant="primary"
//               className="w-full justify-center"
//               onClick={() => navigate(`/admin/candidates`)}
//             >
//               <Users className="w-5 h-5 mr-2" />
//               Gérer les Candidats
//             </Button>
            
//             <Button
//               variant="primary"
//               className="w-full justify-center"
//               onClick={() => navigate(`/admin/assignment?election=${id}`)}
//             >
//               <Vote className="w-5 h-5 mr-2" />
//               Assigner des Électeurs
//             </Button>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default ViewElectionPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Vote, Edit2, UserCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI } from '../../services/api';

const ViewElectionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [assignedVoters, setAssignedVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
  try {
    setLoading(true);
    
    // Charger l'élection
    const electionRes = await electionsAPI.getById(id);
    setElection(electionRes.data);

    // Charger les électeurs assignés
    try {
      const votersRes = await electionsAPI.getVoters(id);
      console.log('✅ Électeurs:', votersRes.data);
      
      // ← FIX: Extraire le tableau results
      const votersData = Array.isArray(votersRes.data) 
        ? votersRes.data 
        : votersRes.data.results || [];
      
      setAssignedVoters(votersData);
    } catch (err) {
      console.log('ℹ️ Pas d\'électeurs assignés');
      setAssignedVoters([]);
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
    setError('Impossible de charger l\'élection');
  } finally {
    setLoading(false);
  }
};

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      waiting: { label: 'En attente', variant: 'warning' },
      open: { label: 'Ouverte', variant: 'success' },
      closed: { label: 'Fermée', variant: 'danger' },
      archived: { label: 'Archivée', variant: 'secondary' },
    };
    const { label, variant } = config[status] || config.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-4">{error || 'Élection introuvable'}</p>
          <Button onClick={() => navigate('/admin/elections')}>
            Retour aux élections
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/admin/elections')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux élections
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
              <p className="text-gray-600 mt-1">{election.description || 'Aucune description'}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/admin/elections/${id}/edit`)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                {getStatusBadge(election.status)}
              </div>
              <Vote className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Candidats</p>
                <p className="text-2xl font-bold">{election.total_candidates || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Électeurs</p>
                <p className="text-2xl font-bold">{assignedVoters.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Votes</p>
                <p className="text-2xl font-bold">{election.total_votes || 0}</p>
              </div>
              <Vote className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Details */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Détails de l'Élection</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <div className="flex items-center space-x-2 text-gray-900">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>
                  {new Date(election.start_date).toLocaleString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <div className="flex items-center space-x-2 text-gray-900">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>
                  {new Date(election.end_date).toLocaleString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Créée le
              </label>
              <p className="text-gray-900">
                {new Date(election.created_at).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dernière modification
              </label>
              <p className="text-gray-900">
                {new Date(election.updated_at).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Électeurs Assignés */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Électeurs Assignés</h2>
            <Badge variant="primary">{assignedVoters.length} électeur(s)</Badge>
          </div>

          {assignedVoters.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">Aucun électeur assigné</p>
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/assignment?election=${id}`)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Assigner des Électeurs
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {assignedVoters.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                     <div>
  <p className="font-medium">
    {item.voter_details?.username || item.voter?.username || 'Électeur'}
  </p>
  <p className="text-sm text-gray-600">
    {item.voter_details?.email || item.voter?.email || ''}
  </p>
</div>
                    </div>
                    <Badge variant={item.has_voted ? 'success' : 'warning'}>
                      {item.has_voted ? 'A voté' : 'Pas encore voté'}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate(`/admin/assignment?election=${id}`)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Modifier les Assignations
              </Button>
            </>
          )}
        </Card>

        {/* Actions */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Actions Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate(`/admin/elections/${id}/edit`)}
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Modifier l'Élection
            </Button>
            
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate(`/admin/candidates`)}
            >
              <Users className="w-5 h-5 mr-2" />
              Gérer les Candidats
            </Button>
            
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate(`/admin/assignment?election=${id}`)}
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Assigner des Électeurs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ViewElectionPage;