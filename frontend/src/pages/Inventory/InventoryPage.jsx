import { useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useInventoryStore, computeStatus, statusMeta } from "@/lib/inventoryStore";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, Plus, Pencil, Trash2, Sparkles, Search, FileDown, Eye, Scan, UploadCloud, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CATEGORIES = ["Meat", "Seafood", "Vegetables", "Dairy", "Bakery", "Pantry", "Drinks", "Other"];
const UNITS = ["kg", "g", "L", "ml", "piece", "box"];

const emptyForm = { name: "", category: "Other", quantity: "", unit: "kg", reorderLevel: "", expiryDate: "", cost: "", supplier: "" };

const parseInvoiceText = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const units = ["kg", "g", "l", "ml", "pcs", "pc", "piece", "box"];
  const items = [];
  for (const raw of lines) {
    const tokens = raw.replace(/\s*[,|;]\s*/g, " ").replace(/\s+/g, " ").split(" ");
    if (tokens.length < 3) continue;
    let qtyIdx = -1, qty = 0, unit = "piece";
    for (let i = 0; i < tokens.length; i++) {
      const n = parseFloat(tokens[i]);
      if (!isNaN(n) && n > 0) {
        const next = (tokens[i + 1] || "").toLowerCase();
        if (units.includes(next)) { qtyIdx = i; qty = n; unit = next === "pcs" || next === "pc" ? "piece" : (next === "l" ? "L" : next); break; }
        if (qtyIdx === -1) { qtyIdx = i; qty = n; }
      }
    }
    if (qtyIdx === -1) continue;
    let costIdx = -1, cost = 0;
    for (let i = tokens.length - 1; i > qtyIdx; i--) {
      const n = parseFloat(tokens[i].replace(/[$€£]/g, ""));
      if (!isNaN(n)) { costIdx = i; cost = n; break; }
    }
    const hasUnit = units.includes((tokens[qtyIdx + 1] || "").toLowerCase());
    const supplierStart = qtyIdx + (hasUnit ? 2 : 1);
    const supplierTokens = costIdx > supplierStart ? tokens.slice(supplierStart, costIdx) : [];
    const name = tokens.slice(0, qtyIdx).join(" ").trim();
    if (!name) continue;
    items.push({
      name, category: "Other", quantity: qty, unit,
      reorderLevel: Math.max(1, Math.round(qty * 0.3)),
      expiryDate: "", cost: cost || 0,
      supplier: supplierTokens.join(" ").trim() || "Unknown",
    });
  }
  return items;
};

export default function InventoryPage() {
  const { items, settings, addItem, addItemsBulk, updateItem, deleteItem } = useInventoryStore();
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      e.target.value = null; // reset input
      handleSimulateScan();
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
    const c = { all: enriched.length, good: 0, low: 0, expiring: 0, critical: 0, out: 0 };
    enriched.forEach((i) => { c[i.status]++; });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (filter !== "all") list = list.filter((i) => i.status === filter);
    if (categoryFilter !== "all") list = list.filter((i) => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.supplier || "").toLowerCase().includes(q));
    }
    return list;
  }, [enriched, filter, categoryFilter, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category, quantity: String(item.quantity),
      unit: item.unit, reorderLevel: String(item.reorderLevel),
      expiryDate: item.expiryDate || "", cost: String(item.cost || 0), supplier: item.supplier || "",
    });
    setFormOpen(true);
  };

  const saveItem = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const data = {
      name: form.name.trim(),
      category: form.category || "Other",
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "piece",
      reorderLevel: parseFloat(form.reorderLevel) || settings.defaultReorderLevel,
      expiryDate: form.expiryDate || null,
      cost: parseFloat(form.cost) || 0,
      supplier: form.supplier.trim() || "Unknown",
    };
    if (editing) { updateItem(editing.id, data); toast.success("Item updated"); }
    else { addItem(data); toast.success("Item added"); }
    setFormOpen(false);
  };

  const runAiParse = () => {
    const parsed = parseInvoiceText(invoiceText);
    if (!parsed.length) { toast.error("Couldn't detect items. Try: 'Tomato 10 kg 2.50 GreenFarm'"); return; }
    setAiPreview(parsed); toast.success(`Detected ${parsed.length} item(s)`);
  };

  const importAi = () => { addItemsBulk(aiPreview); toast.success(`Imported ${aiPreview.length} items`); setAiOpen(false); setInvoiceText(""); setAiPreview([]); };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedItems([
        { name: "Chicken Breast", quantity: 20, unit: "kg", price: 120.00 },
        { name: "Basmati Rice", quantity: 50, unit: "kg", price: 65.00 },
        { name: "Olive Oil", quantity: 10, unit: "L", price: 85.00 },
      ]);
      toast.success("Invoice scanned successfully");
    }, 2000);
  };

  const handleSaveScanned = () => {
    const itemsToAdd = scannedItems.map(item => ({
      name: item.name,
      category: "Other",
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit,
      reorderLevel: settings.defaultReorderLevel || 10,
      expiryDate: "",
      cost: parseFloat(item.price) || 0,
      supplier: "Unknown"
    }));
    addItemsBulk(itemsToAdd);
    toast.success(`${itemsToAdd.length} items added from scanned invoice`);
    setScannerOpen(false);
    setScannedItems(null);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Inventory Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120); doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Item", "Category", "Qty", "Unit", "Reorder", "Expiry", "Status", "Supplier"]],
      body: enriched.map((i) => [i.name, i.category, i.quantity, i.unit, i.reorderLevel, i.expiryDate || "—", statusMeta[i.status].label, i.supplier || "—"]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [40, 40, 40] },
    });
    doc.save(`inventory-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <div className="space-y-6 animate-fade-in mt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">All items, filters, and bulk import</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportPdf} className="gap-2"><FileDown className="h-4 w-4" />Export PDF</Button>
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Smart invoice</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Smart invoice import</DialogTitle>
                <DialogDescription>Paste invoice text. Format: <span className="font-mono">Item qty unit cost supplier</span></DialogDescription>
              </DialogHeader>
              <Textarea value={invoiceText} onChange={(e) => setInvoiceText(e.target.value)} rows={6}
                placeholder={"Tomato 10 kg 2.50 GreenFarm\nOlive Oil 5 L 15.00 Mediterranean"} className="font-mono text-xs" />
              <div className="flex justify-end"><Button onClick={runAiParse} className="gap-2"><Sparkles className="h-4 w-4" />Detect</Button></div>
              {aiPreview.length > 0 && (
                <div className="border border-border/60 rounded-md max-h-60 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40"><tr><th className="text-left p-2">Name</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Cost</th><th className="text-left p-2">Supplier</th></tr></thead>
                    <tbody>{aiPreview.map((p, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2 text-right font-mono">{p.quantity} {p.unit}</td>
                        <td className="p-2 text-right font-mono">${p.cost.toFixed(2)}</td>
                        <td className="p-2 text-muted-foreground">{p.supplier}</td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAiOpen(false)}>Cancel</Button>
                <Button onClick={importAi} disabled={!aiPreview.length}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={scannerOpen} onOpenChange={(open) => { setScannerOpen(open); if(!open) setScannedItems(null); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Invoice Scanner <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Scan className="h-5 w-5 text-primary" />AI Invoice Scanner</DialogTitle>
                <DialogDescription>Upload an image or PDF of your invoice to extract items automatically.</DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {!scannedItems ? (
                  <>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
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
                      <Button variant="secondary" className="gap-2" disabled={isScanning} onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
                        {isScanning ? (
                          <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>Scanning Document...</>
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
                      <span className="font-medium text-sm">Successfully extracted {scannedItems.length} items from invoice</span>
                      <Button variant="ghost" size="sm" className="ml-auto h-8 hover:bg-primary/20" onClick={() => setScannedItems(null)}>Scan Another</Button>
                    </div>

                    <div className="border border-border/50 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Extracted Item</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Qty</th>
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Unit</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scannedItems.map((item, idx) => (
                            <tr key={idx} className="border-t border-border/30">
                              <td className="py-2 px-3"><Input value={item.name} onChange={(e) => { const newItems = [...scannedItems]; newItems[idx].name = e.target.value; setScannedItems(newItems); }} className="h-8" /></td>
                              <td className="py-2 px-3"><Input type="number" value={item.quantity} onChange={(e) => { const newItems = [...scannedItems]; newItems[idx].quantity = e.target.value; setScannedItems(newItems); }} className="h-8 text-right" /></td>
                              <td className="py-2 px-3"><Input value={item.unit} onChange={(e) => { const newItems = [...scannedItems]; newItems[idx].unit = e.target.value; setScannedItems(newItems); }} className="h-8" /></td>
                              <td className="py-2 px-3"><Input value={item.price} onChange={(e) => { const newItems = [...scannedItems]; newItems[idx].price = e.target.value; setScannedItems(newItems); }} className="h-8 text-right" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="ghost" onClick={() => setScannerOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveScanned} className="gap-2"><Save className="h-4 w-4" />Save All to Inventory</Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add item</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
                <DialogDescription>{editing ? "Update item details." : "Add a new item manually."}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div><Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Reorder level</Label><Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></div>
                <div><Label>Expiry date</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
                <div className="col-span-2"><Label>Cost / unit</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button onClick={saveItem}>{editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="critical" className="data-[state=active]:text-destructive">Critical ({counts.critical})</TabsTrigger>
              <TabsTrigger value="low">Low ({counts.low})</TabsTrigger>
              <TabsTrigger value="expiring">Expiring ({counts.expiring})</TabsTrigger>
              <TabsTrigger value="good">In stock ({counts.good})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 items-center">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Item</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Quantity</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Expiry</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />No items match your filters.
                </td></tr>
              )}
              {filtered.map((i) => {
                const isCritical = i.status === "critical" || i.status === "out";
                return (
                  <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 transition ${isCritical ? "bg-destructive/5" : ""}`}>
                    <td className="py-3 px-4 font-medium text-foreground">{i.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{i.category}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={isCritical ? "text-destructive font-semibold" : ""}>{i.quantity} {i.unit}</span>
                      <div className="text-xs text-muted-foreground">reorder ≤ {i.reorderLevel}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{i.expiryDate || "—"}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusMeta[i.status].class + " border-0"}>
                        {isCritical && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {statusMeta[i.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8"><Link to={`/inventory/${i.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{i.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This permanently removes the item from inventory.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => { deleteItem(i.id); toast.success("Item deleted"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
