import dayjs from "dayjs";
import { retrieveLaunchParams } from "@tma.js/sdk-react";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";

import { Config } from "@/config";

export const apiInstance = axios.create({
  baseURL: Config.baseUrl,
});

const getConfigString = (config?: AxiosRequestConfig) =>
  `${dayjs().format("HH:mm:ss.SSS")} | ${config?.method?.toUpperCase()}: ${
    config?.url
  }`;

const reportStart = (config: AxiosRequestConfig) =>
  console.log("started", getConfigString(config));

const reportEnd = (response: AxiosResponse) =>
  console.log("finished", getConfigString(response.config));

const getTelegramId = (): number | null => {
  try {
    // const { tgWebAppData } = retrieveLaunchParams();
    // return tgWebAppData?.user?.id || null;
    return 248391610;
  } catch (error) {
    console.error("Ошибка при получении Telegram ID:", error);
    return null;
  }
};

apiInstance.interceptors.request.use((config) => {
  reportStart(config);

  const telegramId = getTelegramId();
  if (telegramId) {
    config.headers["x-telegram-id"] = telegramId;
  }

  return config;
});

apiInstance.interceptors.response.use((config) => {
  reportEnd(config);
  return config;
});
