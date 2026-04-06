import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Aggressive update check: every 1 minute
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically reload when a new version is found
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Uygulama çevrimdışı çalışmaya hazır.');
  },
});

// Check for updates every 60 seconds
setInterval(() => {
  updateSW();
}, 60000);

// Apply dark mode immediately to prevent flash
const isDark = localStorage.getItem('darkMode') === 'true';
if (isDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
