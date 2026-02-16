import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const VoterPendingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Demande en cours de validation
          </h1>
          <p className="text-gray-600">
            Votre demande d'accès a été soumise avec succès.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-gray-900">Formulaire soumis</p>
              <p className="text-sm text-gray-600">Vos informations ont été envoyées</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-left">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-gray-900">En attente de validation</p>
              <p className="text-sm text-gray-600">Un administrateur doit approuver votre demande</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-left">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-gray-900">Vous recevrez un email</p>
              <p className="text-sm text-gray-600">Vos identifiants vous seront envoyés par email</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Temps estimé:</strong> La validation peut prendre de quelques minutes à quelques heures selon la disponibilité de l'administrateur.
          </p>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          Retour à la page de connexion
        </Button>
      </Card>
    </div>
  );
};

export default VoterPendingPage;