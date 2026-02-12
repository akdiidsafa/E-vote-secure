import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CODashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedVote, setSelectedVote] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mockVotes = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Centre de Comptage (CO)</h1>
                <Badge variant="info" className="mt-1">Vérification d'Identité</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold mb-4">Votes en Attente de Vérification</h2>
              
              {mockVotes.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun vote en attente</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les votes apparaîtront ici dès qu'ils seront soumis par les électeurs
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Votes will appear here */}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Vérification d'Identité</h3>
              
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">
                  Sélectionnez un vote pour déchiffrer et vérifier l'identité
                </p>
              </div>
            </Card>

            <Card className="mt-6 bg-red-50 border-red-200">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Note Importante</h4>
                  <p className="text-sm text-red-800">
                    Vous ne pouvez voir que l'identité du votant, pas son choix de vote. 
                    Le bulletin (Message 2) reste crypté et sera déchiffré uniquement par le DE.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CODashboardPage;