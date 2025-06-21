import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../utils/authService';
import '../styles/BoutonLogout.css';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';


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
      className="btn-logout-style"
    >
      <ArrowLeftEndOnRectangleIcon className="w-6 h-6 inline mr-2 mb-0.5"/>
      Se déconnecter
    </button>
  );
}