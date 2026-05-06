import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { bootstrapFirebase } from '@/lib/firebase';
import { bootstrapTheme } from '@/lib/theme';
import './index.css';

bootstrapTheme();
bootstrapFirebase();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
