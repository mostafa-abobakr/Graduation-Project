import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useInventoryStore,
  computeStatus,
  statusMeta,
} from "@/lib/inventoryStore";
import { Package, FileDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { InventoryFilters } from "./InventoryFilters";
import { InventoryTable } from "./InventoryTable";
import { ItemFormDialog } from "./ItemFormDialog";
import { ScannerDialog } from "./ScannerDialog";
import { RestockDialog } from "./RestockDialog";
import { CATEGORIES } from "./InventoryUtils";

export default function InventoryPage() {
  const { user } = useAuth();
  const { settings, addItemsBulk } = useInventoryStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["inventoryItems", user?.restId],
    queryFn: async () => {
      const response = await axios.get(
        `https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}`,
      );
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
      }));
    },
    enabled: !!user?.restId,
  });

  useEffect(() => {
    if (isError) {
      console.error(error);
      toast.error(error.message || "Failed to load items from API");
    }
  }, [isError, error]);

  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [restockItem, setRestockItem] = useState(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockMode, setRestockMode] = useState("restock");

  const enriched = useMemo(
    () =>
      (data || []).map((i) => ({ ...i, status: computeStatus(i, settings) })),
    [data, settings],
  );

  const uniqueCategories = useMemo(() => {
    const dataCats = (data || []).map((i) => i.category).filter(Boolean);
    return Array.from(new Set([...CATEGORIES, ...dataCats])).sort();
  }, [data]);

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

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Inventory Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [
        [
          "Item",
          "Category",
          "Qty",
          "Unit",
          "Reorder",
          "Expiry",
          "Status",
          "Supplier",
        ],
      ],
      body: enriched.map((i) => [
        i.name,
        i.category,
        i.quantity,
        i.unit,
        i.reorderLevel,
        i.expiryDate || "—",
        statusMeta[i.status].label,
        i.supplier || "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 40] },
    });
    doc.save(`inventory-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported");
  };

  const addMutation = useMutation({
    mutationFn: async (formData) => {
      const payload = {
        restID: parseInt(user.restId),
        itemName: formData.name,
        category: formData.category || "General",
        stock: formData.quantity || 0,
        reorderLevel: formData.reorderLevel || 0,
        reorderQuantity: 0,
        costPerUnit: formData.cost || 0,
        supplier: formData.supplier || "Unknown",
        unit: formData.unit || "Kg",
        imageUrl: "string",
        description: "string",
        shelfLife: formData.isNonPerishable
          ? null
          : parseInt(formData.shelfLifeDays, 10) || null,
        productionDate: formData.productionDate
          ? new Date(formData.productionDate).toISOString()
          : new Date().toISOString(),
      };
      const response = await axios.post(
        "https://resturantai.runasp.net/api/Inventory",
        payload,
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || "Item added";
      toast.success(message);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const payload = {
        itemName: formData.name || formData.itemName || "",
        category: formData.category || "General",
        reorderLevel: formData.reorderLevel || 0,
        supplier: formData.supplier || "Unknown",
        unit: formData.unit || "Kg",
        imageUrl: formData.imageUrl || "string",
        description: formData.description || "string",
        shelfLife: formData.isNonPerishable
          ? 0
          : parseInt(formData.shelfLifeDays, 10) || formData.shelfLife || 0,
        costPerUnit: formData.cost ?? formData.costPerUnit ?? 0,
      };
      const response = await axios.put(
        `https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || "Item updated";
      toast.success(message);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(
        `https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}/${id}`,
      );
    },
    onSuccess: () => {
      toast.success("Item deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete item");
    },
  });

  const handleSaveItem = (formData, isEditing) => {
    if (isEditing) {
      updateMutation.mutate({ id: editingItem.id, formData });
    } else {
      addMutation.mutate(formData);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockMode("restock");
    setRestockOpen(true);
  };

  const openDeduct = (item) => {
    setRestockItem(item);
    setRestockMode("deduct");
    setRestockOpen(true);
  };

  const handleRestock = async (
    qtyStr,
    productionDate = null,
    mode = "restock",
    unitPriceStr = "",
  ) => {
    const qty = parseFloat(qtyStr);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const token = user?.token || localStorage.getItem("authToken");
    const restId = user?.restId || 2;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (mode === "deduct") {
        if (qty > (restockItem.quantity || 0)) {
          toast.error("Cannot deduct more than current stock");
          return;
        }
        await axios.post(
          `https://resturantai.runasp.net/api/InventoryBatch/restaurant/${restId}/item/${restockItem.id}/withdraw?quantity=${qty}`,
          "",
          { headers },
        );
        toast.success("Stock deducted successfully");
      } else {
        const payload = {
          inventoryID: restockItem.id,
          quantity: qty,
          unitCost: parseFloat(unitPriceStr) || restockItem.cost || 0,
          productionDate: productionDate
            ? new Date(productionDate).toISOString()
            : new Date().toISOString(),
        };
        await axios.post(
          `https://resturantai.runasp.net/api/InventoryBatch/restaurant/${restId}/restock`,
          payload,
          { headers },
        );
        toast.success("Stock restocked successfully");
      }
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Operation failed");
    } finally {
      setRestockOpen(false);
      setRestockItem(null);
    }
  };

  const handleBulkImport = (newItems) => {
    addItemsBulk(newItems);
    toast.success(`Imported ${newItems.length} items locally`);
  };

  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <PageHeader
        icon={Package}
        title="Inventory"
        description="All items, filters, and bulk import"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportPdf} className="gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>

            <ScannerDialog
              open={scannerOpen}
              setOpen={setScannerOpen}
              existingInventory={data || []}
              onSuccess={() => refetch()}
            />

            <ItemFormDialog
              open={formOpen}
              setOpen={(open) => {
                setFormOpen(open);
                if (!open) setEditingItem(null);
              }}
              editingItem={editingItem}
              onSave={handleSaveItem}
            />
          </div>
        }
      />

      <Card className="bg-card border-border/60 overflow-hidden">
        <InventoryFilters
          filter={filter}
          setFilter={setFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          search={search}
          setSearch={setSearch}
          categories={uniqueCategories}
        />

        <InventoryTable
          filtered={filtered}
          loading={isLoading}
          search={search}
          setSearch={setSearch}
          openRestock={openRestock}
          openDeduct={openDeduct}
          openEdit={openEdit}
          deleteItem={(id) => deleteMutation.mutate(id)}
        />
      </Card>

      <RestockDialog
        open={restockOpen}
        setOpen={setRestockOpen}
        item={restockItem}
        onRestock={handleRestock}
        mode={restockMode}
      />
    </div>
  );
}
