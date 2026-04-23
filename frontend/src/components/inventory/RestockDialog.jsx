import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PackagePlus } from "lucide-react";

export function RestockDialog({ open, setOpen, item, onRestock }) {
  const [restockQty, setRestockQty] = useState("");

  useEffect(() => {
    if (open) {
      setRestockQty("");
    }
  }, [open]);

  const handleRestock = () => {
    onRestock(restockQty);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Restock Item</DialogTitle>
          <DialogDescription>
            Add stock to <span className="font-semibold text-foreground">{item?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Stock</span>
            <span className="font-mono font-semibold text-foreground">
              {item?.quantity ?? 0} {item?.unit}
            </span>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Quantity to Add ({item?.unit})
            </Label>
            <Input
              type="number"
              min="0.01"
              step="any"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder={`e.g. 10`}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRestock()}
            />
          </div>

          {restockQty && parseFloat(restockQty) > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm text-muted-foreground">New Stock</span>
              <span className="font-mono font-semibold text-primary">
                {((item?.quantity ?? 0) + parseFloat(restockQty)).toFixed(1)} {item?.unit}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRestock} className="gap-2">
            <PackagePlus className="h-4 w-4" />
            Restock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
