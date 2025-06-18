import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ListeCourses from './components/ListeCourses'
import ListePartagee from './components/ListePartage'
import Login from './components/Login'
import Register from './components/Register'
import ListesAccueil from './components/ListesAccueil'
import authService from './utils/authService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Routes protégées par authentification
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/liste-partagee/:token" element={<ListePartagee />} />

        {/* Routes protégées */}
        <Route path="/" element={
          <PrivateRoute>
            <ListesAccueil />
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
