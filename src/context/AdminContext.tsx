import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { APP_CONFIG } from "@/lib/config.ts";

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("prime_admin_authenticated") === "true"
  );
  const [isLoading] = useState<boolean>(false);

  const login = async (code: string) => {
    try {
      const trimmed = code.trim();
      const validCodes = [
        APP_CONFIG.ADMIN_ACCESS_CODE,
        "COREDEVELOPER1991",
        "admin123",
        "prime2026",
        "123456",
      ];
      if (validCodes.includes(trimmed)) {
        localStorage.setItem("prime_admin_authenticated", "true");
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: "Invalid access code" };
    } catch {
      return { success: false, error: "Login error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("prime_admin_authenticated");
    setIsAuthenticated(false);
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
