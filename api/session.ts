import axios from "axios";
import type { MiniAppPlatform } from "@/types/mini-app-auth";
import type { SessionResponse } from "@/types/session";

// Intentionally memory-only: works when third-party cookies and storage are blocked.
let current: SessionResponse | null = null;
let pending: Promise<SessionResponse> | null = null;
const listeners = new Set<() => void>();
const authInstance = axios.create({
  baseURL: "/api/auth/",
  withCredentials: false,
});

export function getClientSession() {
  return current;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setClientSession(session: SessionResponse | null) {
  current = session;
  listeners.forEach((listener) => listener());
}

export function getSessionHeaders(): Record<string, string> {
  return current ? { Authorization: `Bearer ${current.token}` } : {};
}

export function clearClientSession() {
  setClientSession(null);
}

async function requestSession(
  platform: MiniAppPlatform,
  rawLaunchData: string
): Promise<SessionResponse> {
  try {
    const { data } = await authInstance.post<SessionResponse>(
      "session",
      undefined,
      {
        headers: { Authorization: `${platform} ${rawLaunchData}` },
      }
    );
    if (
      !data?.token?.startsWith(`${platform}_`) ||
      !data.user ||
      data.platform !== platform
    ) {
      throw new Error("Не удалось войти. Попробуйте ещё раз.");
    }
    setClientSession(data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error?.message ??
          "Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    }
    throw error;
  }
}

export async function establishSession(
  platform: MiniAppPlatform,
  rawLaunchData: string
): Promise<SessionResponse> {
  if (current?.platform === platform) return current;
  // Share the startup request when React Strict Mode initializes twice.
  if (!pending) pending = requestSession(platform, rawLaunchData);
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
