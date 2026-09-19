import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Choose from './pages/Choose';
import CreateTeam from './pages/CreateTeam';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

const guarded = (element) => <PrivateRoute>{element}</PrivateRoute>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Toaster position="top-right" />
          {/* A thrown render error should show a message, not a blank page. */}
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* After the profile is complete, everyone picks a direction. */}
            <Route path="/choose" element={guarded(<Choose />)} />

            <Route path="/profile" element={guarded(<Profile />)} />
            <Route path="/dashboard" element={guarded(<Dashboard />)} />

            {/* Path A - lead a team */}
            <Route path="/teams/new" element={guarded(<CreateTeam />)} />

            {/* Path B - find a team */}
            <Route path="/teams" element={guarded(<Teams />)} />

            <Route path="/teams/:id" element={guarded(<TeamDetail />)} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
