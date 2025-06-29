import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { BoutonForgot } from '../components/BoutonForgot';
import { BoutonAccueil } from '../components/BoutonAccueil';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
} from '@heroicons/react/24/solid';
import authService from '../utils/authService';
import NProgress from 'nprogress';
import '../styles/register.css';

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  // const [verifyingToken, setVerifyingToken] = useState(true);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Validation en temps réel du mot de passe
  const getPasswordValidation = (password) => {
    return {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,./<>?]/.test(password),
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password)
    };
  };

  const passwordValidation = getPasswordValidation(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  
  // Composant pour afficher les critères de mot de passe
  const PasswordCriterion = ({ met, text }) => (
    <div className="flex items-center space-x-2 text-sm">
      {met ? (
        <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--success-color)' }} />
      ) : (
        <XCircleIcon className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
      )}
      <span style={{ color: met ? 'var(--success-color)' : 'rgba(236, 239, 244, 0.7)' }}>
        {text}
      </span>
    </div>
  )

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrors({ general: 'Token de réinitialisation manquant' });
        setVerifyingToken(false);
        return;
      }

      try {
        const response = await axios.get(`/api/auth/verify-reset-token/${token}`);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          throw new Error('Token invalide ou expiré');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Le lien de réinitialisation est invalide ou expiré';
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
      }
    };

    verifyToken();
  }, [token]);
  
  // Gestion du chargement avec NProgress
  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => {
      NProgress.done();
    };
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer les erreurs spécifiques au champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!isPasswordValid) {
      newErrors.password = 'Le mot de passe ne respecte pas tous les critères';
    }
    
    // Validation de la confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.resetPassword(token, formData.password);
      toast.success('Mot de passe réinitialisé avec succès !');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe';
      setErrors({ ...errors, general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Affichage pendant la vérification du token
  // if (verifyingToken) {
  //   return (
  //     <div className="register-container">
  //       <div className="register-card">
  //         <div className="register-header">
  //           <div className="logo-container">
  //             <LockClosedIcon className="logo-icon" />
  //           </div>
  //           <h1>Vérification en cours</h1>
  //           <p className="subtitle">Veuillez patienter pendant que nous vérifions votre lien</p>
  //         </div>
          
  //         <div className="register-body">
  //           <div className="loading-state">
  //             <div className="loading-spinner"></div>
  //             <p>Vérification de votre lien de réinitialisation...</p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Si le token n'est pas valide
  if (!tokenValid) {
    return (
      <div className="relative">
        <div className="flex items-center justify-center min-h-screen text-center" >
          <div className="register-card felx flex-col items-center border rounded-lg ">

              <div className="-mt-5">            
                <h1 className="text-3xl font-bold mb-2">Lien invalide</h1>
                <p className="subtitle">Impossible de réinitialiser le mot de passe</p>
              </div>

            
            <div className="register-body">
              <div className="error-message mt-4">
                <XCircleIcon className="error-icon w-6 h-6 inline mb-1 mr-2" />
                <span>{errors.general || 'Ce lien de réinitialisation est invalide ou a expiré.'}</span>
              </div>
              
              <div className="flex flex-col items-center space-y-4 -mb-3" style={{ }}>
                <BoutonForgot />
                <div className="">
                  <BoutonAccueil />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage du formulaire de réinitialisation
  return (
    <div className=" min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--primary-color)'}}> 
      <div className="w-full max-w-lg -mt-10">
        <div className="register-card ">
          <div className="flex flex-col items-center">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>Réinitialisation du mot de passe</h1>
            <p className="text-xl mb-6" >Entrez votre nouveau mot de passe</p>
          </div>
          
          <div className="register-body">

            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="form-error p-3 rounded-lg text-center" style={{ 
                  backgroundColor: 'rgba(191, 97, 106, 0.1)',
                  border: '1px solid var(--accent-color)',
                  color: 'var(--accent-color)'
                }}>
                  {errors.general}
                </div>
              )}
              <div className="">
                <label htmlFor="password" className="block text-sm font-medium mb-2" 
                       style={{ color: 'var(--secondary-color)'}}>
                  Nouveau mot de passe
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`auth-input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    disabled={loading}
                    />
                    <LockClosedIcon className="w-5 h-5 absolute left-4 top-4" 
                    style={{ color: 'var(--secondary-color)' }} />
                    <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors top-4 right-4"
                    aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                    >
                    {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                        <EyeIcon className="h-5 w-5" />
                    )}
                    </button>
                  </div>
               

                {formData.password && (
                <div className="mt-3 p-3 rounded-lg space-y-2" style={{ 
                  backgroundColor: 'var(--primary-color)',
                  border: '1px solid var(--secondary-color)'
                }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>
                    Le mot de passe doit contenir :
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <PasswordCriterion met={passwordValidation.length} text="Au moins 8 caractères" />
                    <PasswordCriterion met={passwordValidation.lowercase} text="Une lettre minuscule" />
                    <PasswordCriterion met={passwordValidation.uppercase} text="Une lettre majuscule" />
                    <PasswordCriterion met={passwordValidation.number} text="Un chiffre" />
                    <PasswordCriterion met={passwordValidation.special} text="Un caractère spécial" />
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="form-error mt-1">{errors.password}</p>
              )}
            </div>
              
              {/* Champ de confirmation de mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" 
                       style={{ color: 'var(--secondary-color)' }}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete='new-password'
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`auth-input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    disabled={loading}
                    placeholder="••••••••"
                  />
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-4" 
                                  style={{ color: 'var(--secondary-color)' }} />  
                  
                  <button type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors top-4 right-4"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>


                {/* Indicateur de correspondance */}
                {formData.confirmPassword && (
                  <div className="mt-2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--success-color)' }} />
                        <span style={{ color: 'var(--success-color)' }}>
                          Les mots de passe correspondent
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm">
                        <XCircleIcon className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                        <span style={{ color: 'var(--accent-color)' }}>
                          Les mots de passe ne correspondent pas
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {errors.confirmPassword && (
                  <p className="form-error mt-1">{errors.confirmPassword}</p>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={loading || !isPasswordValid}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8">
            <Link to="/login">
              <ArrowLeftIcon className="w-6 h-6 inline mr-1 mb-0.5" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

