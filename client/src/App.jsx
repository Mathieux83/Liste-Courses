import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ListeCourses from './pages/ListeCourses'
import ListePartagee from './pages/ListePartage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { BouttonAccueil } from './components/BouttonAccueil'
import DonationsPage from './pages/DonationsPage'
import axios from 'axios'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [premierChargement, setPremierChargement] = useState(true);
  const location = useLocation();

  // Pour afficher le bouton accueil uniquement sur /liste/:id
  const matchListe = /^\/liste\/[^/]+$/.test(location.pathname);

 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true });
        setIsAuthenticated(true);
        setPremierChargement(true);
      } catch (error) {
        setIsAuthenticated(false);
        setPremierChargement(false)
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Routes protégées par authentification
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-color)' }}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)} premierChargement={premierChargement} setPremierChargement={setPremierChargement} /> : <Navigate to="/" />} />
        <Route path="/liste-partagee/:token" element={<ListePartagee />} />
        <Route path="/donations" element={<DonationsPage />} />

        {/* Routes protégées */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
        <Route path="/liste/:id" element={
          <PrivateRoute>
            <ListeCourses />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}

export default App