import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Contiene tus directivas de Tailwind
import App from './App';
import { AuthProvider } from './AuthContext'; // <--- ¡La importación correcta!

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);


