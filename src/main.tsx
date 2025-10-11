import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShareCalendarSnapshot } from './components/ShareCalendarSnapshot';
import { PublicCalendarView } from './components/PublicCalendarView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { localStorage } from './lib/localStorageUtils';
import { AuthProvider } from './contexts/AuthContext';
import { PricingPage } from './components/PricingPage';

// CRITICAL: Validate and sanitize localStorage before app initialization
// This prevents corrupted data from breaking the entire app
try {
  localStorage.validateAndSanitizeAll();
} catch (error) {
  console.error('[Startup] Failed to validate localStorage:', error);
  // Continue anyway - better to show app with defaults than crash
}

const mount = (el: HTMLElement, node: React.ReactNode) => {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <ErrorBoundary>
        {node}
      </ErrorBoundary>
    </React.StrictMode>,
  );
};

const rootEl = document.getElementById('root')!;
const path = typeof window !== 'undefined' ? window.location.pathname : '';

// Handle public calendar share (short URL with ID)
if (path.match(/^\/share\/c\/[a-z0-9]+$/i)) {
  const shareId = path.split('/').pop();
  mount(rootEl, <PublicCalendarView />);
}
// Handle legacy calendar share (URL with data)
else if (path.startsWith('/share/calendar')) {
  mount(rootEl, <ShareCalendarSnapshot />);
}
// Post-signup: hard-gate to pricing page BEFORE the app mounts
else if (typeof window !== 'undefined' && sessionStorage.getItem('show_pricing_after_auth') === 'true') {
  console.log('🔒 Bootstrap gate: rendering PricingPage at root before App');
  mount(rootEl, (
    <AuthProvider>
      <PricingPage />
    </AuthProvider>
  ));
}
// Normal app
else {
  mount(rootEl, <App />);
}