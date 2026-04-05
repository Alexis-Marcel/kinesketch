'use client';

import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user, isPro, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: 'annual' | 'lifetime') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(null);
    }
  };

  if (isPro && profile?.plan_type === 'lifetime') {
    return (
      <div className="pricing-page">
        <div className="pricing-container">
          <h1 className="pricing-title">KineSketch Pro</h1>
          <p className="pricing-subtitle">Vous avez la licence à vie. Merci !</p>
          <button className="pricing-back" onClick={() => router.push('/')}>
            Retour à l&apos;éditeur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <div className="pricing-container">
        <h1 className="pricing-title">Passer à KineSketch Pro</h1>
        <p className="pricing-subtitle">
          Débloquez la 3D, les exports SVG/LaTeX, la sauvegarde cloud et plus
        </p>

        {isPro && profile?.plan_type === 'annual' && (
          <div className="pricing-trial-notice">
            Vous êtes Pro (annuel) — passez à la licence à vie pour ne plus jamais repayer
          </div>
        )}

        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h2>Pro Annuel</h2>
              <div className="pricing-price">
                <span className="pricing-amount">19€</span>
                <span className="pricing-period">/an</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>Mode 3D</li>
              <li>Export SVG, LaTeX</li>
              <li>Export photo 3D</li>
              <li>Sauvegarde cloud</li>
              <li>Projets illimités</li>
              <li>Calcul de mobilité complet</li>
              <li>Graphe des liaisons</li>
            </ul>
            <button
              className="auth-btn auth-btn-primary"
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null || (isPro && profile?.plan_type === 'annual')}
            >
              {isPro && profile?.plan_type === 'annual'
                ? 'Abonnement actif'
                : loading === 'annual'
                  ? 'Redirection...'
                  : 'Choisir annuel'}
            </button>
          </div>

          <div className="pricing-card pricing-card-popular">
            <div className="pricing-badge">Meilleur choix</div>
            <div className="pricing-card-header">
              <h2>Pro à vie</h2>
              <div className="pricing-price">
                <span className="pricing-amount">39€</span>
                <span className="pricing-period">une seule fois</span>
              </div>
              <div className="pricing-savings">Rentabilisé en 2 ans</div>
            </div>
            <ul className="pricing-features">
              <li>Mode 3D</li>
              <li>Export SVG, LaTeX</li>
              <li>Export photo 3D</li>
              <li>Sauvegarde cloud</li>
              <li>Projets illimités</li>
              <li>Calcul de mobilité complet</li>
              <li>Graphe des liaisons</li>
              <li>Mises à jour à vie</li>
            </ul>
            <button
              className="auth-btn auth-btn-primary"
              onClick={() => handleCheckout('lifetime')}
              disabled={loading !== null}
            >
              {loading === 'lifetime' ? 'Redirection...' : 'Acheter à vie'}
            </button>
          </div>
        </div>

        <div className="pricing-free-note">
          <strong>Version gratuite</strong> — Éditeur 2D complet, export PNG, 1 projet en local.
          Pas besoin de carte bancaire.
        </div>

        <button className="pricing-back" onClick={() => router.push('/')}>
          Retour à l&apos;éditeur
        </button>
      </div>
    </div>
  );
}
