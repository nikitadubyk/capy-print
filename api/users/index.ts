import type { SessionUser } from "@/types/session";
import { apiInstance } from "../instance";

export const key = ["users"];
export const usersApi = {
  me: async () => {
    const { data } = await apiInstance.get<{ user: SessionUser }>("user");
    return data.user;
  },
};
