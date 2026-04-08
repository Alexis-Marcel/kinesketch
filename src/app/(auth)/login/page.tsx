'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  // Google OAuth — handler kept for when the provider is enabled in Supabase.
  // Re-enable by uncommenting the button in the JSX below.
  // const handleGoogleLogin = async () => {
  //   if (!supabase) return;
  //   setError(null);
  //   await supabase.auth.signInWithOAuth({
  //     provider: 'google',
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`,
  //     },
  //   });
  // };

  if (!supabase) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title">KineSketch</h1>
          <p className="auth-subtitle">Chargement...</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">KineSketch</h1>
          <p className="auth-subtitle">Vérifiez votre email</p>
          <p className="auth-message">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.
            Cliquez dessus pour accéder à KineSketch.
          </p>
          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={() => setSent(false)}
          >
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">KineSketch</h1>
        <p className="auth-subtitle">Schémas cinématiques ISO 3952</p>

        {error && <div className="auth-error">{error}</div>}

        {/* Google login hidden until the OAuth provider is enabled in Supabase.
            The handler is kept above so re-enabling is just removing this comment. */}

        <form onSubmit={handleMagicLink} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer un lien de connexion'}
          </button>
        </form>

      </div>
    </div>
  );
}
