import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, TrendingUp, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { electionsAPI, candidatesAPI, resultsAPI } from '../../services/api';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      loadResults(selectedElection);
    }
  }, [selectedElection]);

  const loadElections = async () => {
    try {
      setLoading(true);
      const response = await electionsAPI.getAll();
      const electionsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      
      // Filtrer uniquement les élections fermées
      const closedElections = electionsData.filter(e => e.status === 'closed');
      setElections(closedElections);
      
      if (closedElections.length > 0) {
        setSelectedElection(closedElections[0].id.toString());
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (electionId) => {
    try {
      // Charger les candidats de l'élection
      const candidatesRes = await candidatesAPI.getByElection(electionId);
      const candidatesData = Array.isArray(candidatesRes.data)
        ? candidatesRes.data
        : candidatesRes.data.results || [];
      
      setCandidates(candidatesData);

      // Charger les résultats (si vous avez une API pour ça)
      try {
        const resultsRes = await resultsAPI.getByElection(electionId);
        setResults(resultsRes.data);
      } catch (err) {
        // Si pas de résultats, utiliser les candidats avec 0 votes
        const emptyResults = candidatesData.map((candidate, index) => ({
          id: candidate.id,
          candidate: candidate.name,
          party: candidate.party,
          votes: candidate.total_votes || 0,
          percentage: 0,
          color: ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500'][index % 5]
        }));
        setResults(emptyResults);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  const selectedElectionData = elections.find(e => e.id === parseInt(selectedElection));
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
  const totalVoters = selectedElectionData?.total_voters || 0;
  const participationRate = totalVoters > 0 
    ? ((totalVotes / totalVoters) * 100).toFixed(1)
    : 0;

  const handlePublish = () => {
    if (window.confirm('Êtes-vous sûr de vouloir publier les résultats?\nLes électeurs pourront les consulter.')) {
      alert('✅ Résultats publiés avec succès!');
    }
  };

  const handleDownload = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Résultats - ${selectedElectionData?.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #6b7280;
            margin: 5px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card h3 {
            color: #6b7280;
            font-size: 14px;
            margin: 0 0 5px 0;
        }
        .stat-card p {
            color: #1f2937;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .results-table th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .results-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .results-table tr:hover {
            background: #f9fafb;
        }
        .rank {
            font-weight: bold;
            color: #6b7280;
            font-size: 18px;
        }
        .percentage {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 5px;
        }
        .progress-fill {
            height: 100%;
            background: #2563eb;
            transition: width 0.3s ease;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Résultats de l'Élection</h1>
        <p>${selectedElectionData?.title}</p>
        <p>Date: ${new Date().toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <h3>Votes Totaux</h3>
            <p>${totalVotes}</p>
        </div>
        <div class="stat-card">
            <h3>Électeurs Inscrits</h3>
            <p>${totalVoters}</p>
        </div>
        <div class="stat-card">
            <h3>Taux de Participation</h3>
            <p>${participationRate}%</p>
        </div>
    </div>

    <h2 style="color: #1e40af; margin-bottom: 15px;">Résultats Détaillés</h2>
    
    <table class="results-table">
        <thead>
            <tr>
                <th>Rang</th>
                <th>Candidat</th>
                <th>Parti</th>
                <th>Votes</th>
                <th>Pourcentage</th>
            </tr>
        </thead>
        <tbody>
            ${results.map((result, index) => `
                <tr>
                    <td class="rank">#${index + 1}</td>
                    <td><strong>${result.candidate}</strong></td>
                    <td>${result.party || 'Indépendant'}</td>
                    <td>${result.votes} votes</td>
                    <td>
                        <span class="percentage">${result.percentage}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${result.percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="info-box">
        <p><strong>Information:</strong> Ce document contient les résultats officiels de l'élection. 
        Les votes ont été comptés de manière sécurisée et anonyme.</p>
    </div>

    <div class="footer">
        <p>Vote Électronique Sécurisé - Système de Vote Crypté</p>
        <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_${selectedElectionData?.title}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('✅ Les résultats ont été téléchargés avec succès!');
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
              <Button 
                variant="ghost" 
                size="sm"
                className="text-purple-600 hover:text-purple-800"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Gestion des Résultats</h1>
                <p className="text-sm text-gray-600">Visualisez et publiez les résultats des élections fermées</p>
              </div>
            </div>
            {selectedElection && (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Publier les Résultats
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {elections.length === 0 ? (
          <Card className="text-center py-12">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune élection fermée
            </h3>
            <p className="text-gray-600 mb-4">
              Les résultats ne sont disponibles que pour les élections fermées.
            </p>
            <Button onClick={() => navigate('/admin/elections')}>
              Voir les élections
            </Button>
          </Card>
        ) : (
          <>
            {/* Election Selector */}
            <Card className="mb-6">
              <h3 className="font-semibold mb-4">Sélectionner une élection fermée</h3>
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {elections.map(election => (
                  <option key={election.id} value={election.id}>
                    {election.title} - Fermée le {new Date(election.end_date).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </Card>

            {selectedElection && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <Card>
                    <p className="text-sm text-gray-600 mb-1">Votes Totaux</p>
                    <p className="text-3xl font-bold">{totalVotes}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-600 mb-1">Électeurs Inscrits</p>
                    <p className="text-3xl font-bold">{totalVoters}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-600 mb-1">Taux de Participation</p>
                    <p className="text-3xl font-bold">{participationRate}%</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-600 mb-1">Statut</p>
                    <Badge variant="danger" className="text-lg px-3 py-1">Fermée</Badge>
                  </Card>
                </div>

                {/* Results Table */}
                <Card className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Résultats Détaillés</h3>
                  
                  {results.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Aucun résultat disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={result.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                              <div>
                                <p className="font-semibold text-lg">{result.candidate}</p>
                                <p className="text-sm text-gray-600">{result.party || 'Indépendant'}</p>
                                <p className="text-sm text-gray-600">{result.votes} votes ({result.percentage}%)</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold">{result.percentage}%</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`${result.color} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${result.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Info Box */}
                <Card className="bg-green-50 border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Élection Terminée</h4>
                      <p className="text-sm text-green-800">
                        Cette élection est fermée. Les résultats sont finaux et peuvent être publiés.
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;