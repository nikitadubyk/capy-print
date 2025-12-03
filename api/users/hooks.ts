import { useMutation, useQuery } from "@tanstack/react-query";

import { key, usersApi } from "./index";

export const useUpsertUser = () =>
  useMutation({
    mutationKey: key,
    mutationFn: usersApi.upsert,
  });

export const useUserByTelegramId = (telegramId?: string) =>
  useQuery({
    queryKey: key,
    enabled: Boolean(telegramId),
    queryFn: () => usersApi.getByTelegramId(telegramId!),
  });
