// src/components/DonationSection.jsx
import React, { useEffect } from 'react';
import DonateLinks from './DonateLinks';

const DonationSection = () => {
  useEffect(() => {
    // Script Stripe
    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/buy-button.js';
    stripeScript.async = true;
    document.head.appendChild(stripeScript);
    return () => { if (document.head.contains(stripeScript)) document.head.removeChild(stripeScript); };
  }, []);

  return (
    <div className="donation-section">
      <div className="liberapay-widget" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', justifyContent: 'center'}}>
        {/* Bouton Liberapay statique */}
        <a href={DonateLinks.find(d => d.type==='liberapay').url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: 8 }}>
          <img src="https://liberapay.com/assets/widgets/donate.svg" alt="Don Liberapay" style={{ height: 40 }} />
          <i>Liberapay</i>
        </a>
        <noscript>
          <a href={DonateLinks.find(d => d.type==='liberapay').url}>
            <img src="https://liberapay.com/assets/widgets/donate.svg" alt="Don Liberapay" />
          </a>
        </noscript>
      </div>
      <div className="donation-info">
      🎯 <b>Ton soutien peut tout changer.</b><br></br>
      <b>Listo</b> est un projet personnel, sans collecte de données, que je développe avec passion pendant mon temps libre.<br></br>

      En faisant un don, tu m’aides à financer les frais techniques (hébergement, base de données, nom de domaine, etc.),
      mais surtout, tu m’encourages à continuer à coder, améliorer et faire évoluer l’application.<br></br>

      💖<br></br> Même un petit geste représente un vrai boost de motivation..<br></br>
      Mon objectif : faire de <b>Listo</b> une application publique, stable, utile et accessible à tous.<br></br>
      <b>Merci d'avance pour ton soutien</b><br></br>
      🫶      
      </div>
      <div className="stripe-cards" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: 24 }}>
        {/* Remplace les boutons Stripe par des cards Stripe Buy Button */}
        <div className="stripe-card">
          <h3 style={{ marginBottom: 12, marginTop: '-1rem' }}>Un petit coup de pouce 💪</h3>
          <stripe-buy-button
            buy-button-id="buy_btn_1RcBNfERERXZE3aJf9spfyf9"
            publishable-key="pk_live_51Rc3a4ERERXZE3aJ3y4ROA2lqgmWeoCjBQPlcTqgCkQxGG8ScqUm4kNPAKaxYe8d7Dk8YUiF5L70f8qF8UELcSlH00ddDDyOci"
          >
          </stripe-buy-button>
        </div>
        <div className="stripe-card">
          <h3 style={{ marginBottom: 12, marginTop: '-1rem' }}>Soutien régulier<br></br>❤️</h3>
          <stripe-buy-button
            buy-button-id="buy_btn_1RcBRuERERXZE3aJhR4AqSoR"
            publishable-key="pk_live_51Rc3a4ERERXZE3aJ3y4ROA2lqgmWeoCjBQPlcTqgCkQxGG8ScqUm4kNPAKaxYe8d7Dk8YUiF5L70f8qF8UELcSlH00ddDDyOci"
          >
          </stripe-buy-button>
        </div>
        <div className="stripe-card">
          <h3 style={{ marginBottom: 12, marginTop: '-1rem' }}>Café code <br></br>☕</h3>
          <stripe-buy-button
            buy-button-id="buy_btn_1RcBVOERERXZE3aJ5oqxCuJH"
            publishable-key="pk_live_51Rc3a4ERERXZE3aJ3y4ROA2lqgmWeoCjBQPlcTqgCkQxGG8ScqUm4kNPAKaxYe8d7Dk8YUiF5L70f8qF8UELcSlH00ddDDyOci"
          >
          </stripe-buy-button>
        </div>
      </div>
    </div>
  );
};

export default DonationSection;
