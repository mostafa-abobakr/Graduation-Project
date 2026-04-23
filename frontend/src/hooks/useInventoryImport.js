import { useState, useRef } from "react";
import { toast } from "sonner";
import { useInventoryStore } from "@/lib/inventoryStore";

export const parseInvoiceText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const units = ["kg", "g", "l", "ml", "pcs", "pc", "piece", "box"];
  const items = [];
  
  for (const raw of lines) {
    const tokens = raw
      .replace(/\s*[,|;]\s*/g, " ")
      .replace(/\s+/g, " ")
      .split(" ");
    if (tokens.length < 3) continue;
    
    let qtyIdx = -1, qty = 0, unit = "piece";
    
    // Find quantity
    for (let i = 0; i < tokens.length; i++) {
      const n = parseFloat(tokens[i]);
      if (!isNaN(n) && n > 0) {
        const next = (tokens[i + 1] || "").toLowerCase();
        if (units.includes(next)) {
          qtyIdx = i;
          qty = n;
          unit = next === "pcs" || next === "pc" ? "piece" : next === "l" ? "L" : next;
          break;
        }
        if (qtyIdx === -1) {
          qtyIdx = i;
          qty = n;
        }
      }
    }
    
    if (qtyIdx === -1) continue;
    
    // Find cost
    let costIdx = -1, cost = 0;
    for (let i = tokens.length - 1; i > qtyIdx; i--) {
      const n = parseFloat(tokens[i].replace(/[$£]/g, ""));
      if (!isNaN(n)) {
        costIdx = i;
        cost = n;
        break;
      }
    }
    
    const hasUnit = units.includes((tokens[qtyIdx + 1] || "").toLowerCase());
    const supplierStart = qtyIdx + (hasUnit ? 2 : 1);
    const supplierTokens = costIdx > supplierStart ? tokens.slice(supplierStart, costIdx) : [];
    const name = tokens.slice(0, qtyIdx).join(" ").trim();
    
    if (!name) continue;
    
    items.push({
      name,
      category: "Other",
      quantity: qty,
      unit,
      reorderLevel: Math.max(1, Math.round(qty * 0.3)),
      expiryDate: "",
      cost: cost || 0,
      supplier: supplierTokens.join(" ").trim() || "Unknown",
    });
  }
  
  return items;
};

export const useInventoryImport = () => {
  const { addItemsBulk } = useInventoryStore();
  const [aiOpen, setAiOpen] = useState(false);
  const [invoiceText, setInvoiceText] = useState("");
  const [aiPreview, setAiPreview] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);
  const fileInputRef = useRef(null);

  // Restock state
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockOpen, setRestockOpen] = useState(false);

  const OCR_PROMPT = `You are an advanced OCR and data extraction system specialized in inventory invoices.

Your task is to extract structured data from a supplier invoice image or text.

Instructions:
- Carefully read the invoice content.
- Identify all listed items (products/materials).
- For each item, extract the following fields:
  - item_name (string)
  - quantity (number)
  - unit (string, e.g., kg, pcs, box, liter)
  - unit_price (number)
  - total_price (number, if available)
  - expiry_date (string, if available, format YYYY-MM-DD)
  - production_date (string, if available)
  - batch_number (string, if available)

- Also extract general invoice information:
  - invoice_number
  - supplier_name
  - invoice_date

Rules:
- If a field is missing, return null.
- Do not guess values.
- Normalize numbers (no currency symbols).
- Output ONLY valid JSON (no explanations).

Output format:

{
  "invoice_number": "",
  "supplier_name": "",
  "invoice_date": "",
  "items": [
    {
      "item_name": "",
      "quantity": 0,
      "unit": "",
      "unit_price": 0,
      "total_price": 0,
      "expiry_date": null,
      "production_date": null,
      "batch_number": null
    }
  ]
}`;

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockQty("");
    setRestockOpen(true);
  };

  const confirmRestock = (updateItem) => {
    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    updateItem(restockItem.id, {
      quantity: (restockItem.quantity || 0) + qty,
      stock: (restockItem.stock || restockItem.quantity || 0) + qty,
    });
    toast.success(`Restocked ${restockItem.name} with +${qty} ${restockItem.unit}`);
    setRestockOpen(false);
    setRestockItem(null);
  };

  const runAiParse = () => {
    const parsed = parseInvoiceText(invoiceText);
    if (!parsed.length) {
      toast.error("Couldn't detect items. Try: 'Tomato 10 kg 2.50 GreenFarm'");
      return;
    }
    setAiPreview(parsed);
    toast.success(`Detected ${parsed.length} item(s)`);
  };

  const importAi = () => {
    addItemsBulk(aiPreview);
    toast.success(`Imported ${aiPreview.length} items`);
    setAiOpen(false);
    setInvoiceText("");
    setAiPreview([]);
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = null; // reset input

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
            `Extracted ${mappedItems.length} items from ${data.supplier_name || "invoice"}`,
          );
        } else {
          throw new Error("No items found in JSON");
        }
      } catch (err) {
        console.error("OCR Error:", err);
        toast.error(
          "Failed to parse invoice. Make sure it's a clear image or PDF.",
        );
      } finally {
        setIsScanning(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveScanned = (settings) => {
    const itemsToAdd = scannedItems.map((item) => ({
      name: item.name,
      category: "Other",
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit,
      reorderLevel: settings.defaultReorderLevel || 10,
      shelfLifeDays: null,
      isNonPerishable: true,
      cost: parseFloat(item.price) || 0,
      supplier: "Unknown",
    }));
    addItemsBulk(itemsToAdd);
    toast.success(`${itemsToAdd.length} items added from scanned invoice`);
    setScannerOpen(false);
    setScannedItems(null);
  };

  return {
    // AI Text Import
    aiOpen,
    setAiOpen,
    invoiceText,
    setInvoiceText,
    aiPreview,
    runAiParse,
    importAi,
    
    // Scanner Import
    scannerOpen,
    setScannerOpen,
    isScanning,
    scannedItems,
    setScannedItems,
    fileInputRef,
    handleFileChange,
    triggerFileInput,
    handleSaveScanned,
    
    // Restock
    restockItem,
    restockQty,
    setRestockQty,
    restockOpen,
    setRestockOpen,
    openRestock,
    confirmRestock,
  };
};
