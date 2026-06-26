import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import BestSellerPage from './pages/BestSellerPage.jsx';
import SettingsModal from './components/SettingsModal.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('catalog');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onSettings={() => setShowSettings(true)} />
      <div className="main-area">
        {activePage === 'catalog' && <CatalogPage />}
        {activePage === 'best-seller' && <BestSellerPage />}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
