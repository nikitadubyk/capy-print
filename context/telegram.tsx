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

import { UserRole } from "@/lib";
import { useUpsertUser } from "@/api/users/hooks";

interface TelegramContextType {
  loading: boolean;
  user: User | null;
  error: string | null;
  role: UserRole | null;
  launchParams: LaunchParams | null;
  themeParams: ThemeParamsType | null;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  role: null,
  error: null,
  loading: true,
  themeParams: null,
  launchParams: null,
});

const initialState: TelegramContextType = {
  user: null,
  role: null,
  error: null,
  loading: true,
  themeParams: null,
  launchParams: null,
};

const mock = {
  user: {
    allows_write_to_pm: true,
    first_name: "Никита",
    id: 248391610,
    last_name: "Дубык",
    language_code: "ru",
    photo_url:
      "https://t.me/i/userpic/320/sVbl7rh0zA42INesqq_1vbQYv3UnUAE4orxmxf4gbEA.svg",
    username: "gusinayamorda",
  },
  error: null,
  loading: false,
  launchParams: {
    tgWebAppData: {
      auth_date: "2026-01-19T12:56:03.000Z",
      hash: "9eae17a29e7b9fb6a7c34952e0d8019ad5e1ed261da1b23fa65132a0b2a61e3d",
      query_id: "AAG6J84OAAAAALonzg6QhFrI",
      signature:
        "uOLVD2ltDwphl61uTppNYPsLXZ5ITdAk23dvpyVcVOjbz7D8Dm_Dp6PFlXvB0FPHcIEioQCRik4A402kmYD0BQ",
      user: {
        allows_write_to_pm: true,
        first_name: "Никита",
        id: 248391610,
        last_name: "Дубык",
        language_code: "ru",
        photo_url:
          "https://t.me/i/userpic/320/sVbl7rh0zA42INesqq_1vbQYv3UnUAE4orxmxf4gbEA.svg",
        username: "gusinayamorda",
      },
    },
    tgWebAppPlatform: "tdesktop",
    tgWebAppThemeParams: {
      accent_text_color: "#6ab2f2",
      bg_color: "#17212b",
      bottom_bar_bg_color: "#17212b",
      button_color: "#5288c1",
      button_text_color: "#ffffff",
      destructive_text_color: "#ec3942",
      header_bg_color: "#17212b",
      hint_color: "#708499",
      link_color: "#6ab3f3",
      secondary_bg_color: "#232e3c",
      section_bg_color: "#17212b",
      section_header_text_color: "#6ab3f3",
      section_separator_color: "#111921",
      subtitle_text_color: "#708499",
      text_color: "#f5f5f5",
    },
    tgWebAppVersion: "9.1",
  },
  themeParams: {
    accent_text_color: "#6ab2f2",
    bg_color: "#17212b",
    bottom_bar_bg_color: "#17212b",
    button_color: "#5288c1",
    button_text_color: "#ffffff",
    destructive_text_color: "#ec3942",
    header_bg_color: "#17212b",
    hint_color: "#708499",
    link_color: "#6ab3f3",
    secondary_bg_color: "#232e3c",
    section_bg_color: "#17212b",
    section_header_text_color: "#6ab3f3",
    section_separator_color: "#111921",
    subtitle_text_color: "#708499",
    text_color: "#f5f5f5",
  },
};

export const TelegramProvider = ({ children }: PropsWithChildren) => {
  const { mutateAsync } = useUpsertUser();
  const [state, setState] = useState<TelegramContextType>(initialState);

  useEffect(() => {
    const initUserInfo = async () => {
      // if (!isTMA()) {
      //   setState({
      //     ...initialState,
      //     loading: false,
      //     user: mock.user,
      //     error: "Приложение не запущено внутри Telegram",
      //   });
      //   return;
      // }

      try {
        // initSDK();
        // backButton.mount();

        // const params = retrieveLaunchParams();
        // const user = params?.tgWebAppData?.user ?? null;
        const user = mock?.user ?? null;

        setState({
          user,
          role: null,
          error: null,
          loading: false,
          // launchParams: mock,
          // themeParams: mock?.tgWebAppThemeParams ?? null,
        });

        if (user?.id) {
          const response = await mutateAsync(user);
          setState((prev) => ({ ...prev, role: response?.role || null }));
        }
      } catch (error: any) {
        console.error("Telegram SDK error:", error);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message ?? "Неизвестная ошибка",
        }));
      }
    };

    initUserInfo();
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
