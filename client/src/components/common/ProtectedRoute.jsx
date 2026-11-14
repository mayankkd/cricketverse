import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stadium-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-400 rounded-full animate-spin mb-4" />
        <p className="font-display uppercase tracking-widest text-sm text-gold-400 font-bold">
          ENTERING STADIUM...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};
