import { useMemo } from "react";
import { useInventoryStore, computeStatus } from "@/lib/inventoryStore";

export const useInventoryData = (filter, categoryFilter, search) => {
  const {
    items,
    loading,
    settings,
  } = useInventoryStore();

  // Enrich items with status
  const enriched = useMemo(
    () => items.map((i) => ({ ...i, status: computeStatus(i, settings) })),
    [items, settings],
  );

  // Calculate counts
  const counts = useMemo(() => {
    const c = {
      all: enriched.length,
      good: 0,
      low: 0,
      expiring: 0,
      critical: 0,
      out: 0,
    };
    enriched.forEach((i) => {
      c[i.status]++;
    });
    return c;
  }, [enriched]);

  // Filter items
  const filtered = useMemo(() => {
    let list = enriched;
    if (filter !== "all") list = list.filter((i) => i.status === filter);
    if (categoryFilter !== "all")
      list = list.filter((i) => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.supplier || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [enriched, filter, categoryFilter, search]);

  return {
    items: enriched,
    filtered,
    counts,
    loading,
    settings,
  };
};
