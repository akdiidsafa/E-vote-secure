




// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Shield, CheckCircle, XCircle, Eye, User, RefreshCw, Download } from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
// import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
// import Badge from '../../components/ui/Badge';
// import { votesAPI, electionsAPI } from '../../services/api';
// import { useNotification } from '../../contexts/NotificationContext';
// import { decryptMessage } from '../../utils/crypto';

// const CODashboardPage = () => {
//   const navigate = useNavigate();
//   const { user, logout } = useAuth();
//   const { success, error: showError } = useNotification();

//   const [pendingVotes, setPendingVotes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedVote, setSelectedVote] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [decryptedIdentity, setDecryptedIdentity] = useState(null);
//   const [decrypting, setDecrypting] = useState(false);
//   const [verifying, setVerifying] = useState(false);

//   useEffect(() => {
//     loadPendingVotes();
//   }, []);

//   const loadPendingVotes = async () => {
//     try {
//       setLoading(true);
//       console.log('📡 Chargement des votes en attente...');
//       const response = await votesAPI.getPendingCO();
//       const data = Array.isArray(response.data) ? response.data : [];
//       console.log('✅ Votes reçus:', data);
//       setPendingVotes(data);
//     } catch (err) {
//       console.error('❌ Erreur:', err);
//       showError('Erreur de chargement', 'Impossible de charger les votes en attente');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ NOUVEAU: Télécharger M1 PDF
//   const handleDownloadM1 = async (vote) => {
//     try {
//       console.log('📥 Téléchargement M1 PDF...');
//       const response = await votesAPI.downloadM1PDF(vote.id);
      
//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `identite_vote_${vote.id}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       success('PDF téléchargé', 'Identité M1 téléchargée avec succès');
//     } catch (err) {
//       console.error('❌ Erreur téléchargement M1:', err);
//       showError('Erreur', 'Impossible de télécharger M1');
//     }
//   };

//   const handleViewVote = async (vote) => {
//     setSelectedVote(vote);
//     setShowModal(true);
//     setDecrypting(true);
//     setDecryptedIdentity(null);

//     try {
//       console.log('🔓 Déchiffrement PGP de M1...');
      
//       // Récupérer la clé privée CO
//       const keysResponse = await electionsAPI.getPrivateKeys(vote.election_id);
//       const { co_private_key } = keysResponse.data;

//       if (!co_private_key) {
//         throw new Error('Clé privée CO non disponible');
//       }

//       console.log('✅ Clé privée PGP CO récupérée');

//       // Déchiffrer M1 avec PGP (ASYNC)
//       const decryptedText = await decryptMessage(vote.m1_identity, co_private_key);

//       if (!decryptedText) {
//         throw new Error('Échec du déchiffrement PGP');
//       }

//       console.log('✅ M1 déchiffré avec PGP');

//       // Parser le JSON
//       const identityData = JSON.parse(decryptedText);
      
//       console.log('📋 Identité déchiffrée:', identityData);

//       setDecryptedIdentity({
//         voter_id: identityData.voter_id,
//         voter_name: identityData.voter_name,
//         voter_email: identityData.voter_email,
//         linking_id: identityData.linking_id,
//         timestamp: identityData.timestamp,
//         encrypted: false,
//       });

//     } catch (error) {
//       console.error('❌ Erreur de déchiffrement PGP:', error);
      
//       setDecryptedIdentity({
//         voter_id: '***',
//         voter_name: 'Erreur de déchiffrement PGP',
//         voter_email: '***@***.***',
//         encrypted: true,
//         m1_preview: vote.m1_identity.substring(0, 100) + '...',
//         error: error.message
//       });
//     } finally {
//       setDecrypting(false);
//     }
//   };

//   const handleVerify = async (action) => {
//     if (!selectedVote) return;

//     try {
//       setVerifying(true);
      
//       console.log(`📤 ${action === 'approve' ? 'Approbation' : 'Rejet'} du vote...`);
      
//       await votesAPI.verifyCO({
//         vote_id: selectedVote.id,
//         action: action,
//         notes: '',
//       });

//       // ✅ NOUVEAU: Télécharger M2 PDF si approuvé
//       if (action === 'approve') {
//         console.log('📥 Téléchargement automatique du bulletin M2...');
//         const response = await votesAPI.downloadM2PDF(selectedVote.id);
        
//         const blob = new Blob([response.data], { type: 'application/pdf' });
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `bulletin_vote_${selectedVote.id}.pdf`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);
//       }

//       success(
//         action === 'approve' ? 'Vote approuvé!' : 'Vote rejeté',
//         action === 'approve' 
//           ? 'Le vote a été approuvé et le bulletin M2 a été généré'
//           : 'Le vote a été rejeté'
//       );

//       setShowModal(false);
//       setSelectedVote(null);
//       loadPendingVotes();
//     } catch (err) {
//       console.error('❌ Erreur:', err);
//       showError('Erreur de vérification', err.response?.data?.error || 'Impossible de traiter le vote');
//     } finally {
//       setVerifying(false);
//     }
//   };

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

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
//               <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
//                 <Shield className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-semibold">Centre de Comptage (CO)</h1>
//               </div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <Button variant="ghost" size="sm" onClick={loadPendingVotes}>
//                 <RefreshCw className="w-4 h-4 mr-2" />
//                 Actualiser
//               </Button>
//               <div className="flex items-center space-x-2">
//                 <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
//                   <User className="w-4 h-4 text-purple-600" />
//                 </div>
//                 <div className="text-left">
//                   <p className="text-sm font-medium text-gray-900">{user?.username}</p>
//                   <p className="text-xs text-gray-500">CO</p>
//                 </div>
//               </div>
//               <Button variant="ghost" size="sm" onClick={handleLogout}>
//                 Déconnexion
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="mb-8">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Votes en attente de vérification</h2>
//           <p className="text-gray-600">
//             Vérifiez l'identité des votants avant de transférer les votes au centre de dépouillement
//           </p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-3 gap-6 mb-6">
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">En attente</p>
//             <p className="text-3xl font-bold text-yellow-600">{pendingVotes.length}</p>
//           </Card>
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">Approuvés aujourd'hui</p>
//             <p className="text-3xl font-bold text-green-600">0</p>
//           </Card>
//           <Card>
//             <p className="text-sm text-gray-600 mb-1">Rejetés aujourd'hui</p>
//             <p className="text-3xl font-bold text-red-600">0</p>
//           </Card>
//         </div>

//         {/* Votes List */}
//         {pendingVotes.length === 0 ? (
//           <Card className="text-center py-12">
//             <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Aucun vote en attente
//             </h3>
//             <p className="text-gray-600">
//               Tous les votes ont été traités.
//             </p>
//           </Card>
//         ) : (
//           <div className="space-y-4">
//             {pendingVotes.map((vote) => (
//               <Card key={vote.id}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="font-semibold text-lg">Vote #{vote.id}</p>
//                     <p className="text-sm text-gray-600">
//                       Élection: {vote.election_title}
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       Soumis le: {new Date(vote.submitted_at).toLocaleString('fr-FR')}
//                     </p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       ID unique: {vote.unique_id}
//                     </p>
//                   </div>
//                   <div className="flex space-x-2">
//                     {/* ✅ NOUVEAU: Bouton M1 PDF */}
//                     <Button
//                       variant="secondary"
//                       size="sm"
//                       onClick={() => handleDownloadM1(vote)}
//                     >
//                       <Download className="w-4 h-4 mr-2" />
//                       M1 PDF
//                     </Button>
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       onClick={() => handleViewVote(vote)}
//                     >
//                       <Eye className="w-4 h-4 mr-2" />
//                       Vérifier
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal de vérification */}
//       {showModal && selectedVote && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Vérification d'identité - Vote #{selectedVote.id}</h2>
            
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
//               <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
//                 <Shield className="w-5 h-5 mr-2" />
//                 Message M1 (Identité)
//               </h3>
//               {decrypting ? (
//                 <div className="flex items-center space-x-2">
//                   <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
//                   <p className="text-sm text-blue-800">⏳ Déchiffrement PGP en cours...</p>
//                 </div>
//               ) : decryptedIdentity ? (
//                 decryptedIdentity.encrypted ? (
//                   <div className="space-y-2">
//                     {decryptedIdentity.error ? (
//                       <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
//                         <p className="text-sm text-red-800">
//                           ❌ <strong>Erreur:</strong> {decryptedIdentity.error}
//                         </p>
//                       </div>
//                     ) : null}
//                     <p className="text-sm text-orange-800">
//                       🔒 <strong>Message chiffré PGP</strong>
//                     </p>
//                     <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
//                       {decryptedIdentity.m1_preview}
//                     </p>
//                     <p className="text-xs text-orange-700 mt-2">
//                       ⚠️ Le déchiffrement nécessite la clé privée CO stockée de manière sécurisée
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     <div className="bg-white p-3 rounded border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">ID Votant</p>
//                       <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_id}</p>
//                     </div>
//                     <div className="bg-white p-3 rounded border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">Nom complet</p>
//                       <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_name}</p>
//                     </div>
//                     <div className="bg-white p-3 rounded border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">Email</p>
//                       <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_email}</p>
//                     </div>
//                     <div className="bg-white p-3 rounded border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">Date du vote</p>
//                       <p className="text-sm font-semibold text-gray-900">
//                         {new Date(decryptedIdentity.timestamp).toLocaleString('fr-FR')}
//                       </p>
//                     </div>
//                     <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
//                       <p className="text-xs text-green-800">
//                         ✅ Identité déchiffrée avec PGP
//                       </p>
//                     </div>
//                   </div>
//                 )
//               ) : (
//                 <p className="text-sm text-red-800">❌ Erreur de déchiffrement</p>
//               )}
//             </div>

//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
//               <p className="text-sm text-yellow-800">
//                 ⚠️ <strong>Important:</strong> Le message M2 (bulletin) reste chiffré et sera transféré au DE.
//               </p>
//             </div>

//             <div className="flex justify-end space-x-3">
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   setShowModal(false);
//                   setSelectedVote(null);
//                 }}
//                 disabled={verifying}
//               >
//                 Annuler
//               </Button>
//               <Button
//                 variant="danger"
//                 onClick={() => handleVerify('reject')}
//                 disabled={verifying || decryptedIdentity?.encrypted}
//               >
//                 <XCircle className="w-4 h-4 mr-2" />
//                 Rejeter
//               </Button>
//               <Button
//                 variant="success"
//                 onClick={() => handleVerify('approve')}
//                 disabled={verifying || decryptedIdentity?.encrypted}
//               >
//                 <CheckCircle className="w-4 h-4 mr-2" />
//                 {verifying ? 'Traitement...' : 'Approuver'}
//               </Button>
//             </div>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CODashboardPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Eye, User, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { votesAPI, electionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { decryptMessage } from '../../utils/crypto';
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

const CODashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error: showError } = useNotification();

  const [approveDialog, setApproveDialog] = useState({ isOpen: false, voteId: null, voterId: '' });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, voteId: null, voterId: '' });

  const [pendingVotes, setPendingVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decryptedIdentity, setDecryptedIdentity] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadPendingVotes();
  }, []);

  const loadPendingVotes = async () => {
    try {
      setLoading(true);
      console.log('📡 Chargement des votes en attente...');
      const response = await votesAPI.getPendingCO();
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Votes reçus:', data);
      setPendingVotes(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger les votes en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadM1 = async (vote) => {
    try {
      console.log('📥 Téléchargement M1 PDF...');
      const response = await votesAPI.downloadM1PDF(vote.id);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `identite_vote_${vote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      success('PDF téléchargé', 'Identité M1 téléchargée avec succès');
    } catch (err) {
      console.error('❌ Erreur téléchargement M1:', err);
      showError('Erreur', 'Impossible de télécharger M1');
    }
  };

  const handleViewVote = async (vote) => {
    setSelectedVote(vote);
    setShowModal(true);
    setDecrypting(true);
    setDecryptedIdentity(null);

    try {
      console.log('🔓 Déchiffrement PGP de M1...');
      
      const keysResponse = await electionsAPI.getPrivateKeys(vote.election_id);
      const { co_private_key } = keysResponse.data;

      if (!co_private_key) {
        throw new Error('Clé privée CO non disponible');
      }

      console.log('✅ Clé privée PGP CO récupérée');

      const decryptedText = await decryptMessage(vote.m1_identity, co_private_key);

      if (!decryptedText) {
        throw new Error('Échec du déchiffrement PGP');
      }

      console.log('✅ M1 déchiffré avec PGP');

      const identityData = JSON.parse(decryptedText);
      
      console.log('📋 Identité déchiffrée:', identityData);

      setDecryptedIdentity({
        voter_id: identityData.voter_id,
        voter_name: identityData.voter_name,
        voter_email: identityData.voter_email,
        linking_id: identityData.linking_id,
        timestamp: identityData.timestamp,
        encrypted: false,
      });

    } catch (error) {
      console.error('❌ Erreur de déchiffrement PGP:', error);
      
      setDecryptedIdentity({
        voter_id: '***',
        voter_name: 'Erreur de déchiffrement PGP',
        voter_email: '***@***.***',
        encrypted: true,
        m1_preview: vote.m1_identity.substring(0, 100) + '...',
        error: error.message
      });
    } finally {
      setDecrypting(false);
    }
  };

  const handleApprove = async () => {
    if (!approveDialog.voteId) return;

    try {
      setVerifying(true);
      
      console.log('📤 Approbation du vote...');
      
      await votesAPI.verifyCO({
        vote_id: approveDialog.voteId,
        action: 'approve',
        notes: '',
      });

      console.log('📥 Téléchargement automatique du bulletin M2...');
      const response = await votesAPI.downloadM2PDF(approveDialog.voteId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_vote_${approveDialog.voteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success('Vote approuvé', 'Vote approuvé et bulletin M2 généré avec succès');

      setShowModal(false);
      setSelectedVote(null);
      loadPendingVotes();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur', err.response?.data?.error || 'Impossible d\'approuver le vote');
    } finally {
      setVerifying(false);
      setApproveDialog({ isOpen: false, voteId: null, voterId: '' });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.voteId) return;

    try {
      setVerifying(true);
      
      console.log('📤 Rejet du vote...');
      
      await votesAPI.verifyCO({
        vote_id: rejectDialog.voteId,
        action: 'reject',
        notes: '',
      });

      success('Vote rejeté', 'Le vote a été rejeté');

      setShowModal(false);
      setSelectedVote(null);
      loadPendingVotes();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur', 'Impossible de rejeter le vote');
    } finally {
      setVerifying(false);
      setRejectDialog({ isOpen: false, voteId: null, voterId: '' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Centre de Comptage (CO)</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={loadPendingVotes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">CO</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Votes en attente de vérification</h2>
          <p className="text-gray-600">
            Vérifiez l'identité des votants avant de transférer les votes au centre de dépouillement
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-sm text-gray-600 mb-1">En attente</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingVotes.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Approuvés aujourd'hui</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Rejetés aujourd'hui</p>
            <p className="text-3xl font-bold text-red-600">0</p>
          </Card>
        </div>

        {/* Votes List */}
        {pendingVotes.length === 0 ? (
          <Card className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun vote en attente
            </h3>
            <p className="text-gray-600">
              Tous les votes ont été traités.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingVotes.map((vote) => (
              <Card key={vote.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Vote #{vote.id}</p>
                    <p className="text-sm text-gray-600">
                      Élection: {vote.election_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Soumis le: {new Date(vote.submitted_at).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID unique: {vote.unique_id}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadM1(vote)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      M1 PDF
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewVote(vote)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Vérifier
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de vérification */}
      {showModal && selectedVote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Vérification d'identité - Vote #{selectedVote.id}</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Message M1 (Identité)
              </h3>
              {decrypting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <p className="text-sm text-blue-800">⏳ Déchiffrement PGP en cours...</p>
                </div>
              ) : decryptedIdentity ? (
                decryptedIdentity.encrypted ? (
                  <div className="space-y-2">
                    {decryptedIdentity.error ? (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <p className="text-sm text-red-800">
                          ❌ <strong>Erreur:</strong> {decryptedIdentity.error}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-sm text-orange-800">
                      🔒 <strong>Message chiffré PGP</strong>
                    </p>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
                      {decryptedIdentity.m1_preview}
                    </p>
                    <p className="text-xs text-orange-700 mt-2">
                      ⚠️ Le déchiffrement nécessite la clé privée CO stockée de manière sécurisée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">ID Votant</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_id}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{decryptedIdentity.voter_email}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Date du vote</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(decryptedIdentity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                      <p className="text-xs text-green-800">
                        ✅ Identité déchiffrée avec PGP
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm text-red-800">❌ Erreur de déchiffrement</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Le message M2 (bulletin) reste chiffré et sera transféré au DE.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedVote(null);
                }}
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowModal(false);
                  setRejectDialog({ 
                    isOpen: true, 
                    voteId: selectedVote.id, 
                    voterId: decryptedIdentity?.voter_name || 'Votant' 
                  });
                }}
                disabled={verifying || decryptedIdentity?.encrypted}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setShowModal(false);
                  setApproveDialog({ 
                    isOpen: true, 
                    voteId: selectedVote.id, 
                    voterId: decryptedIdentity?.voter_name || 'Votant' 
                  });
                }}
                disabled={verifying || decryptedIdentity?.encrypted}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ✅ AlertDialog: Approuver */}
      <AlertDialog 
        open={approveDialog.isOpen} 
        onOpenChange={(open) => setApproveDialog({ isOpen: open, voteId: null, voterId: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-green-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <CheckCircle className="text-green-600 size-6" />
            </div>
            <AlertDialogTitle>Approuver ce vote ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirmez-vous l'approbation du vote de <strong>{approveDialog.voterId}</strong> ?
              <br /><br />
              Le bulletin M2 sera généré et transféré au DE pour dépouillement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
            >
              Approuver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ AlertDialog: Rejeter */}
      <AlertDialog 
        open={rejectDialog.isOpen} 
        onOpenChange={(open) => setRejectDialog({ isOpen: open, voteId: null, voterId: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="bg-red-100 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <XCircle className="text-red-600 size-6" />
            </div>
            <AlertDialogTitle>Rejeter ce vote ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirmez-vous le rejet du vote de <strong>{rejectDialog.voterId}</strong> ?
              <br /><br />
              Cette action est irréversible et le votant devra soumettre un nouveau vote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CODashboardPage;