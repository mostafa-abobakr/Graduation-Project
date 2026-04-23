import { useState } from "react";
import { toast } from "sonner";
import { useInventoryStore } from "@/lib/inventoryStore";

export const useInventoryActions = () => {
  const { addItem, addItemsBulk, updateItem, deleteItem } = useInventoryStore();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "Other",
    quantity: "",
    unit: "kg",
    reorderLevel: "",
    shelfLifeDays: "",
    isNonPerishable: false,
    cost: "",
    supplier: "",
  });
  const [formOpen, setFormOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      category: "Other",
      quantity: "",
      unit: "kg",
      reorderLevel: "",
      shelfLifeDays: "",
      isNonPerishable: false,
      cost: "",
      supplier: "",
    });
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      reorderLevel: String(item.reorderLevel),
      shelfLifeDays: item.shelfLifeDays ? String(item.shelfLifeDays) : "",
      isNonPerishable: item.isNonPerishable || false,
      cost: String(item.cost || 0),
      supplier: item.supplier || "",
    });
    setFormOpen(true);
  };

  const saveItem = (settings) => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    const data = {
      name: form.name.trim(),
      category: form.category || "Other",
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "piece",
      reorderLevel: parseFloat(form.reorderLevel) || settings.defaultReorderLevel,
      shelfLifeDays: form.isNonPerishable ? null : parseInt(form.shelfLifeDays, 10),
      isNonPerishable: form.isNonPerishable,
      cost: parseFloat(form.cost) || 0,
      supplier: form.supplier.trim() || "Unknown",
    };
    
    if (editing) {
      updateItem(editing.id, data);
      toast.success("Item updated");
    } else {
      addItem(data);
      toast.success("Item added");
    }
    setFormOpen(false);
  };

  const restockItem = (item, quantity, expiryDate = null) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return false;
    }

    const newBatch = {
      batchId: Math.random().toString(36).substring(7),
      quantity: qty,
      expiryDate: expiryDate,
      createdAt: new Date().toISOString(),
    };

    const updatedBatches = [...(item.batches || []), newBatch];
    const totalQuantity = updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const finalQuantity = item.batches ? totalQuantity : (item.quantity || 0) + totalQuantity;

    updateItem(item.id, {
      batches: updatedBatches,
      quantity: finalQuantity,
      stock: finalQuantity,
    });

    toast.success(`Restocked ${item.name} with +${qty} ${item.unit}`);
    return true;
  };

  return {
    editing,
    form,
    formOpen,
    setForm,
    setFormOpen,
    openCreate,
    openEdit,
    saveItem,
    restockItem,
  };
};
