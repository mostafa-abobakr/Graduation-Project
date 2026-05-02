import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertCircle, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function UnmatchedItemsTable({ newItems, setNewItems, existingInventory }) {
  const categories = Array.from(new Set(existingInventory.map((i) => i.category).filter(Boolean)));
  const units = Array.from(new Set(existingInventory.map((i) => i.unit).filter(Boolean)));

  const removeUnmapped = (idx) => {
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <datalist id="category-list">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="unit-list">
        {units.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
        <AlertCircle className="h-5 w-5" />
        Action Required: Unmatched Items ({newItems.length})
      </h3>
      {newItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No unmatched items found.
        </p>
      ) : (
        <div className="space-y-4">
          {newItems.map((item, idx) => (
            <div key={idx} className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Original Invoice Text
                    </label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeUnmapped(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground">{item.original_invoice_name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Qty</label>
                  <Input
                    type="number"
                    value={item.quantity_to_add}
                    onChange={(e) => {
                      const newArr = [...newItems];
                      newArr[idx].quantity_to_add = e.target.value;
                      setNewItems(newArr);
                    }}
                    className="h-8 bg-background"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Total Price</label>
                  <Input
                    type="number"
                    value={item.total_price}
                    onChange={(e) => {
                      const newArr = [...newItems];
                      newArr[idx].total_price = e.target.value;
                      setNewItems(newArr);
                    }}
                    className="h-8 bg-background"
                  />
                </div>
                <div className="flex-[1.5] space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Production Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-8 w-full justify-start text-left font-normal px-2 bg-background",
                          !item.productionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {item.productionDate ? format(new Date(item.productionDate), "PPP") : <span className="truncate">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={item.productionDate ? new Date(item.productionDate) : undefined}
                        onSelect={(date) => {
                          const newArr = [...newItems];
                          newArr[idx].productionDate = date ? format(date, "yyyy-MM-dd") : "";
                          setNewItems(newArr);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant={item.action === "map" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const newArr = [...newItems];
                      newArr[idx].action = "map";
                      setNewItems(newArr);
                    }}
                  >
                    Map to Existing
                  </Button>
                  <Button
                    variant={item.action === "create" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const newArr = [...newItems];
                      newArr[idx].action = "create";
                      setNewItems(newArr);
                    }}
                  >
                    Create New Item
                  </Button>
                </div>

                {item.action === "map" ? (
                  <Select
                    value={item.mappedInventoryId}
                    onValueChange={(val) => {
                      const newArr = [...newItems];
                      newArr[idx].mappedInventoryId = val;
                      setNewItems(newArr);
                    }}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select existing inventory item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingInventory.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id.toString()}>
                          {inv.name} (Current Stock: {inv.quantity} {inv.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs text-muted-foreground">Item Name</label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => {
                          const newArr = [...newItems];
                          newArr[idx].itemName = e.target.value;
                          setNewItems(newArr);
                        }}
                        placeholder="Clean item name"
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Input
                        value={item.category}
                        onChange={(e) => {
                          const newArr = [...newItems];
                          newArr[idx].category = e.target.value;
                          setNewItems(newArr);
                        }}
                        list="category-list"
                        placeholder="Select or Type"
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Unit</label>
                      <Input
                        value={item.unit}
                        onChange={(e) => {
                          const newArr = [...newItems];
                          newArr[idx].unit = e.target.value;
                          setNewItems(newArr);
                        }}
                        list="unit-list"
                        placeholder="Select or Type"
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Reorder</label>
                      <Input
                        type="number"
                        value={item.reorderLevel}
                        placeholder="Reorder"
                        onChange={(e) => {
                          const newArr = [...newItems];
                          newArr[idx].reorderLevel = e.target.value;
                          setNewItems(newArr);
                        }}
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Shelf Life</label>
                      <Input
                        type="number"
                        value={item.shelfLifeDays}
                        placeholder="Days"
                        onChange={(e) => {
                          const newArr = [...newItems];
                          newArr[idx].shelfLifeDays = e.target.value;
                          setNewItems(newArr);
                        }}
                        className="h-8 bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
