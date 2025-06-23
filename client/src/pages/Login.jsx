import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../utils/authService'
import NProgress from 'nprogress';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  LockClosedIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/solid'
import '../styles/login.css';

export default function Login({ onLogin}) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Effacer l'erreur quand l'utilisateur tape
    if (error) {
      setError('')
    }
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('L\'email est requis')
      return false
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez saisir un email valide')
      return false
    }
    
    if (!formData.password) {
      setError('Le mot de passe est requis')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await authService.login(formData.email, formData.password)
      toast.success('Connexion réussie !')
      if (onLogin) onLogin();
      navigate('/')
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Erreur de connexion. Vérifiez vos identifiants.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e)
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

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 -mt-7" 
         style={{ backgroundColor: 'var(--primary-color)' }}>
      
      {/* Container principal */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center pastille-hover" 
               style={{ backgroundColor: 'var(--secondary-color)' }}>
            <UserIcon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
          </div>
          
          <h1 className="text-3xl font-bold mb-2 border-text" style={{ color: 'var(--secondary-color)' }}>
            Connexion
          </h1>
          
          <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
            Accédez à vos listes de courses
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="auth-container">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Message d'erreur global */}
            {error && (
              <div className="form-error p-3 rounded-lg text-center" style={{ 
                backgroundColor: 'rgba(191, 97, 106, 0.1)',
                border: '1px solid var(--accent-color)',
                color: 'var(--accent-color)'
              }}>
                {error}
              </div>
            )}

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 box-shadow" 
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
                  onKeyPress={handleKeyPress}
                  placeholder="votre@email.com"
                  className={`auth-input pl-10 ${error && !formData.email ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <UserIcon className="w-5 h-5 absolute left-4 top-4" 
                         style={{ color: 'var(--secondary-color)' }} />
              </div>
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className={`auth-input pl-10 pr-10 ${error && !formData.password ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <LockClosedIcon className="w-5 h-5 absolute left-4 top-4" 
                               style={{ color: 'var(--secondary-color)' }} />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Lien mot de passe oublié */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm hover:underline transition-colors"
                style={{ color: 'var(--accent-color)' }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 inline mr-1 mb-1" /> {/* A checker pour l'icon avec la felche !! */}
                  Se connecter
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
                  Pas encore de compte ?
                </span>
              </div>
            </div>
          </div>

          {/* Lien vers l'inscription */}
          <div className="text-center">
            <Link
              to="/register"
              className="btn-secondary w-full"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: 'rgba(236, 239, 244, 0.5)' }}>
            En vous connectant, vous acceptez nos{' '}
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
