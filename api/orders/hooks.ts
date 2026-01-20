import { useMutation, useQuery } from "@tanstack/react-query";

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
