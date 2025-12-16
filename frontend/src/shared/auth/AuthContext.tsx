import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api, initCSRF } from '../api/client';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

interface Membership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantLogo?: string;
  tenantColor?: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  membership: Membership | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User; membership: Membership | null }>(
        '/api/auth/me'
      );
      setUser(data.user);
      setMembership(data.membership);
    } catch {
      setUser(null);
      setMembership(null);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await initCSRF();
        await refreshUser();
      } catch {
        // Not logged in - OK
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshUser]);

  const login = async (phone: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/login', {
      phone,
      password,
    });
    setUser(data.user);
    // Refresh to get membership
    await refreshUser();
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setMembership(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!membership) return false;
    if (['OWNER', 'ADMIN'].includes(membership.role)) return true;
    return membership.permissions.includes(permission);
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!membership) return false;
    return roles.includes(membership.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
