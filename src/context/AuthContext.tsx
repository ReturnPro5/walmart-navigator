import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  type AuthUser,
  type Permissions,
  getStoredTokens,
  getClaimsFromToken,
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  seedAdmin,
  clearTokens,
} from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  permissions: Permissions | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  const updateFromToken = useCallback((token: string | null) => {
    const claims = getClaimsFromToken(token);
    if (!claims) {
      setUser(null);
      setPermissions(null);
      return false;
    }
    setUser({
      id: claims.sub as string,
      email: claims.email as string,
      role: claims.role as "read_only" | "interactive",
      isAdmin: claims.isAdmin as boolean,
      forcePasswordChange: claims.forcePasswordChange as boolean,
    });
    setPermissions(claims.permissions);
    return true;
  }, []);

  const refreshAuth = useCallback(async () => {
    const { accessToken } = getStoredTokens();
    if (updateFromToken(accessToken)) return;

    // Try refresh
    const result = await refreshSession();
    if (result?.accessToken) {
      updateFromToken(result.accessToken);
    } else {
      setUser(null);
      setPermissions(null);
    }
  }, [updateFromToken]);

  useEffect(() => {
    // Seed admin on app start (idempotent)
    seedAdmin().catch(() => {});
    
    refreshAuth().finally(() => setLoading(false));

    // Auto-refresh every 13 minutes
    const interval = setInterval(refreshAuth, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAuth]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await apiLogin(email, password);
    updateFromToken(data.accessToken);
    return data.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
