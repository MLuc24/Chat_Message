// App Component - Root application component

import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AppRoutes } from './routes';
import { useAuthStore } from './stores/authStore';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const logout = useAuthStore((state) => state.logout);
  useWebSocket();

  // Initialize auth from localStorage on app start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen for auth:logout event from http interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('[App] Received auth:logout event, logging out...');
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [logout]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
