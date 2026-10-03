import { useQuery } from "@tanstack/react-query";
import { key, usersApi } from "./index";

export const useCurrentUser = () =>
  useQuery({ queryKey: key, queryFn: usersApi.me });
