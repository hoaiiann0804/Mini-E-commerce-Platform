import { useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { RootState } from '@/store';
import AppRoutes from '@/routes/AppRoutes';
import Notifications from '@/components/common/Notifications';
import { ChatWidgetPortal } from '@/features/ai';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import LoginSuccess from '@/components/auth/LoginSuccess';
import AuthProvider from '@/components/auth/AuthProvider';
import StripeProvider from '@/contexts/StripeContext';
import { useAntdToast } from '@/hooks/useAntdToast';
import { setNavigateFunction } from '@/utils/authUtils';


import '@/config/i18n';
import '@/styles/index.scss';

const AppContent: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { contextHolder } = useAntdToast();
  const navigate = useNavigate();

  useTokenRefresh();


  useEffect(() => {
    setNavigateFunction(() => navigate('/login'));
  }, [navigate]);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HelmetProvider>
      <AuthProvider>
        <StripeProvider>
          {contextHolder}
          <Notifications />
          <LoginSuccess />
          <AppRoutes />
          <ChatWidgetPortal />
        </StripeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
