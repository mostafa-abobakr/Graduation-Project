import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

// --- Queries ---

export const useInventoryItems = (restId) => {
  return useQuery({
    queryKey: ["inventoryItems", restId],
    queryFn: async () => {
      const response = await api.get(`/Inventory/restaurant/${restId}`);
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
    },
    enabled: !!restId,
    // Removed staleTime: 0 and refetchOnWindowFocus: true
  });
};

export const useBatchDetails = (restId, itemId) => {
  return useQuery({
    queryKey: ["batchDetails", restId, itemId],
    queryFn: async () => {
      const res = await api.get(
        `/InventoryBatch/restaurant/${restId}/item/${itemId}`,
      );
      return res.data;
    },
    enabled: !!itemId && !!restId,
  });
};

export const useItemTransactions = (restId, itemId) => {
  return useQuery({
    queryKey: ["itemTransactions", restId, itemId],
    queryFn: async () => {
      const res = await api.get(
        `/InventoryTransactions/restaurant/${restId}/item/${itemId}`,
      );
      return res.data;
    },
    enabled: !!itemId && !!restId,
  });
};

// --- Mutations ---

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, batchId }) => {
      await api.delete(`/InventoryBatch/restaurant/${restId}/batch/${batchId}`);
    },
    onSuccess: (_, variables) => {
      toast.success(`Batch #${variables.batchId} deleted`);
      // Invalidate both batchDetails and inventoryItems to keep UI in sync
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete batch");
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
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update batch");
    },
  });
};
