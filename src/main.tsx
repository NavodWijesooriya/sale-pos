import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(
        registrations
          .filter((registration) => registration.scope === `${window.location.origin}/`)
          .map((registration) => registration.unregister())
      ))
      .catch((error) => {
        console.warn('Failed to unregister the service worker in development', error);
      });
  });
}

// Prevent mouse wheel from accidentally incrementing or decrementing number inputs across the entire application
if (typeof window !== 'undefined') {
  document.addEventListener(
    'wheel',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur();
      } else if (
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.type === 'number'
      ) {
        document.activeElement.blur();
      }
    },
    { capture: true, passive: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
