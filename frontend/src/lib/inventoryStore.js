import { useInventory } from "@/contexts/InventoryContext";

export const statusMeta = {
  good: { label: "In Stock", class: "bg-green-100/10 text-green-500" },
  low: { label: "Low Stock", class: "bg-yellow-100/10 text-yellow-500" },
  critical: { label: "Critical", class: "bg-red-100/10 text-red-500" },
  expiring: { label: "Expiring", class: "bg-orange-100/10 text-orange-500" },
  out: { label: "Out of Stock", class: "bg-stone-100/10 text-muted-foreground" },
};

export const computeStatus = (item, settings) => {
  const qty = item.stock !== undefined ? item.stock : item.quantity;
  if (qty <= 0) return "out";
  if (qty <= item.reorderLevel) return "critical";
  if (qty <= item.reorderLevel * 1.5) return "low";
  
  // Basic mock calculation for expiry for alerts to consume
  if (item.shelfLifeDays && item.shelfLifeDays < 7) return "expiring";
  
  return "good";
};

// This bridge exposes our new unified Context state gracefully back to the legacy components
export const useInventoryStore = () => {
    const context = useInventory();
    
    // Map backwards compatibility
    const itemsCompat = context.inventory.map(item => ({
       ...item,
       quantity: item.stock || item.quantity || 0, // Fallback alias
       expiryDate: item.isNonPerishable ? "Non-perishable" : (item.shelfLifeDays ? new Date(Date.now() + item.shelfLifeDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "2026-12-31")
    }));

    return {
        items: itemsCompat,
        loading: context.loading,
        addItem: context.addInventoryItem,
        addItemsBulk: context.addItemsBulk,
        updateItem: context.updateInventoryItem,
        deleteItem: context.deleteInventoryItem,
        settings: { defaultReorderLevel: 10, expiryAlertDays: 7 },
        resolvedAlertKeys: context.resolvedAlertKeys,
        resolveAlert: context.resolveAlert,
        unresolveAll: context.unresolveAll,
        usageLog: [],
        updateSettings: () => {},
        predictRunouts: () => []
    };
};
