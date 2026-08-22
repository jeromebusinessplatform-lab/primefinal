import React, { createContext, useContext, useState, useEffect } from "react";

export interface TelegramCustomer {
  telegramUserId: string;
  telegramDisplayName: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
}
interface TelegramContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  customer: TelegramCustomer | null;
  sessionToken: string | null;
  error: string | null;
  isTelegramEnv: boolean;
}

const TelegramContext = createContext<TelegramContextType>({ isLoading: true, isAuthenticated: false, customer: null, sessionToken: null, error: null, isTelegramEnv: false });

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<TelegramCustomer | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tgWebApp = (window as unknown as { Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string } }; ready?: () => void; expand?: () => void } } }).Telegram?.WebApp;
    setIsTelegramEnv(Boolean(tgWebApp));
    tgWebApp?.ready?.();
    tgWebApp?.expand?.();

    async function authenticate() {
      try {
        if (!tgWebApp?.initData) {
          setError("This storefront must be opened from the PRIME Telegram Mini App.");
          return;
        }
        const response = await fetch("/api/auth/telegram", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: tgWebApp.initData }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || "Telegram authentication failed");
        if (cancelled) return;
        const user = data.user as Record<string, unknown>;
        const verifiedCustomer: TelegramCustomer = {
          telegramUserId: String(data.userId),
          telegramDisplayName: [user.first_name, user.last_name].filter(Boolean).join(" ") || `TG User ${data.userId}`,
          telegramUsername: typeof user.username === "string" ? user.username : undefined,
          telegramFirstName: typeof user.first_name === "string" ? user.first_name : undefined,
          telegramLastName: typeof user.last_name === "string" ? user.last_name : undefined,
          telegramLanguageCode: typeof user.language_code === "string" ? user.language_code : undefined,
        };
        setCustomer(verifiedCustomer);
        setSessionToken(tgWebApp.initData || null);
        setError(null);
      } catch (authError) {
        if (!cancelled) setError(authError instanceof Error ? authError.message : "Telegram authentication failed");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void authenticate();
    return () => { cancelled = true; };
  }, []);

  return <TelegramContext.Provider value={{ isLoading, isAuthenticated: Boolean(customer), customer, sessionToken, error, isTelegramEnv }}>{children}</TelegramContext.Provider>;
}

export function useTelegram() { return useContext(TelegramContext); }
