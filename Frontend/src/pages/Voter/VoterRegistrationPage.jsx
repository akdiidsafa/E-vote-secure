import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, User, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { invitationsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const VoterRegistrationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const response = await invitationsAPI.getByToken(token);
      setInvitation(response.data);
      
      // Pré-remplir l'email
      setFormData(prev => ({
        ...prev,
        email: response.data.email,
        full_name: response.data.full_name || ''
      }));
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Lien invalide', 'Ce lien d\'invitation n\'est pas valide ou a expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      showError('Champs manquants', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setSubmitting(true);
      
      await invitationsAPI.register({
        full_name: formData.full_name,
        email: formData.email,
        token: token
      });
      
      success(
        'Demande envoyée!',
        'Votre demande a été soumise. Vous recevrez vos identifiants après validation par l\'administrateur.'
      );
      
      // Rediriger vers une page de confirmation
      setTimeout(() => {
        navigate('/voter/pending');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      const errorMsg = err.response?.data?.email?.[0]
        || err.response?.data?.token?.[0]
        || err.response?.data?.detail
        || 'Une erreur est survenue';
      
      showError('Erreur de soumission', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Vérification de l'invitation...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-600 mb-4">
            Ce lien d'invitation n'est pas valide ou a expiré.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  if (invitation.status !== 'INVITED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation déjà traitée</h2>
          <p className="text-gray-600 mb-4">
            Cette invitation a déjà été traitée.
          </p>
          <Button onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirmation d'inscription
          </h1>
          <p className="text-gray-600">
            Élection: <strong>{invitation.election_title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="full_name"
            label="Nom complet"
            placeholder="Jean Dupont"
            value={formData.full_name}
            onChange={handleChange}
            icon={User}
            required
          />

          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="jean.dupont@email.com"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            required
            disabled
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ Après soumission, votre demande sera validée par un administrateur. 
              Vous recevrez vos identifiants par email.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default VoterRegistrationPage;