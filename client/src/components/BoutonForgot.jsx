import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function BoutonForgot() {
    const navigate = useNavigate();
    const location = useLocation();

    const forgotPassword = () => {
        navigate('/forgot-password');
    }

    return (
    <button 
      onClick={forgotPassword}
      className="btn-primary"
    //   className="btn-logout-style"
    //   style={{ fontSize: '15px',  }}
      title='Demander un nouveau lien de réinitialisation'
    >
      Demander un nouveau lien de réinitialisation
    </button>
  )
}
