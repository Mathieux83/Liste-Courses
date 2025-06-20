import { useNavigate, useLocation } from 'react-router-dom'

export function BouttonAccueil() {
  const navigate = useNavigate()
  const location = useLocation()

  // Masquer sur /login et /register
  if (['/login', '/register'].includes(location.pathname)) {
    return null
  }

  const retourAccueil = () => {
    navigate('/') // Change la route si besoin
  }

  return (
    <button
      onClick={retourAccueil}
      className="btn-accueil"
      style={{   
        marginTop: '1rem',
        background: 'var(--secondary-dark)',
        color: 'white',
        border: '1px solid var(--secondary-color)',
        borderRadius: 6,
        padding: '0.5rem 1.2rem',
        fontWeight: 600,
        cursor: 'pointer',
        zIndex: 1000,
      }}
      title="Retour à l'accueil"
    >
      🏠 Accueil
    </button>
  )
}