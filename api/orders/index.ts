import { URL } from "@/config";

import { CreateOrderRequest } from "@/app/api/orders/route";

import { apiInstance } from "../instance";

export const key = ["orders"];

export const ordersApi = {
  create: async (payload: CreateOrderRequest) => {
    const { data } = await apiInstance.post(URL.CREATE_ORDER, payload);
    return data;
  },
};
