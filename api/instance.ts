import dayjs from "dayjs";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";

import { Config } from "@/config";

console.log("Config", Config.baseUrl);

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

apiInstance.interceptors.request.use((config) => {
  reportStart(config);
  return config;
});

apiInstance.interceptors.response.use((config) => {
  reportEnd(config);
  return config;
});
