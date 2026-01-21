import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ListRequest } from "./types";
import { key, ordersApi } from "./index";

export const useCreateOrder = () =>
  useMutation({
    mutationKey: key,
    mutationFn: ordersApi.create,
  });

export const useListQuery = (params: ListRequest) =>
  useQuery({
    queryKey: [...key, params.page],
    queryFn: () => ordersApi.list(params),
  });

export const useDetailsQuery = (id: string) =>
  useQuery({
    queryKey: key,
    queryFn: () => ordersApi.details(id),
  });

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
