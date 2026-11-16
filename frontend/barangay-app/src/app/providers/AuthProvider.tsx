import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants';
import { getFromStorage, setToStorage, removeFromStorage } from '@shared/utils';
import { apiGet, apiPost } from '@shared/src/api';
import { errorMessage } from '@shared/src/format';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<true | string>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getFromStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = getFromStorage<User>(STORAGE_KEYS.USER_PROFILE);

    if (token && storedUser) {
      apiGet<User>('/users/me')
        .then((profile) => {
          setUser(profile);
          setToStorage(STORAGE_KEYS.USER_PROFILE, profile);
        })
        .catch(() => {
          removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
          removeFromStorage(STORAGE_KEYS.USER_PROFILE);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<true | string> => {
    try {
      setIsLoading(true);
      const result = await apiPost<{ user: User; token: string }>(
        '/auth/login',
        { email, password },
        { dangerouslyRetryNonIdempotent: false },
      );
      const { user: userData, token } = result;
      setUser(userData);
      setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
      setToStorage(STORAGE_KEYS.USER_PROFILE, userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return errorMessage(error, 'Login failed. Check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.USER_PROFILE);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
