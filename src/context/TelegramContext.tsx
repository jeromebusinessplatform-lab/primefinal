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

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  ready?: () => void;
  expand?: () => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function getInitialTelegramState() {
  const tgWebApp = getTelegramWebApp();
  const user = tgWebApp?.initDataUnsafe?.user;

  // Production rule: a customer identity is valid only when supplied by the
  // current Telegram Mini App runtime. Never restore a customer identity from
  // sessionStorage; doing so would allow a browser to impersonate another TG ID.
  if (tgWebApp && user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || `TG User ${user.id}`;
    const customer: TelegramCustomer = {
      telegramUserId: String(user.id),
      telegramDisplayName: fullName,
      telegramUsername: user.username,
      telegramFirstName: user.first_name,
      telegramLastName: user.last_name,
      telegramLanguageCode: user.language_code || "en",
    };
    return {
      customer,
      sessionToken: tgWebApp.initData || null,
      isTelegramEnv: true,
    };
  }

  return { customer: null, sessionToken: null, isTelegramEnv: false };
}

const TelegramContext = createContext<TelegramContextType>({
  isLoading: false,
  isAuthenticated: false,
  customer: null,
  sessionToken: null,
  error: null,
  isTelegramEnv: false,
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(getInitialTelegramState);
  const [customer] = useState<TelegramCustomer | null>(initial.customer);
  const [sessionToken] = useState<string | null>(initial.sessionToken);
  const [isTelegramEnv] = useState<boolean>(initial.isTelegramEnv);

  useEffect(() => {
    try {
      const tgWebApp = getTelegramWebApp();
      if (tgWebApp) {
        tgWebApp.ready?.();
        tgWebApp.expand?.();
      }
    } catch {
      // Ignore Telegram bridge errors; the app remains unauthenticated.
    }
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        isLoading: false,
        isAuthenticated: Boolean(customer && isTelegramEnv),
        customer,
        sessionToken,
        error: null,
        isTelegramEnv,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
