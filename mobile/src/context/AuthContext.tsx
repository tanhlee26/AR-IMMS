import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loginTechnician, setAuthToken } from '../services/api';

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username?: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = useCallback(async (username = 'technician', password = 'techpassword2026') => {
    try {
      setIsLoading(true);
      const res = await loginTechnician(username, password);
      if (res && res.access_token) {
        setTokenState(res.access_token);
        setUser(res.user);
      }
    } catch (error) {
      console.warn('Auto login failed, using offline technician session:', error);
      // Fallback offline session
      const fallbackUser: UserProfile = {
        id: 3,
        username: 'technician',
        full_name: 'Le Van Technician (Offline)',
        email: 'tech@ar-imms.vn',
        role: 'FIELD_TECHNICIAN',
        permissions: ['ar:scan', 'ticket:view_assigned', 'ticket:update', 'ticket:request_closure'],
      };
      setUser(fallbackUser);
      setTokenState('demo-offline-jwt-token');
      setAuthToken('demo-offline-jwt-token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setAuthToken(null);
  }, []);

  useEffect(() => {
    // Tự động đăng nhập Kỹ thuật viên khi mở app
    login();
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
