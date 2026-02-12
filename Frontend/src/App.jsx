import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import ElectionsPage from './pages/Admin/ElectionsPage';
import CreateElectionPage from './pages/Admin/CreateElectionPage';
import EditElectionPage from './pages/Admin/EditElectionPage';
import CandidatesPage from './pages/Admin/CandidatesPage';
import VotersPage from './pages/Admin/VotersPage';

// Voter Pages
import VoterDashboardPage from './pages/Voter/VoterDashboardPage';  // ← CORRIGÉ!

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/elections"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ElectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/elections/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateElectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/elections/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditElectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CandidatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/voters"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VotersPage />
              </ProtectedRoute>
            }
          />

          {/* Voter Routes */}
          <Route
            path="/voter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;