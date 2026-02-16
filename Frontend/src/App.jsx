import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import ElectionsPage from './pages/Admin/ElectionsPage';
import CreateElectionPage from './pages/Admin/CreateElectionPage';
import EditElectionPage from './pages/Admin/EditElectionPage';
import ViewElectionPage from './pages/Admin/ViewElectionPage';
import CandidatesPage from './pages/Admin/CandidatesPage';
import VotersPage from './pages/Admin/VotersPage';
import AssignmentPage from './pages/Admin/AssignmentPage';  
import ResultsPage from './pages/Admin/ResultsPage';
import AdminProfilePage from './pages/Admin/AdminProfilePage';
import PendingValidationsPage from './pages/Admin/PendingValidationsPage';

// Voter Pages
import VoterDashboardPage from './pages/Voter/VoterDashboardPage';
import VoterRegistrationPage from './pages/Voter/VoterRegistrationPage';
import VoterPendingPage from './pages/Voter/VoterPendingPage';
import ConfirmationPage from './pages/Voter/ConfirmationPage';
import VotePage from './pages/Voter/VotePage';   

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Voter Registration Routes (Public) */}
                      {/* Voter Routes */}
            <Route
              path="/voter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voter/vote/:id"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voter/confirmation"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <ConfirmationPage />
                </ProtectedRoute>
              }
            />

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
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending-validations"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PendingValidationsPage />
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
              path="/admin/elections/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ViewElectionPage />
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
            <Route
              path="/admin/assignment"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ResultsPage />
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
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;