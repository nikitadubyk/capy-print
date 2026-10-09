import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  getVkMessagesPermission,
  key,
  saveVkMessagesPreference,
} from "./index";

export const vkMessagesPermissionOptions = (
  userId: number | undefined,
  ready: boolean
) =>
  queryOptions({
    queryKey: [...key, userId],
    queryFn: ({ signal }) => getVkMessagesPermission(signal),
    enabled: !!userId && ready,
    retry: false,
    // Only a saved decision is permanent; startup/config errors must be recoverable.
    staleTime: (query) => (query.state.data?.enabled != null ? Infinity : 0),
  });

export const saveVkMessagesPreferenceOptions = (
  queryClient: QueryClient,
  userId: number | undefined
) => ({
  mutationKey: [...key, userId],
  mutationFn: saveVkMessagesPreference,
  onSuccess: async (
    permission: Awaited<ReturnType<typeof saveVkMessagesPreference>>
  ) => {
    // A permission GET started before POST must not overwrite the saved choice.
    await queryClient.cancelQueries({
      queryKey: [...key, userId],
      exact: true,
    });
    queryClient.setQueryData([...key, userId], permission);
  },
});
