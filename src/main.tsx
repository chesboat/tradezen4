import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShareCalendarSnapshot } from './components/ShareCalendarSnapshot';
import { PublicCalendarView } from './components/PublicCalendarView';

const mount = (el: HTMLElement, node: React.ReactNode) => {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      {node}
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
} else {
  mount(rootEl, <App />);
}