import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAppAuthState } from '../store/slices/authSlice';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(selectAppAuthState);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
