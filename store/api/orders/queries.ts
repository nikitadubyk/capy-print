import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { key, ordersApi } from "./index";
import type { ListRequest } from "./types";
import type { CurrentUser, SessionUser } from "@/types/session";
import { key as usersKey } from "../users";

export const orderListOptions = (
  params: ListRequest,
  user: SessionUser | null,
  ready: boolean
) =>
  queryOptions({
    queryKey: [...key, user?.id, "list", params],
    enabled:
      !!user && ready && (params.scope !== "all" || user.role === "ADMIN"),
    queryFn: () => ordersApi.list(params),
  });
export const createOrderOptions = (queryClient: QueryClient) => ({
  mutationKey: key,
  mutationFn: ordersApi.create,
  onSuccess: async (order: Awaited<ReturnType<typeof ordersApi.create>>) => {
    await queryClient.cancelQueries({ queryKey: [...usersKey, order.userId] });
    queryClient.setQueryData<CurrentUser>(
      [...usersKey, order.userId],
      (user) => (user ? { ...user, isFirstOrder: false } : undefined)
    );
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: [...usersKey, order.userId] }),
    ]);
  },
});
