import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        const user = JSON.parse(localStorage.getItem('user'));
        
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'voter':
            navigate('/voter/dashboard');
            break;
          case 'co':
            navigate('/co/dashboard');
            break;
          case 'de':
            navigate('/de/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(result.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
           <img 
            src="/logo.png" 
            alt="Vote Électronique" 
            className="h-40 mx-auto mb-1"
          />
          <h1 className="text-2xl font-bold text-blue-900">
            Vote Électronique Sécurisé
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-6 text-blue-900">
             Connexion
             </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="username"
              label="Nom d'utilisateur ou email"
              placeholder="Saisir votre identifiant"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <Input
              type="password"
              name="password"
              label="Mot de passe"
              placeholder="••••••••••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Se souvenir de moi
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium py-2.5 rounded-lg transition duration-200"

              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se Connecter'}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;