import axios from "axios";
import { clearClientSession, getSessionHeaders } from "./session";

// Business API stays same-origin; never send session tokens to an env-supplied host.
export const apiInstance = axios.create({
  baseURL: "/api/",
  withCredentials: false,
});
apiInstance.interceptors.request.use((config) => {
  Object.entries(getSessionHeaders()).forEach(([key, value]) =>
    config.headers.set(key, value)
  );
  return config;
});
apiInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401)
      clearClientSession();
    return Promise.reject(error);
  }
);
