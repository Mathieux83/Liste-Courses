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
      await authService.logout();
      dispatch(clearMainUser());
      await persistor.purge();
      navigate('/login', { replace: true });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      toast.error('Une erreur est survenue lors de la déconnexion');
      // Forcer la déconnexion côté client même en cas d'erreur
      dispatch(clearMainUser());
      await persistor.purge();
      navigate('/login', { replace: true });
    }
  };
}
