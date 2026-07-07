import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";

export function useMenuPerformance(restId) {
  return useQuery({
    queryKey: ["menuPerformance", restId],
    queryFn: async ({ signal }) => {
      if (!restId) return null;
      const res = await api.get(
        `${AI_ENGINE_URL}/analytics/menu/performance/${restId}`,
        { signal, headers: { accept: "application/json" } }
      );
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!restId,
  });
}
