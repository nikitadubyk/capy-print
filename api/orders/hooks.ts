import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniApp } from "@/context";

import { ListRequest } from "./types";
import { key, ordersApi } from "./index";

export const useCreateOrder = () =>
  useMutation({
    mutationKey: key,
    mutationFn: ordersApi.create,
  });

export const useListQuery = (params: ListRequest) => {
  const { user, error } = useMiniApp();
  return useQuery({
    queryKey: [...key, user?.id, "list", params],
    enabled:
      !!user && !error && (params.scope !== "all" || user.role === "ADMIN"),
    queryFn: () => ordersApi.list(params),
  });
};

export const useDetailsQuery = (id: string) => {
  const { user, error } = useMiniApp();
  return useQuery({
    queryKey: [...key, user?.id, "details", id],
    enabled: !!user && !error,
    queryFn: () => ordersApi.details(id),
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
