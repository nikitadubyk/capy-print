import { URL } from "@/config";

import { addParamsToUrl } from "@/utils";
import { Order as OrderDTO } from "@/types";
import { CreateOrderRequest } from "@/app/api/orders/route";
import { Order, OrderStatus } from "@/app/generated/prisma/client";

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

  details: async (id: string) => {
    const { data } = await apiInstance.get<OrderDTO>(
      addParamsToUrl(URL.ORDER_DETAILS, { id }),
    );
    return data;
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    const { data } = await apiInstance.patch<OrderDTO>(
      addParamsToUrl(URL.ORDER_DETAILS, { id }),
      { status },
    );
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiInstance.delete(
      addParamsToUrl(URL.ORDER_DETAILS, { id }),
    );
    return data;
  },
};
