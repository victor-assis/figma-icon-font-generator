import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App.tsx';

// Find the root element
const root = document.getElementById('root') as HTMLElement;

// Create a root for React and render the application
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
