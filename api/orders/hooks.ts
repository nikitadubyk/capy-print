import { useMutation } from "@tanstack/react-query";

import { key, ordersApi } from "./index";

export const useCreateOrder = () =>
  useMutation({
    mutationKey: key,
    mutationFn: ordersApi.create,
  });
