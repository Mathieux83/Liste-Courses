import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAppAuthState } from '../store/slices/authSlice';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(selectAppAuthState);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
