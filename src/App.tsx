import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './presentation/contexts/AuthContext';
import { ThemeProvider } from './presentation/contexts/ThemeContext';
import { ImmigrantProvider } from './presentation/contexts/ImmigrantContext';
import { ToastProvider } from './presentation/components/ui/Toast';
import { AppRoutes } from './presentation/routes/AppRoutes';

import './presentation/styles/global.css';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ImmigrantProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </ImmigrantProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
