import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';
import '../styles/components.css';

export function HomeButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const goHome = () => {
    navigate('/');
  };

  return (
    <button
      onClick={goHome}
      className="btn-accueil-style"
      title="Retour à l'accueil"
    >
      <HomeIcon className="inline mr-2 -ml-1 h-5 w-5 mb-1" />
      Accueil
    </button>
  );
}

