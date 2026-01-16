"use client";

import { LoadingOverlay } from "@mantine/core";
import {
  useState,
  useEffect,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";
import {
  isTMA,
  type User,
  backButton,
  init as initSDK,
  type LaunchParams,
  type ThemeParamsType,
  retrieveLaunchParams,
} from "@tma.js/sdk-react";

import { useUpsertUser } from "@/api/users/hooks";

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

const initialState: TelegramContextType = {
  user: null,
  error: null,
  loading: true,
  themeParams: null,
  launchParams: null,
};

export const TelegramProvider = ({ children }: PropsWithChildren) => {
  const upsertUser = useUpsertUser();
  const [state, setState] = useState<TelegramContextType>(initialState);

  useEffect(() => {
    if (!isTMA()) {
      setState({
        ...initialState,
        loading: false,
        error: "Приложение не запущено внутри Telegram",
      });
      return;
    }

    try {
      initSDK();
      backButton.mount();

      const params = retrieveLaunchParams();
      const user = params?.tgWebAppData?.user ?? null;

      setState({
        user,
        error: null,
        loading: false,
        launchParams: params,
        themeParams: params?.tgWebAppThemeParams ?? null,
      });

      if (user?.id) {
        upsertUser.mutate(user);
      }
    } catch (error: any) {
      console.error("Telegram SDK error:", error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message ?? "Неизвестная ошибка",
      }));
    }
  }, []);

  if (state.loading) {
    return <LoadingOverlay visible />;
  }

  return (
    <TelegramContext.Provider value={state}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
