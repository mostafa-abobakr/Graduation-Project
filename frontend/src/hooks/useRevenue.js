import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";

export function useRevenueData(restId) {
  return useQuery({
    queryKey: ["revenueData", restId],
    queryFn: async () => {
      if (!restId) return null;
      const res = await api.get(
        `${AI_ENGINE_URL}/analytics/dashboard/revenue/${restId}`
      );
      return res.data;
    },
    enabled: !!restId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
