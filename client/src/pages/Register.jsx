import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../utils/authService'
import NProgress from 'nprogress';
import { 
  UserPlusIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/solid'
import '../styles/register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  // Validation en temps réel du mot de passe
  const getPasswordValidation = (password) => {
    return {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,./<>?]/.test(password),
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password)
    }
  }

  const passwordValidation = getPasswordValidation(formData.password)
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Effacer les erreurs spécifiques au champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez saisir un email valide'
    }
    
    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (!isPasswordValid) {
      newErrors.password = 'Le mot de passe ne respecte pas tous les critères'
    }
    
    // Validation de la confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      await authService.register(
        formData.name.trim(),
        formData.email.toLowerCase().trim(),
        formData.password
      )
      
      toast.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      navigate('/login')
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la création du compte'
      
      // Gestion des erreurs spécifiques
      if (errorMessage.includes('email')) {
        setErrors({ email: 'Cet email est déjà utilisé' })
      } else {
        setErrors({ general: errorMessage })
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => {
      NProgress.done();
    };
  }, [loading]);

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

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--primary-color)' }}>
      
      {/* Container principal */}
      <div className="w-full max-w-lg -mt-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center pastille-hover" 
               style={{ backgroundColor: 'var(--secondary-color)' }}>
            <UserPlusIcon className="w-8 h-8 ml-1" style={{ color: 'var(--primary-color)' }} />
          </div>
          
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary-color)' }}>
            Créer un compte
          </h1>
          
          <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
            Rejoignez-nous pour gérer vos listes de courses
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <div className="auth-container">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Message d'erreur global */}
            {errors.general && (
              <div className="form-error p-3 rounded-lg text-center" style={{ 
                backgroundColor: 'rgba(191, 97, 106, 0.1)',
                border: '1px solid var(--accent-color)',
                color: 'var(--accent-color)'
              }}>
                {errors.general}
              </div>
            )}

            {/* Champ Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" 
                     style={{ color: 'var(--secondary-color)' }}>
                Nom complet
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  className={`auth-input pl-10 ${errors.name ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <UserIcon className="w-5 h-5 absolute left-4 top-4" 
                         style={{ color: 'var(--secondary-color)' }} />
              </div>
              {errors.name && (
                <p className="form-error mt-1">{errors.name}</p>
              )}
            </div>

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" 
                     style={{ color: 'var(--secondary-color)' }}>
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className={`auth-input pl-10 ${errors.email ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <EnvelopeIcon className="w-5 h-5 absolute left-4 top-4" 
                             style={{ color: 'var(--secondary-color)' }} />
              </div>
              {errors.email && (
                <p className="form-error mt-1">{errors.email}</p>
              )}
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" 
                     style={{ color: 'var(--secondary-color)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Critères de mot de passe */}
              {formData.password && (
                <div className="mt-3 p-3 rounded-lg space-y-2" style={{ 
                  backgroundColor: 'var(--primary-color)',
                  border: '1px solid var(--secondary-color)'
                }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>
                    Critères du mot de passe :
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

            {/* Champ Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" 
                     style={{ color: 'var(--secondary-color)' }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`auth-input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <LockClosedIcon className="w-5 h-5 absolute left-4 top-4" 
                               style={{ color: 'var(--secondary-color)' }} />
                
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors top-4 right-4"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
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

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                  Création du compte...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5 inline mr-1 mb-1" />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--secondary-color)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ 
                  backgroundColor: 'var(--primary-light)',
                  color: 'rgba(236, 239, 244, 0.7)' 
                }}>
                  Déjà un compte ?
                </span>
              </div>
            </div>
          </div>

          {/* Lien vers la connexion */}
          <div className="text-center">
            <Link
              to="/login"
              className="btn-secondary w-full"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: 'rgba(236, 239, 244, 0.5)' }}>
            En créant un compte, vous acceptez nos{' '}
            <Link to="/terms" className="hover:underline" style={{ color: 'var(--accent-color)' }}>
              Conditions d'utilisation
            </Link>
            {' '}et notre{' '}
            <Link to="/privacy" className="hover:underline" style={{ color: 'var(--accent-color)' }}>
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
