import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ListeCourses from './components/ListeCourses'
import ListePartagee from './components/ListePartage'
import Login from './components/Login'
import Register from './components/Register'
import ListesAccueil from './components/ListesAccueil'
import LogoutButton from './components/LogoutButton'
import { BouttonAccueil } from './components/BouttonAccueil'
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
      {/* Header visible sur toutes les pages privées */}
      {isAuthenticated && (
        <div className="w-full flex items-center justify-between px-6" style={{ minHeight: 0, marginBottom: 0 }}>
          {/* Colonne gauche vide */}
          <div style={{ flex: 1 }} />
          {/* Colonne centrale : bouton accueil centré uniquement sur /liste/:id */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {matchListe && <BouttonAccueil />}
          </div>
          {/* Colonne droite : bouton logout */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <LogoutButton onLogout={() => setIsAuthenticated(false)}/>
          </div>
        </div>
      )}
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/accueil" element={isAuthenticated ? <ListesAccueil isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)} premierChargement={premierChargement} setPremierChargement={setPremierChargement} /> : <Navigate to="/" />} />
        <Route path="/liste-partagee/:token" element={<ListePartagee />} />

        {/* Routes protégées */}
        <Route path="/" element={
          <PrivateRoute>
            <ListesAccueil isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)} premierChargement={premierChargement} setPremierChargement={setPremierChargement} />
          </PrivateRoute>
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