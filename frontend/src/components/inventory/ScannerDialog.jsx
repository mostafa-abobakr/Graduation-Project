import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scan, UploadCloud, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { OCR_PROMPT } from "./InventoryUtils";

export function ScannerDialog({ open, setOpen, onSaveItems }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = null;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error("VITE_GEMINI_API_KEY is missing in .env file");
        return;
      }

      setIsScanning(true);
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const res = reader.result;
            resolve(res.substring(res.indexOf(",") + 1));
          };
          reader.onerror = (error) => reject(error);
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: OCR_PROMPT },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });

        let responseText = response.text;
        responseText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const data = JSON.parse(responseText);

        if (data && data.items && data.items.length > 0) {
          const mappedItems = data.items.map((item) => ({
            name: item.item_name || "Unknown Item",
            quantity: item.quantity || 0,
            unit: item.unit || "piece",
            price: item.unit_price || 0,
          }));
          setScannedItems(mappedItems);
          toast.success(
            `Extracted ${mappedItems.length} items from ${data.supplier_name || "invoice"}`
          );
        } else {
          throw new Error("No items found in JSON");
        }
      } catch (err) {
        console.error("OCR Error:", err);
        toast.error("Failed to parse invoice. Make sure it's a clear image or PDF.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveScanned = () => {
    const itemsToAdd = scannedItems.map((item) => ({
      name: item.name,
      category: "Other",
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit,
      reorderLevel: 10,
      shelfLifeDays: null,
      isNonPerishable: true,
      cost: parseFloat(item.price) || 0,
      supplier: "Unknown",
    }));
    onSaveItems(itemsToAdd);
    setOpen(false);
    setScannedItems(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setScannedItems(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Scan className="h-4 w-4" />
          Invoice Scanner{" "}
          <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
            AI
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            AI Invoice Scanner
          </DialogTitle>
          <DialogDescription>
            Upload an image or PDF of your invoice to extract items automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!scannedItems ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={triggerFileInput}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadCloud className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Upload Invoice</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
                  Drag and drop your PDF or image invoice here, or click to browse files.
                </p>
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={isScanning}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                >
                  {isScanning ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                      Scanning Document...
                    </>
                  ) : (
                    <>Select File</>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">
                  Successfully extracted {scannedItems.length} items from invoice
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 hover:bg-primary/20"
                  onClick={() => setScannedItems(null)}
                >
                  Scan Another
                </Button>
              </div>

              <div className="border border-border/50 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Extracted Item
                      </th>
                      <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Unit
                      </th>
                      <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-border/30">
                        <td className="py-2 px-3">
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...scannedItems];
                              newItems[idx].name = e.target.value;
                              setScannedItems(newItems);
                            }}
                            className="h-8"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...scannedItems];
                              newItems[idx].quantity = e.target.value;
                              setScannedItems(newItems);
                            }}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={item.unit}
                            onChange={(e) => {
                              const newItems = [...scannedItems];
                              newItems[idx].unit = e.target.value;
                              setScannedItems(newItems);
                            }}
                            className="h-8"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...scannedItems];
                              newItems[idx].price = e.target.value;
                              setScannedItems(newItems);
                            }}
                            className="h-8 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveScanned} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save All to Inventory
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
