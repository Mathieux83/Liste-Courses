// src/pages/DonationsPage.jsx
import React, { useEffect, useState } from 'react';
import DonationSection from '../components/DonationSection';
import { HomeButton } from '../components/HomeButton';
import '../styles/donation.css'
import LogoutButton from '../components/LogoutButton';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function DonationsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    NProgress.start();
    document.body.setAttribute('data-page', 'donations');
    // Affiche le widget Liberapay
    const widget = document.getElementById('liberapay-widget-container');
    if (widget) widget.style.display = 'flex';
    setTimeout(() => {
      setLoading(false);
      NProgress.done();
    }, 500); // Simule un chargement court
    return () => {
      document.body.removeAttribute('data-page');
      if (widget) widget.style.display = 'none';
      NProgress.done();
    };
  }, []);
  if (loading) {
    return null;
  }
  return (
    <>
      <h1 className="donation-title">Page de dons</h1>
      <div className='donation-page'>
        <div style={{ display:'flex', justifyContent: 'space-between', gap: '57rem'}} >
        <div className="btn-accueil-donation">
          <HomeButton/>
        </div>
        <div className="btn-logout-dons">
          <LogoutButton/>
        </div>
      </div>  
        <DonationSection />
      </div>
    </>
  );
}