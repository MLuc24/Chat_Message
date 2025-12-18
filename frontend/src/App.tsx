// App Component - Root application component

import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AppRoutes } from './routes';
import { useAuthStore } from './stores/authStore';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  useWebSocket();

  // Initialize auth from localStorage on app start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
