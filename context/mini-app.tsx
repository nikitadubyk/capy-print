"use client";

import { Alert, Button, LoadingOverlay } from "@mantine/core";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

import {
  clearClientSession,
  establishSession,
  getClientSession,
  subscribeSession,
  updateClientSessionUser,
} from "@/store/api/session";
import { usersApi } from "@/store/api/users";
import { getMiniAppAdapter } from "@/lib/mini-app";
import type { MiniAppPlatform } from "@/types/mini-app-auth";
import type { SessionUser } from "@/types/session";

interface MiniAppContextType {
  user: SessionUser | null;
  platform: MiniAppPlatform | null;
  loading: boolean;
  error: string | null;
}

const MiniAppContext = createContext<MiniAppContextType | null>(null);
const getServerSession = () => null;
const initialState = {
  loading: true,
  error: null as string | null,
  initialized: false,
};

export const MiniAppProvider = ({ children }: PropsWithChildren) => {
  const session = useSyncExternalStore(
    subscribeSession,
    getClientSession,
    getServerSession
  );
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  const error =
    state.error ??
    (state.initialized && !session && !state.loading
      ? "Сессия отозвана. Закройте и откройте приложение заново."
      : null);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const adapter = await getMiniAppAdapter(window.location.search);
        const rawLaunchData = await adapter.initialize();
        const { token } = await establishSession(
          adapter.platform,
          rawLaunchData
        );
        if (!active) return;
        if (adapter.getProfile) {
          const profile = await adapter.getProfile();
          if (!active) return;
          const user = await usersApi.updateVkProfile(profile);
          updateClientSessionUser(user, token);
        }
        if (active)
          setState({ loading: false, error: null, initialized: true });
      } catch (error) {
        if (active)
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Не удалось войти. Попробуйте ещё раз.",
          }));
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <MiniAppContext.Provider
      value={{
        user: session?.user ?? null,
        platform: session?.platform ?? null,
        loading: state.loading,
        error,
      }}
    >
      <LoadingOverlay visible={state.loading} />
      {error && (
        <Alert role="alert" color="red" title="Не удалось войти" m="md">
          {error}
          <Button
            mt="sm"
            onClick={() => {
              clearClientSession();
              setState((previous) => ({
                ...previous,
                loading: true,
                error: null,
              }));
              setAttempt((previous) => previous + 1);
            }}
          >
            Попробовать снова
          </Button>
        </Alert>
      )}
      {state.initialized && (
        <div hidden={!!error || state.loading}>{children}</div>
      )}
    </MiniAppContext.Provider>
  );
};

export const useMiniApp = () => {
  const context = useContext(MiniAppContext);
  if (!context)
    throw new Error("useMiniApp должен использоваться внутри MiniAppProvider");
  return context;
};
