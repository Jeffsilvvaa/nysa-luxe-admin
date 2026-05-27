import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "nysa_admin_session_v1";
const CREDS = { email: "admin@nysa.com", password: "admin", pin: "1234" };

interface AuthCtx {
  isAuthed: boolean;
  login: (email: string, password: string, pin: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAuthed(localStorage.getItem(KEY) === "1");
  }, []);

  const login = (email: string, password: string, pin: string) => {
    const ok = email.trim().toLowerCase() === CREDS.email && password === CREDS.password && pin === CREDS.pin;
    if (ok) {
      localStorage.setItem(KEY, "1");
      setIsAuthed(true);
    }
    return ok;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setIsAuthed(false);
  };

  return <Ctx.Provider value={{ isAuthed, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
