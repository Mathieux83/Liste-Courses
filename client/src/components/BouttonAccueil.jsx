import { useNavigate, useLocation } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'
import '../styles/BoutonAccueil.css'

export function BouttonAccueil() {
  const navigate = useNavigate()
  const location = useLocation()

  // Masquer sur /login et /register
  if (['/login', '/register'].includes(location.pathname)) {
    return null
  }

  const retourAccueil = () => {
    navigate('/');
  };

  return (
      <button
        onClick={retourAccueil}
        className="btn-accueil-style"
        title="Retour à l'accueil"
      >
        <HomeIcon className=" inline mr-2 -ml-1 h-5 w-5 mb-1 " />
        Accueil
      </button>
  )
}