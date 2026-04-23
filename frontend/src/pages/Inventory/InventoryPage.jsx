import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
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

import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemFormDialog } from "@/components/inventory/ItemFormDialog";
import { SmartInvoiceDialog } from "@/components/inventory/SmartInvoiceDialog";
import { ScannerDialog } from "@/components/inventory/ScannerDialog";
import { RestockDialog } from "@/components/inventory/RestockDialog";

export default function InventoryPage() {
  const {
    items,
    loading: storeLoading,
    settings,
    addItem,
    addItemsBulk,
    updateItem,
    deleteItem,
    setItems,
  } = useInventoryStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      const response = await axios.get("https://youseef-awaad-zerobite-ai-engine.hf.space/inventory/items/2");
      return response.data.map((item) => ({
        id: item.inventory_id,
        name: item.item_name,
        category: item.category || "Other",
        quantity: item.stock,
        unit: item.unit,
        reorderLevel: item.reorder_level,
        cost: item.cost_per_unit,
        expiryDate: null,
        supplier: "Unknown",
      }));
    }
  });

  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data, setItems]);

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

  const enriched = useMemo(
    () => items.map((i) => ({ ...i, status: computeStatus(i, settings) })),
    [items, settings],
  );

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

  const handleSaveItem = (data, isEditing) => {
    if (isEditing) {
      updateItem(editingItem.id, data);
      toast.success("Item updated");
    } else {
      addItem(data);
      toast.success("Item added");
    }
    setFormOpen(false);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockOpen(true);
  };

  const restockMutation = useMutation({
    mutationFn: async ({ id, qty }) => {
      const response = await axios.post('https://youseef-awaad-zerobite-ai-engine.hf.space/inventory/restock/2', {
        inventory_id: id,
        quantity: qty
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Restocked successfully with +${variables.qty}`);
      refetch();
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || "Failed to restock on server");
      refetch();
    }
  });

  const handleRestock = (qtyStr, expiryDate = null) => {
    const qty = parseFloat(qtyStr);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    // Create new batch object
    const newBatch = {
      batchId: Math.random().toString(36).substring(7),
      quantity: qty,
      expiryDate: expiryDate,
      createdAt: new Date().toISOString(),
    };

    // Update batches and calculate totals
    const updatedBatches = [...(restockItem.batches || []), newBatch];
    const totalQuantity = updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const finalQuantity = restockItem.batches 
      ? totalQuantity 
      : (restockItem.quantity || 0) + totalQuantity;

    // Optimistic update with batches
    updateItem(restockItem.id, {
      batches: updatedBatches,
      quantity: finalQuantity,
      stock: finalQuantity,
    });

    restockMutation.mutate({ id: restockItem.id, qty });

    setRestockOpen(false);
    setRestockItem(null);
  };

  const handleBulkImport = (newItems) => {
    addItemsBulk(newItems);
    toast.success(`Imported ${newItems.length} items`);
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
            
            <SmartInvoiceDialog 
              open={aiOpen} 
              setOpen={setAiOpen} 
              onImport={handleBulkImport} 
            />

            <ScannerDialog 
              open={scannerOpen} 
              setOpen={setScannerOpen} 
              onSaveItems={(items) => {
                addItemsBulk(items);
                toast.success(`${items.length} items added from scanned invoice`);
              }} 
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
        />
        
        <InventoryTable 
          filtered={filtered} 
          loading={isLoading} 
          search={search} 
          setSearch={setSearch} 
          openRestock={openRestock} 
          openEdit={openEdit} 
          deleteItem={deleteItem} 
        />
      </Card>

      <RestockDialog 
        open={restockOpen} 
        setOpen={setRestockOpen} 
        item={restockItem} 
        onRestock={handleRestock} 
      />
    </div>
  );
}