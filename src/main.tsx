import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainApp } from './pages/MainApp';
import './styles.css';
import { resetLegacyBlindersCache } from './lib/cacheReset';

resetLegacyBlindersCache();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
