import { useQuery } from "@tanstack/react-query";
import { key, usersApi } from "./index";
import { useMiniApp } from "@/context";

export const useCurrentUser = () => {
  const { user, loading, error } = useMiniApp();
  return useQuery({
    queryKey: [...key, user?.id],
    queryFn: usersApi.me,
    enabled: !!user && !loading && !error,
  });
};
