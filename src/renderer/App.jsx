import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import BestSellerPage from './pages/BestSellerPage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('catalog');

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        {activePage === 'catalog' && <CatalogPage />}
        {activePage === 'best-seller' && <BestSellerPage />}
      </div>
    </div>
  );
}
