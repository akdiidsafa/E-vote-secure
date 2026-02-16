
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';



const ConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-success-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Votre vote a été enregistré avec succès
          </h1>
          <p className="text-gray-600 mt-2">
            Merci de votre participation à cette élection démocratique
          </p>
        </div>

        <Card className="mb-6">
          <div className="bg-success-50 border border-success-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-success-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Votre vote est sécurisé
            </h2>
            <ul className="space-y-3 text-sm text-success-800">
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Votre vote a été immédiatement crypté sur nos serveurs sécurisés
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Votre identité n'est pas liée à votre choix de vote
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Personne, y compris les administrateurs, ne peut voir votre vote individuel
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Vous ne pouvez plus voter pour cette élection
              </li>
            </ul>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Et maintenant ?</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Les résultats seront publiés après la fermeture officielle de l'élection
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Vous serez notifié lorsque les résultats seront disponibles
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Vous pourrez consulter les résultats depuis votre tableau de bord
            </li>
          </ul>
        </Card>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() => navigate('/voter/dashboard')}
          >
            Retourner au Tableau de Bord
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Encouragez vos proches à participer à cette élection démocratique
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;