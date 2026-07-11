import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scan, Save } from "lucide-react";
import { useScanner } from "@/hooks/useScanner";

import { InvoiceUploader } from "./InvoiceUploader";
import { MatchedItemsTable } from "./MatchedItemsTable";
import { UnmatchedItemsTable } from "./UnmatchedItemsTable";

export function ScannerDialog({ open, setOpen, existingInventory = [], onSuccess }) {
  const [mappedItems, setMappedItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [resetKey, setResetKey] = useState(0);

  const { scanInvoiceMutation, processInvoiceMutation } = useScanner({ onSuccess });

  useEffect(() => {
    if (!open) {
      setMappedItems([]);
      setNewItems([]);
      setResetKey((prev) => prev + 1);
    }
  }, [open]);

  const handleFileSelected = (file) => {
    scanInvoiceMutation.mutate(file, {
      onSuccess: (data) => {
        const mapped = (data.mapped_items || []).map((item) => ({
          ...item,
          quantity_to_add: item.quantity_to_add || 0,
          total_price: item.total_price || 0,
          productionDate: new Date().toISOString().split("T")[0],
          isEditing: false,
        }));

        const unmapped = (data.new_items || []).map((item) => {
          let cleanName = item.item_name || item.original_invoice_name || "";
          if (!item.item_name && item.original_invoice_name) {
            cleanName = cleanName
              .replace(/[0-9.$£€,]|EGP|LE|ج\.م\.?|ج م/gi, "")
              .replace(/\b(kg|g|lbs|oz|l|ml|pcs|piece|pieces|box|boxes|units)\b/gi, "")
              .replace(/[^a-zA-Z\s]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          }

          return {
            ...item,
            quantity_to_add: item.quantity_to_add || 0,
            total_price: item.total_price || 0,
            itemName: cleanName || item.original_invoice_name,
            productionDate: new Date().toISOString().split("T")[0],
            action: "create",
            mappedInventoryId: "",
            category: "General",
            unit: "Kg",
            reorderLevel: 10,
            shelfLifeDays: 7,
          };
        });

        setMappedItems(mapped);
        setNewItems(unmapped);
      },
    });
  };

  const handleReset = () => {
    setMappedItems([]);
    setNewItems([]);
  };

  const handleSubmit = () => {
    processInvoiceMutation.mutate(
      { mappedItems, newItems, existingInventory },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const isScanning = scanInvoiceMutation.isPending;
  const isSubmitting = processInvoiceMutation.isPending;

  // We consider that there's a preview running if it's scanning or if we have items mapped/new.
  // InvoiceUploader will handle its own state for the preview image.
  const hasItems = mappedItems.length > 0 || newItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Scan className="h-4 w-4" />
          Invoice Scanner{" "}
          <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
            AI
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[96vw] w-full flex flex-col p-4 sm:p-6 h-[92vh] max-h-[92vh]">
        <DialogHeader className="shrink-0 mb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Scan className="h-6 w-6 text-primary" />
            AI Invoice Scanner
          </DialogTitle>
          <DialogDescription>
            Upload an invoice, review the extracted items, and correctly map or create new inventory entries.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
          <InvoiceUploader
            key={resetKey}
            onFileSelected={handleFileSelected}
            onReset={handleReset}
          />

          <div className="flex-1 lg:w-3/4 min-h-[600px] lg:min-h-0 flex flex-col border border-border/60 rounded-xl bg-card overflow-hidden premium-shadow">
            {isScanning ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Scanning Document...</p>
              </div>
            ) : !hasItems ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-10 text-center">
                Upload a document on the left to begin reviewing data here.
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  <MatchedItemsTable
                    mappedItems={mappedItems}
                    setMappedItems={setMappedItems}
                  />
                  <UnmatchedItemsTable
                    newItems={newItems}
                    setNewItems={setNewItems}
                    existingInventory={existingInventory}
                  />
                </div>

                <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-3 shrink-0">
                  <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Confirm & Update Inventory
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
