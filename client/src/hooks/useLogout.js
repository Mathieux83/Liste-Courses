import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import authService from '../utils/authService';
import { clearMainUser } from '../store/slices/authSlice';
import { persistor } from '../store';


export default function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return async function logout() {
    try {
      // 1. Envoyer la requête de déconnexion au serveur
      await authService.logout().catch(error => {
        console.error('Erreur lors de la déconnexion côté serveur:', error);
        toast.error('Une erreur est survenue lors de la déconnexion');
      });
      
      // 2. Purger le stockage persistant
      // await persistor.purge();
      
      // 3. Mettre à jour l'état Redux
      dispatch(clearMainUser());
      
      // 4. Forcer un reset complet du store
      // await persistor.flush();
      
      // 5. Naviguer vers la page de login
      navigate('/login', { replace: true });
      
      // 6. Forcer un rechargement pour s'assurer que dans Redux le store est reset
      window.location.reload();
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Une erreur est survenue lors de la déconnexion');
      
      // En cas d'erreur, forcer quand même la déconnexion côté client
      await persistor.purge();
      dispatch(clearMainUser());
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };
}
