import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressGlobalToast) return;
      const message = error?.response?.data?.message || error.message || "Failed to fetch data";
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      if (mutation.meta?.suppressGlobalToast) return;
      const message = error?.response?.data?.message || error.message || "An error occurred during the operation";
      toast.error(message);
    },
  }),
});
