import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { key, ordersApi } from "./index";
import type { ListRequest } from "./types";
import type { SessionUser } from "@/types/session";

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
  onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
});
