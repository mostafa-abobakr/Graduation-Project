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
import { PackagePlus, PackageMinus, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function RestockDialog({ open, setOpen, item, onRestock, mode = "restock" }) {
  const [qty, setQty] = useState("");
  const [productionDate, setProductionDate] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (open) {
      setQty("");
      setProductionDate(today);
    }
  }, [open]);

  const handleAction = () => {
    onRestock(qty, productionDate, mode);
  };

  const isDeduct = mode === "deduct";
  const projectedStock = isDeduct
    ? (item?.quantity ?? 0) - parseFloat(qty || "0")
    : (item?.quantity ?? 0) + parseFloat(qty || "0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isDeduct ? "Deduct Stock" : "Restock Item"}</DialogTitle>
          <DialogDescription>
            {isDeduct ? "Remove" : "Add"} stock {isDeduct ? "from" : "to"} <span className="font-semibold text-foreground">{item?.name}</span>
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
              Quantity to {isDeduct ? "Deduct" : "Add"} ({item?.unit})
            </Label>
            <Input
              type="number"
              min="0.01"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`e.g. 10`}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
            />
          </div>

          {!isDeduct && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Production Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "h-10 w-full justify-start text-left font-normal bg-background",
                      !productionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {productionDate ? format(new Date(productionDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={productionDate ? new Date(productionDate) : undefined}
                    onSelect={(date) => {
                      setProductionDate(date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {qty && parseFloat(qty) > 0 && (
            <div className={`flex items-center justify-between p-3 ${isDeduct ? 'bg-destructive/10' : 'bg-primary/10'} rounded-lg`}>
              <span className="text-sm text-muted-foreground">New Stock</span>
              <span className={`font-mono font-semibold ${isDeduct ? 'text-destructive' : 'text-primary'}`}>
                {projectedStock.toFixed(1)} {item?.unit}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAction} className={`gap-2 ${isDeduct ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}>
            {isDeduct ? <PackageMinus className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
            {isDeduct ? "Deduct" : "Restock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
