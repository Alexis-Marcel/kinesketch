'use client';

import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, profile, isPro, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Portal error:', err);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <h1 className="auth-title">Mon compte</h1>

        <div className="account-section">
          <div className="account-row">
            <span className="account-label">Email</span>
            <span className="account-value">{user?.email}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Plan</span>
            <span className={`account-status account-status-${isPro ? 'active' : 'free'}`}>
              {isPro
                ? profile?.plan_type === 'lifetime'
                  ? 'Pro à vie'
                  : 'Pro annuel'
                : 'Gratuit'}
            </span>
          </div>
          {profile?.plan_type === 'annual' && profile.current_period_end && (
            <div className="account-row">
              <span className="account-label">Renouvellement</span>
              <span className="account-value">
                {new Date(profile.current_period_end).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {profile?.purchased_at && profile.plan_type === 'lifetime' && (
            <div className="account-row">
              <span className="account-label">Acheté le</span>
              <span className="account-value">
                {new Date(profile.purchased_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        <div className="account-actions">
          {profile?.plan_type === 'annual' && profile.stripe_customer_id && (
            <button
              className="auth-btn auth-btn-primary"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              {loading ? 'Redirection...' : 'Gérer mon abonnement'}
            </button>
          )}

          {/* "Passer à Pro" / "Passer à la licence à vie" hidden until pricing is re-enabled */}

          <button
            className="auth-btn auth-btn-primary"
            onClick={() => router.push('/')}
          >
            Retour à l&apos;éditeur
          </button>

          <button
            className="auth-btn auth-btn-secondary"
            onClick={handleSignOut}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
