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

function getInitialTelegramState() {
  if (typeof window === "undefined") return { customer: null, sessionToken: null, isTelegramEnv: false };
  try {
    const tgWebApp = (window as unknown as { Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string } } } } }).Telegram?.WebApp;
    const user = tgWebApp?.initDataUnsafe?.user;
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || `TG User ${user.id}`;
      const customer: TelegramCustomer = { telegramUserId: String(user.id), telegramDisplayName: fullName, telegramUsername: user.username, telegramFirstName: user.first_name, telegramLastName: user.last_name, telegramLanguageCode: user.language_code || "en" };
      const token = tgWebApp.initData || `tg_sess_${user.id}`;
      sessionStorage.setItem("prime_session", token);
      sessionStorage.setItem("prime_customer", JSON.stringify(customer));
      return { customer, sessionToken: token, isTelegramEnv: true };
    }
    const storedCustomer = sessionStorage.getItem("prime_customer");
    const storedSession = sessionStorage.getItem("prime_session");
    if (storedCustomer) return { customer: JSON.parse(storedCustomer) as TelegramCustomer, sessionToken: storedSession, isTelegramEnv: false };
  } catch { /* invalid browser session */ }
  return { customer: null, sessionToken: null, isTelegramEnv: false };
}

const TelegramContext = createContext<TelegramContextType>({ isLoading: false, isAuthenticated: false, customer: null, sessionToken: null, error: null, isTelegramEnv: false });

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(getInitialTelegramState);
  const [customer] = useState<TelegramCustomer | null>(initial.customer);
  const [sessionToken] = useState<string | null>(initial.sessionToken);
  const [isTelegramEnv] = useState<boolean>(initial.isTelegramEnv);
  useEffect(() => {
    try {
      const tgWebApp = (window as unknown as { Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } } }).Telegram?.WebApp;
      if (tgWebApp) { tgWebApp.ready?.(); tgWebApp.expand?.(); }
    } catch { /* ignore Telegram bridge errors */ }
  }, []);
  return <TelegramContext.Provider value={{ isLoading: false, isAuthenticated: Boolean(customer), customer, sessionToken, error: null, isTelegramEnv }}>{children}</TelegramContext.Provider>;
}
export function useTelegram() { return useContext(TelegramContext); }
