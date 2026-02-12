import React, { useState } from 'react';
import { Calculator, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DEDashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const elections = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Centre de Dépouillement (DE)</h1>
                <Badge variant="success" className="mt-1">Comptage des Votes</Badge>
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
          <div>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Élections Fermées</h2>
              
              {elections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">Aucune élection prête pour le comptage</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Les élections fermées apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Elections will appear here */}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold mb-4">Dépouillement et Comptage</h2>
              
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Sélectionnez une élection pour commencer le dépouillement
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Vous pourrez déchiffrer et compter les bulletins anonymes
                </p>
              </div>

              <Card className="mt-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Note de Sécurité</h4>
                    <p className="text-sm text-yellow-800">
                      Vous ne pouvez voir que les choix de vote (bulletins cryptés). 
                      Les identités des votants restent anonymes et ne peuvent être liées aux votes.
                    </p>
                  </div>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DEDashboardPage;