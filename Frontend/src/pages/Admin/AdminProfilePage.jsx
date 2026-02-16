import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Building, FileText, Save } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { profileAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    avatar: '',
    bio: '',
    organization: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.get();
      setFormData({
        username: response.data.username || '',
        email: response.data.email || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
        bio: response.data.bio || '',
        organization: response.data.organization || '',
      });
    } catch (err) {
      console.error('❌ Erreur:', err);
      showError('Erreur de chargement', 'Impossible de charger votre profil');
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
    
    try {
      setSaving(true);
      await profileAPI.update(formData);
      success('Profil mis à jour!', 'Vos informations ont été enregistrées avec succès.');
    } catch (err) {
      console.error('❌ Erreur:', err);
      const errorMsg = err.response?.data?.detail || 'Impossible de mettre à jour le profil';
      showError('Erreur de mise à jour', errorMsg);
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-xl font-semibold">Mon Profil</h1>
              <p className="text-sm text-gray-600">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <h2 className="text-lg font-semibold mb-6">Informations du profil</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  name="avatar"
                  label="URL de l'avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Nom d'utilisateur et Email */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="username"
                label="Nom d'utilisateur"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
                icon={User}
                disabled
              />
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="admin@vote.com"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />
            </div>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="first_name"
                label="Prénom"
                placeholder="Jean"
                value={formData.first_name}
                onChange={handleChange}
              />
              <Input
                name="last_name"
                label="Nom"
                placeholder="Dupont"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            {/* Téléphone et Organisation */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="phone"
                label="Téléphone"
                placeholder="+212 6XX XXX XXX"
                value={formData.phone}
                onChange={handleChange}
                icon={Phone}
              />
              <Input
                name="organization"
                label="Organisation"
                placeholder="Ministère de l'Intérieur"
                value={formData.organization}
                onChange={handleChange}
                icon={Building}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 inline mr-2" />
                Biographie
              </label>
              <textarea
                name="bio"
                rows="4"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Quelques mots sur vous..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/dashboard')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfilePage;