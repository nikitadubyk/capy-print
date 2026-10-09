import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniApp } from "@/context";

import { ListRequest } from "./types";
import { key, ordersApi } from "./index";
import { orderListOptions, createOrderOptions } from "./queries";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation(createOrderOptions(queryClient));
};

export const useListQuery = (params: ListRequest) => {
  const { user, error, loading } = useMiniApp();
  return useQuery(orderListOptions(params, user, !loading && !error));
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
