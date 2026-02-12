import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { electionsAPI } from '../../services/api';

const CreateElectionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  // ← AJOUTER CETTE FONCTION
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title || !formData.start_date || !formData.end_date) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      // ← AJOUTER CETTE VALIDATION
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        setError('La date de fin doit être après la date de début');
        setLoading(false);
        return;
      }

      const electionData = {
        title: formData.title,
        description: formData.description,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        status: 'draft',
      };

      console.log('📤 Envoi des données:', electionData);

      const response = await electionsAPI.create(electionData);
      
      console.log('✅ Élection créée:', response.data);
      alert('✅ Élection créée avec succès!');
      navigate('/admin/elections');
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      console.error('❌ Response:', err.response?.data);
      setError(
        err.response?.data?.detail || 
        'Erreur lors de la création de l\'élection'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/elections')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Créer une Nouvelle Élection</h1>
              <p className="text-sm text-gray-600">Remplissez les informations de l'élection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Informations de l'Élection</h2>
              
              <div className="space-y-4">
                <Input
                  name="title"
                  label="Titre de l'élection"
                  placeholder="Ex: Élection Présidentielle 2026"
                  value={formData.title}
                  onChange={handleChange}
                  icon={FileText}
                  required
                  disabled={loading}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Description de l'élection..."
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* ← DATE DÉBUT AVEC MIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date et heure de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    min={getMinDateTime()}  // ← AJOUTER CETTE LIGNE
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Doit être aujourd'hui ou dans le futur
                  </p>
                </div>

                {/* ← DATE FIN AVEC MIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date et heure de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date || getMinDateTime()}  // ← AJOUTER CETTE LIGNE
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Doit être après la date de début
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/elections')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Création en cours...' : "Créer l'Élection"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> L'élection sera créée avec le statut "Brouillon". 
            Vous pourrez l'ouvrir plus tard après avoir ajouté des candidats et des électeurs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateElectionPage;