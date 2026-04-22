import { useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ViewToggler } from "@/components/shared/ViewToggler";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useInventoryStore,
  computeStatus,
  statusMeta,
} from "@/lib/inventoryStore";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  FileDown,
  Eye,
  Scan,
  UploadCloud,
  CheckCircle2,
  Save,
  PackageSearch,
  PackagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CATEGORIES = [
  "Meat",
  "Seafood",
  "Vegetables",
  "Dairy",
  "Bakery",
  "Pantry",
  "Drinks",
  "Other",
];
const UNITS = ["kg", "g", "L", "ml", "piece", "box"];

const emptyForm = {
  name: "",
  category: "Other",
  quantity: "",
  unit: "kg",
  reorderLevel: "",
  shelfLifeDays: "",
  isNonPerishable: false,
  cost: "",
  supplier: "",
};

const parseInvoiceText = (text) => {
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
    let qtyIdx = -1,
      qty = 0,
      unit = "piece";
    for (let i = 0; i < tokens.length; i++) {
      const n = parseFloat(tokens[i]);
      if (!isNaN(n) && n > 0) {
        const next = (tokens[i + 1] || "").toLowerCase();
        if (units.includes(next)) {
          qtyIdx = i;
          qty = n;
          unit =
            next === "pcs" || next === "pc"
              ? "piece"
              : next === "l"
                ? "L"
                : next;
          break;
        }
        if (qtyIdx === -1) {
          qtyIdx = i;
          qty = n;
        }
      }
    }
    if (qtyIdx === -1) continue;
    let costIdx = -1,
      cost = 0;
    for (let i = tokens.length - 1; i > qtyIdx; i--) {
      const n = parseFloat(tokens[i].replace(/[$€£]/g, ""));
      if (!isNaN(n)) {
        costIdx = i;
        cost = n;
        break;
      }
    }
    const hasUnit = units.includes((tokens[qtyIdx + 1] || "").toLowerCase());
    const supplierStart = qtyIdx + (hasUnit ? 2 : 1);
    const supplierTokens =
      costIdx > supplierStart ? tokens.slice(supplierStart, costIdx) : [];
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

export default function InventoryPage() {
  const {
    items,
    loading,
    settings,
    addItem,
    addItemsBulk,
    updateItem,
    deleteItem,
  } = useInventoryStore();
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [invoiceText, setInvoiceText] = useState("");
  const [aiPreview, setAiPreview] = useState([]);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);
  const fileInputRef = useRef(null);

  // ── Restock state ──────────────────────────────────────
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockExpiry, setRestockExpiry] = useState("");
  const [restockOpen, setRestockOpen] = useState(false);

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockQty("");
    if (item.shelfLifeDays) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + item.shelfLifeDays);
      setRestockExpiry(defaultExpiry.toISOString().split("T")[0]);
    } else {
      setRestockExpiry("");
    }
    setRestockOpen(true);
  };

  const confirmRestock = () => {
    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const newBatch = {
      batchId: Math.random().toString(36).substring(7),
      quantity: qty,
      expiryDate: restockExpiry
    };

    const updatedBatches = [...(restockItem.batches || []), newBatch];
    const totalQuantity = updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);

    // Initial root quantity might be added directly if there are no batches yet.
    // If restockItem.quantity is > 0 and it has no batches, probably we want to carry it over or assume it's legacy
    const finalQuantity = (restockItem.batches ? totalQuantity : (restockItem.quantity || 0) + totalQuantity);

    updateItem(restockItem.id, {
      batches: updatedBatches,
      quantity: finalQuantity,
      stock: finalQuantity,
    });
    toast.success(`Restocked ${restockItem.name} with +${qty} ${restockItem.unit}`);
    setRestockOpen(false);
    setRestockItem(null);
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

  const enriched = useMemo(
    () => items.map((i) => ({ ...i, status: computeStatus(i, settings) })),
    [items, settings],
  );

  const counts = useMemo(() => {
    const c = {
      all: enriched.length,
      good: 0,
      low: 0,
      expiring: 0,
      critical: 0,
      out: 0,
    };
    enriched.forEach((i) => {
      c[i.status]++;
    });
    return c;
  }, [enriched]);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
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

  const saveItem = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const data = {
      name: form.name.trim(),
      category: form.category || "Other",
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "piece",
      reorderLevel:
        parseFloat(form.reorderLevel) || settings.defaultReorderLevel,
      shelfLifeDays: form.isNonPerishable
        ? null
        : parseInt(form.shelfLifeDays, 10),
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

  const handleSaveScanned = () => {
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
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Smart invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Smart invoice import
                  </DialogTitle>
                  <DialogDescription>
                    Paste invoice text. Format:{" "}
                    <span className="font-mono">
                      Item qty unit cost supplier
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={invoiceText}
                  onChange={(e) => setInvoiceText(e.target.value)}
                  rows={6}
                  placeholder={
                    "Tomato 10 kg 2.50 GreenFarm\nOlive Oil 5 L 15.00 Mediterranean"
                  }
                  className="font-mono text-xs"
                />
                <div className="flex justify-end">
                  <Button onClick={runAiParse} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Detect
                  </Button>
                </div>
                {aiPreview.length > 0 && (
                  <div className="border border-border/60 rounded-md max-h-60 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2">Name</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Cost</th>
                          <th className="text-left p-2">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiPreview.map((p, i) => (
                          <tr key={i} className="border-t border-border/40">
                            <td className="p-2">{p.name}</td>
                            <td className="p-2 text-right font-mono">
                              {p.quantity} {p.unit}
                            </td>
                            <td className="p-2 text-right font-mono">
                              ${p.cost.toFixed(2)}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {p.supplier}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setAiOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={importAi} disabled={!aiPreview.length}>
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={scannerOpen}
              onOpenChange={(open) => {
                setScannerOpen(open);
                if (!open) setScannedItems(null);
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
                    Upload an image or PDF of your invoice to extract items
                    automatically.
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
                        <h3 className="font-semibold text-lg">
                          Upload Invoice
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
                          Drag and drop your PDF or image invoice here, or click
                          to browse files.
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
                          Successfully extracted {scannedItems.length} items
                          from invoice
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
                              <tr
                                key={idx}
                                className="border-t border-border/30"
                              >
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
                        <Button
                          variant="ghost"
                          onClick={() => setScannerOpen(false)}
                        >
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

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit item" : "Add item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editing
                      ? "Update item details."
                      : "Add a new item manually."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 mt-2 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Ingredient Name
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Tomato, Flour..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Category
                      </Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setForm({ ...form, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Supplier
                      </Label>
                      <Input
                        value={form.supplier}
                        onChange={(e) =>
                          setForm({ ...form, supplier: e.target.value })
                        }
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
                        onChange={(e) =>
                          setForm({ ...form, quantity: e.target.value })
                        }
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
                        onChange={(e) =>
                          setForm({ ...form, cost: e.target.value })
                        }
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
                          onChange={(e) =>
                            setForm({ ...form, shelfLifeDays: e.target.value })
                          }
                          placeholder={form.isNonPerishable ? "—" : "e.g. 5"}
                        />
                        <div
                          className="flex items-center gap-2 px-3 py-2 border rounded-md border-border/40 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() =>
                            setForm({
                              ...form,
                              isNonPerishable: !form.isNonPerishable,
                            })
                          }
                        >
                          <Checkbox
                            id="nonperishable"
                            checked={form.isNonPerishable}
                            onCheckedChange={(val) =>
                              setForm({ ...form, isNonPerishable: val })
                            }
                          />
                          <Label
                            htmlFor="nonperishable"
                            className="text-xs font-medium cursor-pointer mb-0"
                          >
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
                        onChange={(e) =>
                          setForm({ ...form, reorderLevel: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="ghost" onClick={() => setFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveItem}>{editing ? "Save" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60">
          <div className="w-full max-w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
            <ViewToggler
              viewMode={filter}
              setViewMode={setFilter}
              modes={["all", "critical", "low", "expiring", "good"]}
              labels={[
                `All`,
                `Critical`,
                `Low`,
                `Expiring`,
                `In stock`,
              ]}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-start py-3 px-4 text-muted-foreground font-medium">
                  Item
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Quantity
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Expiry
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-32 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      searchQuery={search}
                      searchItemName="items"
                      onAction={() => setSearch("")}
                      icon={PackageSearch}
                      title="No items found"
                      description="No items match your filters."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const isCritical =
                    i.status === "critical" || i.status === "out";
                  return (
                    <tr
                      key={i.id}
                      className={`border-b border-border/40 hover:bg-muted/30 transition ${isCritical ? "bg-destructive/5" : ""}`}
                    >
                      <td className="py-3 px-4 font-medium text-foreground text-start">
                        {i.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-center">
                        {i.category}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={
                            isCritical ? "text-destructive font-semibold" : ""
                          }
                        >
                          {i.quantity} {i.unit}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          reorder ≤ {i.reorderLevel}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-center">
                        {i.expiryDate || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <Badge
                            className={statusMeta[i.status].class + " border-0"}
                          >
                            {isCritical && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {statusMeta[i.status].label}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Link to={`/inventory/${i.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Restock"
                            onClick={() => openRestock(i)}
                          >
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(i)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete "{i.name}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the item from
                                  inventory.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteItem(i.id);
                                    toast.success("Item deleted");
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Restock Dialog ────────────────────────────────── */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>
              Add stock to <span className="font-semibold text-foreground">{restockItem?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <span className="text-sm text-muted-foreground">Current Stock</span>
              <span className="font-mono font-semibold text-foreground">
                {restockItem?.quantity ?? 0} {restockItem?.unit}
              </span>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Quantity to Add ({restockItem?.unit})
              </Label>
              <Input
                type="number"
                min="0.01"
                step="any"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder={`e.g. 10`}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && confirmRestock()}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Expiry Date
              </Label>
              <Input
                type="date"
                value={restockExpiry}
                onChange={(e) => setRestockExpiry(e.target.value)}
              />
            </div>

            {restockQty && parseFloat(restockQty) > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm text-muted-foreground">New Stock</span>
                <span className="font-mono font-semibold text-primary">
                  {((restockItem?.quantity ?? 0) + parseFloat(restockQty)).toFixed(1)} {restockItem?.unit}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setRestockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestock} className="gap-2">
              <PackagePlus className="h-4 w-4" />
              Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
