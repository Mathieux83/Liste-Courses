// src/pages/DonationsPage.jsx
import { useEffect } from 'react';
import DonationSection from '../components/DonationSection';
import { BouttonAccueil } from '../components/BouttonAccueil';
import '../styles/donation.css'
import LogoutButton from '../components/LogoutButton';

export default function DonationsPage() {
  useEffect(() => {
    document.body.setAttribute('data-page', 'donations');
    // Affiche le widget Liberapay
    const widget = document.getElementById('liberapay-widget-container');
    if (widget) widget.style.display = 'flex';
    return () => {
      document.body.removeAttribute('data-page');
      if (widget) widget.style.display = 'none';
    };
  }, []);
  return (
    <>
      <h1 className="donation-title">Page de dons</h1>
      <div className='donation-page'>
        <div className="btn-accueil-donation">
          <BouttonAccueil/>
        </div>
        <div className="btn-logout-dons">
          <LogoutButton/>
        </div>
        <DonationSection />
      </div>
    </>
  );
}