import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useScanner({ onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const scanInvoiceMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/inventory/invoice-scan/2?mode=auto",
        formData,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (
        res.data &&
        (res.data.mapped_items ||
          res.data.new_items ||
          res.data.status === "success")
      ) {
        return res.data;
      } else {
        throw new Error("Failed to scan invoice. Invalid response format.");
      }
    },
    onError: (err) => {
      console.error("Scan Error:", err);
      toast.error("Failed to parse invoice. Check your network or file format.");
    },
  });

  const processInvoiceMutation = useMutation({
    mutationFn: async ({ mappedItems, newItems, existingInventory }) => {
      const restId = user?.restId || 2;
      const promises = [];

      // Matched items → new batch restock
      for (const item of mappedItems) {
        const qty = parseFloat(item.quantity_to_add) || 0;
        const total = parseFloat(item.total_price) || 0;
        const unitCost = qty > 0 ? total / qty : 0;

        const existingItem = existingInventory.find(
          (i) => i.id === item.inventory_id
        );
        if (existingItem && qty > 0) {
          const payload = {
            inventoryID: item.inventory_id,
            quantity: qty,
            unitCost: unitCost || existingItem.cost || 0,
            productionDate: item.productionDate
              ? new Date(item.productionDate).toISOString()
              : new Date().toISOString(),
          };
          promises.push(
            api.post(`/InventoryBatch/restaurant/${restId}/restock`, payload)
          );
        }
      }

      for (const item of newItems) {
        const qty = parseFloat(item.quantity_to_add) || 0;
        const total = parseFloat(item.total_price) || 0;
        const unitCost = qty > 0 ? total / qty : 0;

        if (item.action === "map" && item.mappedInventoryId) {
          // Map to existing item → new batch restock
          if (qty > 0) {
            const payload = {
              inventoryID: parseInt(item.mappedInventoryId),
              quantity: qty,
              unitCost: unitCost || 0,
              productionDate: item.productionDate
                ? new Date(item.productionDate).toISOString()
                : new Date().toISOString(),
            };
            promises.push(
              api.post(`/InventoryBatch/restaurant/${restId}/restock`, payload)
            );
          }
        } else if (item.action === "create") {
          // Create new inventory item
          const createPayload = {
            restID: parseInt(restId),
            itemName: item.itemName || "Unknown Item",
            category: item.category || "General",
            stock: qty,
            reorderLevel: parseFloat(item.reorderLevel) || 0,
            reorderQuantity: 0,
            costPerUnit: unitCost,
            supplier: "Unknown",
            unit: item.unit || "Kg",
            imageUrl: "string",
            description: "string",
            shelfLife: parseFloat(item.shelfLifeDays) || null,
            productionDate: item.productionDate
              ? new Date(item.productionDate).toISOString()
              : new Date().toISOString(),
          };
          promises.push(api.post(`/Inventory`, createPayload));
        }
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Inventory updated successfully from invoice");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["batchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["itemTransactions"] });
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      console.error(err);
      toast.error("An error occurred while updating inventory.");
    },
  });

  return { scanInvoiceMutation, processInvoiceMutation };
}
