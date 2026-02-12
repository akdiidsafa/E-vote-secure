import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const CreateElectionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
     // Get existing elections
    const existingElections = JSON.parse(localStorage.getItem('elections') || '[]');
    const newElection = {
      id: Date.now(),
      ...formData,
      status: 'draft',
      candidates: 0,
      participation: '0.0%',
      createdAt: new Date().toISOString()
    };
    // Save to localStorage
    localStorage.setItem('elections', JSON.stringify([...existingElections, newElection]));

    alert('Élection créée avec succès!');
    navigate('/admin/dashboard');
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
              onClick={() => navigate('/admin/dashboard')}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Informations de l'Élection</h2>
              
              <div className="space-y-4">
                <Input
                  name="title"
                  label="Titre de l'élection"
                  placeholder="Ex: Élection Présidentielle 2024"
                  value={formData.title}
                  onChange={handleChange}
                  icon={FileText}
                  required
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
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="startDate"
                    type="date"
                    label="Date de début"
                    value={formData.startDate}
                    onChange={handleChange}
                    icon={Calendar}
                    required
                  />
                  <Input
                    name="startTime"
                    type="time"
                    label="Heure de début"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="endDate"
                    type="date"
                    label="Date de fin"
                    value={formData.endDate}
                    onChange={handleChange}
                    icon={Calendar}
                    required
                  />
                  <Input
                    name="endTime"
                    type="time"
                    label="Heure de fin"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/dashboard')}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Créer l'Élection
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateElectionPage;