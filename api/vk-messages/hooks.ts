import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniApp } from "@/context";
import {
  saveVkMessagesPreferenceOptions,
  vkMessagesPermissionOptions,
} from "./queries";

export const useVkMessagesPermissionQuery = () => {
  const { user, platform, loading, error } = useMiniApp();
  return useQuery(
    vkMessagesPermissionOptions(
      user?.id,
      platform === "vk" && !loading && !error
    )
  );
};

export const useSaveVkMessagesPreference = () => {
  const { user } = useMiniApp();
  const queryClient = useQueryClient();
  return useMutation(saveVkMessagesPreferenceOptions(queryClient, user?.id));
};
