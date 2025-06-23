import React, { useState } from 'react';
import '../styles/forgot-password.css';
import { UserIcon } from '@heroicons/react/24/solid';
import NProgress from 'nprogress';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/reset-password/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Si cet email existe, un lien a été envoyé.');
      } else {
        setError(data.errors?.[0]?.msg || data.message || 'Erreur.');
      }
    } catch (err) {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

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
    <main className="forgot-password-wrapper">
      <section className="forgot-password-card">
        <h2 className="forgot-password-title">Mot de passe oublié</h2>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4 ">
            <input
              type="email"
              className="auth-input pl-10"
              placeholder="Votre email"
              value={email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              autoFocus
              disabled={loading}
            />
            <UserIcon className="w-5 h-5 absolute left-4 top-4" style={{ color: 'var(--secondary-color)' }} />
          </div>
          <button
            type="submit"
            className="forgot-password-btn"
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>
        {message && <div className="forgot-password-success">{message}</div>}
        {error && <div className="forgot-password-error">{error}</div>}
      </section>
    </main>
  );
};

export default ForgotPassword;
