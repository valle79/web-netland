import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, authStorage } from "../../lib/api";
import { API_URL } from "../../lib/constants";
import type { User } from "../../types";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());

  const login = useCallback(async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      }
    );
    if (!response.ok) {
      let detail = "Credenciales incorrectas.";
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
    const data = await response.json();
    authStorage.setSession(data.access_token, data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!authStorage.getToken()) return;
    api
      .get<User>("/users/me", true)
      .then((me) => {
        setUser(me);
        authStorage.setSession(authStorage.getToken()!, me);
      })
      .catch(() => {
        authStorage.clear();
        setUser(null);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}