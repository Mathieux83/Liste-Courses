import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../utils/authService';

export default function LogoutButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Masquer sur /login et /register
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        marginTop: '1rem',
        background: 'var(--accent-color)',
        color: 'white',
        borderRadius: 6,
        padding: '0.5rem 1.2rem',
        fontWeight: 600,
        cursor: 'pointer',
        zIndex: 1000
      }}
    >
      Se déconnecter
    </button>
  );
}