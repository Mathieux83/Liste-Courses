import { useLocation } from 'react-router-dom';
import '../styles/BoutonLogout.css';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import useLogout from '../hooks/useLogout';


export default function LogoutButton() {
  const location = useLocation();
  const logout = useLogout();

  // Masquer sur /login et /register
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <button onClick={logout} className="btn-logout-style">
      <ArrowLeftEndOnRectangleIcon className="w-6 h-6 inline mr-2 mb-0.5"/>
      Se déconnecter
    </button>
  );
}