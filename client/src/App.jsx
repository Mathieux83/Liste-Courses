import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAppAuthState } from './store/slices/authSlice'
import ListeCourses from './pages/ListeCourses'
import ListePartagee from './pages/ListePartage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { BouttonAccueil } from './components/BouttonAccueil'
import DonationsPage from './pages/DonationsPage'
import ForgotPassword from './pages/ForgotPassword';
import usePageLoader from './hooks/usePageLoader';
import NProgress from 'nprogress';
import ResetPassword from './pages/ResetPassword'

function App() {
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector(selectAppAuthState);

  // Pour afficher le bouton accueil uniquement sur /liste/:id
  const matchListe = /^\/liste\/[^/]+$/.test(location.pathname);

  usePageLoader();

  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading]);

  if (loading) {
    return null; // On retire le spinner manuel, seul NProgress s'affiche
  }

  // Routes protégées par authentification
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-color)' }}>
      <Routes>
        {/* Routes publiques */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route path="/liste-partagee/:token" element={<ListePartagee />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Routes protégées */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/listes" 
        />
        <Route 
          path="/liste/:id" 
          element={
            <PrivateRoute>
              <ListeCourses />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App