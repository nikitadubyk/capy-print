import { User } from "@tma.js/sdk-react";

import { URL } from "@/config";
import { UserDTO } from "@/types";
import { addParamsToUrl } from "@/utils";

import { apiInstance } from "../instance";

export const key = ["users"];

export const usersApi = {
  upsert: async (payload: User) => {
    const { data } = await apiInstance.post<UserDTO>(URL.UPSERT_USER, payload);
    return data;
  },

  getByTelegramId: async (telegramId: string) => {
    const { data } = await apiInstance.get(
      addParamsToUrl(URL.UPSERT_USER, { telegramId }),
    );
    return data;
  },
};
