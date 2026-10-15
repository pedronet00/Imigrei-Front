import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  AuthService,
  type AuthUser,
  type RegisterUserData,
} from '../../application/services/AuthService';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (current: string, next: string, confirmation: string) => Promise<void>;
  registerUser: (data: RegisterUserData) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const authService = new AuthService();

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored && authService.isAuthenticated()) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const changePassword = useCallback(
    (current: string, next: string, confirmation: string) =>
      authService.changePassword(current, next, confirmation),
    []
  );

  const registerUser = useCallback(
    (data: RegisterUserData) => authService.registerUser(data),
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.roles?.includes('Administrador') ?? false,
        login,
        logout,
        changePassword,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
