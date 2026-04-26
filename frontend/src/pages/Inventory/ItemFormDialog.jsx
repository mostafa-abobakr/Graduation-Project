import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CATEGORIES, UNITS, emptyForm } from "./InventoryUtils";
import { toast } from "sonner";

export function ItemFormDialog({ open, setOpen, editingItem, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setForm({
          name: editingItem.name,
          category: editingItem.category,
          quantity: String(editingItem.quantity),
          unit: editingItem.unit,
          reorderLevel: String(editingItem.reorderLevel),
          shelfLifeDays: editingItem.shelfLifeDays ? String(editingItem.shelfLifeDays) : "",
          isNonPerishable: editingItem.isNonPerishable || false,
          cost: String(editingItem.cost || 0),
          supplier: editingItem.supplier || "",
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, editingItem]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const data = {
      name: form.name.trim(),
      category: form.category || "Other",
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "piece",
      reorderLevel: parseFloat(form.reorderLevel) || 10,
      shelfLifeDays: form.isNonPerishable ? null : parseInt(form.shelfLifeDays, 10),
      isNonPerishable: form.isNonPerishable,
      cost: parseFloat(form.cost) || 0,
      supplier: form.supplier.trim() || "Unknown",
    };
    onSave(data, !!editingItem);
  };

  const isEditing = !!editingItem;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!isEditing && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update item details." : "Add a new item manually."}
          </DialogDescription>
        </DialogHeader>
        
        <datalist id="form-category-list">
          {CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="grid gap-4 mt-2 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Ingredient Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tomato, Flour..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Category
              </Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="form-category-list"
                placeholder="Select or type..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Supplier
              </Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="e.g. Farm Co."
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Quantity (Stock)
              </Label>
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Unit
              </Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Cost per Unit ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 relative">
              <Label className="text-xs text-muted-foreground block">
                Shelf Life (Days)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  disabled={form.isNonPerishable}
                  value={form.isNonPerishable ? "" : form.shelfLifeDays}
                  onChange={(e) => setForm({ ...form, shelfLifeDays: e.target.value })}
                  placeholder={form.isNonPerishable ? "—" : "e.g. 5"}
                />
                <div
                  className="flex items-center gap-2 px-3 py-2 border rounded-md border-border/40 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setForm({ ...form, isNonPerishable: !form.isNonPerishable })}
                >
                  <Checkbox
                    id="nonperishable"
                    checked={form.isNonPerishable}
                    onCheckedChange={(val) => setForm({ ...form, isNonPerishable: val })}
                  />
                  <Label htmlFor="nonperishable" className="text-xs font-medium cursor-pointer mb-0">
                    N/A
                  </Label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Reorder Level
              </Label>
              <Input
                type="number"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEditing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
