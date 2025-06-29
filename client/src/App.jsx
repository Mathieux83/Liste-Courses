import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAppAuthState } from './store/slices/authSlice';
import ListeCourses from './pages/ListeCourses';
import ListePartagee from './pages/ListePartage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonationsPage from './pages/DonationsPage';
import ForgotPassword from './pages/ForgotPassword';
import usePageLoader from './hooks/usePageLoader';
import NProgress from 'nprogress';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  const { loading } = useSelector(selectAppAuthState);
  usePageLoader();

  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-color)' }}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/liste-partagee/:token" element={<ListePartagee />} />
        <Route path="/donations" element={<DonationsPage />} />

        {/* Routes protégées */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/liste/:id" element={<PrivateRoute><ListeCourses /></PrivateRoute>} />

        {/* Redirection par défaut */}
        <Route path="/*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
