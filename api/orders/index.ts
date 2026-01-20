import { URL } from "@/config";

import { addParamsToUrl } from "@/utils";
import { Order } from "@/app/generated/prisma/client";
import { CreateOrderRequest } from "@/app/api/orders/route";

import { apiInstance } from "../instance";

import { ListRequest, ListResponse } from "./types";

export const key = ["orders"];

export const ordersApi = {
  create: async (payload: CreateOrderRequest) => {
    const { data } = await apiInstance.post<Order>(URL.CREATE_ORDER, payload);
    return data;
  },

  list: async (params: ListRequest) => {
    const { data } = await apiInstance.get<ListResponse>(
      addParamsToUrl(URL.CREATE_ORDER, params),
    );
    return data;
  },
};
