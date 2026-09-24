import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Credentials, PublicUser } from "@hub/shared";
import { api, ApiError } from "../lib/api";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  login: (c: Credentials) => Promise<void>;
  register: (c: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: pregunta al server quién soy (la cookie decide, no el cliente).
  useEffect(() => {
    api
      .get<PublicUser>("/auth/me")
      .then(setUser)
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) console.error(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (c: Credentials) => setUser(await api.post<PublicUser>("/auth/login", c));
  const register = async (c: Credentials) => setUser(await api.post<PublicUser>("/auth/register", c));
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
