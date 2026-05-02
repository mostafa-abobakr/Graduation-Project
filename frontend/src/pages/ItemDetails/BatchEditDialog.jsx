import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Pencil, Hash, DollarSign, CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateBatch } from "@/hooks/useInventory";

export function BatchEditDialog({ batch, restId, itemId, open, onClose, token, shelfLife }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(String(batch?.quantity ?? ""));
  const [unitCost, setUnitCost] = useState(String(batch?.unitCost ?? ""));
  const [prodDate, setProdDate] = useState(
    batch?.productionDate ? batch.productionDate.split("T")[0] : "",
  );

  // Keep form in sync when a different batch is opened
  useEffect(() => {
    if (batch) {
      setQty(String(batch.quantity ?? ""));
      setUnitCost(String(batch.unitCost ?? ""));
      setProdDate(batch.productionDate ? batch.productionDate.split("T")[0] : "");
    }
  }, [batch]);

  // Compute expiry live: productionDate + shelfLife days
  const computedExpiry = useMemo(() => {
    if (!prodDate || !shelfLife) return null;
    const d = new Date(prodDate);
    d.setDate(d.getDate() + parseInt(shelfLife, 10));
    return d;
  }, [prodDate, shelfLife]);

  const updateBatchMutation = useUpdateBatch();
  
  const handleUpdate = () => {
    const payload = {
      quantity: parseFloat(qty) || 0,
      unitCost: parseFloat(unitCost) || 0,
      productionDate: prodDate
        ? new Date(prodDate).toISOString()
        : new Date().toISOString(),
    };
    updateBatchMutation.mutate(
      { restId, batchId: batch.batchId, payload },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Batch #{batch?.batchId}
          </DialogTitle>
          <DialogDescription>
            Update quantity, unit cost, and production date for this batch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Quantity */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Quantity
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="pl-9"
                placeholder="e.g. 50"
                autoFocus
              />
            </div>
          </div>

          {/* Unit Cost */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Unit Cost ($)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="pl-9"
                placeholder="e.g. 20.00"
              />
            </div>
          </div>

          {/* Production Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Production Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal bg-background",
                    !prodDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {prodDate
                    ? format(new Date(prodDate), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={prodDate ? new Date(prodDate) : undefined}
                  onSelect={(date) =>
                    setProdDate(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expiry preview — computed live from prodDate + shelfLife */}
          {(computedExpiry || batch?.expiryDate) && (
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <span className="text-sm text-muted-foreground">Expiry Date</span>
              <span className="font-mono text-sm font-medium">
                {computedExpiry
                  ? computedExpiry.toLocaleDateString()
                  : new Date(batch.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateBatchMutation.isPending}
            className="gap-2"
          >
            {updateBatchMutation.isPending && (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
