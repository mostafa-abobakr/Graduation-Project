import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

// --- Queries ---

export const useInventoryItems = (restId) => {
  return useQuery({
    queryKey: ["inventoryItems", restId],
    queryFn: async ({ signal }) => {
      try {
        const response = await api.get(`/Inventory/restaurant/${restId}`, { signal });
        return response.data.map((item) => ({
          id: item.inventoryID,
          name: item.itemName,
          category: item.category || "Other",
          quantity: item.stock,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          cost: item.costPerUnit || 0,
          shelfLife: item.shelfLife ?? null,
          batchesCount: item.batchesCount ?? 0,
          supplier: item.supplier || "Unknown",
          apiStatus: item.status,
          imageUrl: item.imageUrl,
        }));
      } catch (err) {
        if (err.response && err.response.status === 404) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!restId,
    staleTime: 10 * 1000,
  });
};

export const useBatchDetails = (restId, itemId) => {
  return useQuery({
    queryKey: ["batchDetails", restId, itemId],
    queryFn: async ({ signal }) => {
      const res = await api.get(
        `/InventoryBatch/restaurant/${restId}/item/${itemId}`,
        { signal }
      );
      return res.data;
    },
    enabled: !!itemId && !!restId,
    staleTime: 10 * 1000,
  });
};

export const useItemTransactions = (restId, itemId) => {
  return useQuery({
    queryKey: ["itemTransactions", restId, itemId],
    queryFn: async ({ signal }) => {
      const res = await api.get(
        `/InventoryTransactions/restaurant/${restId}/item/${itemId}`,
        { signal }
      );
      return res.data;
    },
    enabled: !!itemId && !!restId,
    staleTime: 10 * 1000,
  });
};

// --- Mutations ---

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/Inventory", payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Item added");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, id, payload }) => {
      const response = await api.put(`/Inventory/restaurant/${restId}/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Item updated");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, id }) => {
      await api.delete(`/Inventory/restaurant/${restId}/${id}`);
    },
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useRestockInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, payload }) => {
      const response = await api.post(`/InventoryBatch/restaurant/${restId}/restock`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Stock restocked successfully");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useWithdrawInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, itemId, quantity }) => {
      const response = await api.post(`/InventoryBatch/restaurant/${restId}/item/${itemId}/withdraw?quantity=${quantity}`, "");
      return response.data;
    },
    onSuccess: () => {
      toast.success("Stock deducted successfully");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, batchId }) => {
      await api.delete(`/InventoryBatch/restaurant/${restId}/batch/${batchId}`);
    },
    onSuccess: (_, variables) => {
      toast.success(`Batch #${variables.batchId} deleted`);
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, batchId, payload }) => {
      await api.put(
        `/InventoryBatch/restaurant/${restId}/batch/${batchId}`,
        payload,
      );
    },
    onSuccess: (_, variables) => {
      toast.success(`Batch #${variables.batchId} updated`);
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
  });
};

// ─── Alerts & Forecast ───────────────────────────────────────────────────────

export function useInventoryAlerts(restId) {
  return useQuery({
    queryKey: ["inventoryAlerts", restId],
    queryFn: async ({ signal }) => {
      const res = await api.get(`/Inventory/restaurant/${restId}/alerts`, { signal });
      return res.data;
    },
    enabled: !!restId,
    staleTime: 10 * 1000,
  });
}

export function useInventoryForecast({ restId, alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const isDayEnabled = dailyData && dailyData[0] !== null && dailyData[0] !== undefined;
  const isWeekEnabled = weeklyTemperatures && weeklyTemperatures.length > 0;

  const dayQuery = useQuery({
    queryKey: ["inventoryForecast", "day", restId, dailyData],
    queryFn: async ({ signal }) => {
      const payload = {
        temperature: dailyData[0],
        event: dailyData[1] || 0,
      };
      console.log("[Inventory Forecast] Daily Payload:", payload);
      const res = await api.post(`/InventoryForecast/daily/restaurant/${restId}`, payload, { signal });
      return res.data;
    },
    enabled: !!restId && isDayEnabled,
  });

  const weekQuery = useQuery({
    queryKey: ["inventoryForecast", "week", restId, weeklyTemperatures, weeklyEvents],
    queryFn: async ({ signal }) => {
      const payload = {
        weeklyTemperatures,
        weeklyEvents: weeklyEvents || [0,0,0,0,0,0,0],
      };
      console.log("[Inventory Forecast] Weekly Payload:", payload);
      const res = await api.post(`/InventoryForecast/restaurant/${restId}`, payload, { signal });
      return res.data;
    },
    enabled: !!restId && isWeekEnabled,
  });

  return alignment === "day" ? dayQuery : weekQuery;
}
