import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ShareCalendarSnapshot from './components/ShareCalendarSnapshot';

const mount = (el: HTMLElement, node: React.ReactNode) => {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      {node}
    </React.StrictMode>,
  );
};

const rootEl = document.getElementById('root')!;
const path = typeof window !== 'undefined' ? window.location.pathname : '';

if (path.startsWith('/share/calendar')) {
  mount(rootEl, <ShareCalendarSnapshot />);
} else {
  mount(rootEl, <App />);
}