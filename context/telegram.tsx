"use client";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";
import {
  type User,
  backButton,
  init as initSDK,
  type LaunchParams,
  type ThemeParamsType,
  retrieveLaunchParams,
} from "@tma.js/sdk-react";

interface TelegramContextType {
  loading: boolean;
  user: User | null;
  error: string | null;
  launchParams: LaunchParams | null;
  themeParams: ThemeParamsType | null;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  error: null,
  loading: true,
  themeParams: null,
  launchParams: null,
});

export const TelegramProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<TelegramContextType>({
    user: null,
    error: null,
    loading: true,
    themeParams: null,
    launchParams: null,
  });

  useEffect(() => {
    try {
      initSDK();
      backButton.mount();

      const params = retrieveLaunchParams();
      const webAppData = params?.tgWebAppData;
      const user = webAppData?.user ?? null;

      setState({
        user,
        error: null,
        loading: false,
        launchParams: params,
        themeParams: params?.tgWebAppThemeParams ?? null,
      });
    } catch (error: any) {
      console.error("Telegram SDK error:", error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message ?? "Неизвестная ошибка",
      }));
    }
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
