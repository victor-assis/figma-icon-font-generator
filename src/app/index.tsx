import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './components/App';

const rootElement = document.getElementById('app-root');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
