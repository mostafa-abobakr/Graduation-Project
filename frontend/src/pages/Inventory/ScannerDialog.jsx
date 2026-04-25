import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  UploadCloud,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Pencil,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ScannerDialog({
  open,
  setOpen,
  existingInventory = [],
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [mappedItems, setMappedItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const { user } = useAuth();

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  const categories = Array.from(
    new Set(existingInventory.map((i) => i.category).filter(Boolean)),
  );
  const units = Array.from(
    new Set(existingInventory.map((i) => i.unit).filter(Boolean)),
  );

  useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setZoom(1);
      setMappedItems([]);
      setNewItems([]);
    }
  }, [open, previewUrl]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setZoom(1);
      e.target.value = null;

      setIsScanning(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await axios.post(
          "https://youseef-awaad-zerobite-ai-engine.hf.space/inventory/invoice-scan/2?mode=auto",
          formData,
          {
            headers: {
              accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (
          res.data &&
          (res.data.mapped_items ||
            res.data.new_items ||
            res.data.status === "success")
        ) {
          const mapped = (res.data.mapped_items || []).map((item) => ({
            ...item,
            quantity_to_add: item.quantity_to_add || 0,
            total_price: item.total_price || 0,
            productionDate: new Date().toISOString().split("T")[0],
            isEditing: false,
          }));

          const unmapped = (res.data.new_items || []).map((item) => {
            let cleanName = item.item_name || item.original_invoice_name || "";
            if (!item.item_name && item.original_invoice_name) {
              cleanName = cleanName
                .replace(/[0-9.$£€]/g, "")
                .replace(
                  /\b(kg|g|lbs|oz|l|ml|pcs|piece|pieces|box|boxes|units)\b/gi,
                  "",
                )
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
          toast.success("Invoice scanned successfully");
        } else {
          console.error("Unexpected API Response:", res.data);
          throw new Error("Failed to scan invoice. Invalid response format.");
        }
      } catch (err) {
        console.error("Scan Error:", err);
        toast.error(
          "Failed to parse invoice. Check your network or file format.",
        );
      } finally {
        setIsScanning(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isZoomed = zoom > 1.01;

  const handleMouseDown = (e) => {
    if (!scrollRef.current || !isZoomed) return;

    e.preventDefault();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollPos({
      left: scrollRef.current.scrollLeft,
      top: scrollRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current || !isZoomed) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    scrollRef.current.scrollLeft = scrollPos.left - dx;
    scrollRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (!file?.type?.includes("pdf")) {
      setZoom((z) => (z <= 1.05 ? 1.75 : 1));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = user?.token || localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication token not found.");
      setIsSubmitting(false);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const promises = [];

      for (const item of mappedItems) {
        const existingItem = existingInventory.find(
          (i) => i.id === item.inventory_id,
        );
        if (existingItem) {
          const newStock =
            (existingItem.quantity || 0) +
            (parseFloat(item.quantity_to_add) || 0);
          const payload = {
            itemName: existingItem.name,
            category: existingItem.category,
            stock: newStock,
            reorderLevel: existingItem.reorderLevel,
            reorderQuantity: 0,
            costPerUnit: parseFloat(item.total_price) || existingItem.cost,
            supplier: existingItem.supplier,
            unit: existingItem.unit,
            productionDate: item.productionDate
              ? new Date(item.productionDate).toISOString()
              : new Date().toISOString(),
            imageUrl: "",
            description: "",
            expiryDate: new Date().toISOString(),
          };
          promises.push(
            axios.put(
              `https://resturantai.runasp.net/api/Inventory/${item.inventory_id}`,
              payload,
              {
                headers,
              },
            ),
          );
        }
      }

      for (const item of newItems) {
        const qty = parseFloat(item.quantity_to_add) || 0;
        const total = parseFloat(item.total_price) || 0;
        const costPerUnit = qty > 0 ? total / qty : 0;

        if (item.action === "map" && item.mappedInventoryId) {
          const existingItem = existingInventory.find(
            (i) => i.id === parseInt(item.mappedInventoryId),
          );
          if (existingItem) {
            const newStock = (existingItem.quantity || 0) + qty;
            const payload = {
              itemName: existingItem.name,
              category: existingItem.category,
              stock: newStock,
              reorderLevel: existingItem.reorderLevel,
              reorderQuantity: 0,
              costPerUnit: costPerUnit || existingItem.cost,
              supplier: existingItem.supplier,
              unit: existingItem.unit,
              productionDate: item.productionDate
                ? new Date(item.productionDate).toISOString()
                : new Date().toISOString(),
              imageUrl: "",
              description: "",
              expiryDate: new Date().toISOString(),
            };
            promises.push(
              axios.put(
                `https://resturantai.runasp.net/api/Inventory/${item.mappedInventoryId}`,
                payload,
                {
                  headers,
                },
              ),
            );
          }
        } else if (item.action === "create") {
          const payload = {
            restID: parseInt(user?.restId || 2),
            itemName: item.itemName || "Unknown Item",
            category: item.category || "General",
            stock: qty,
            reorderLevel: parseFloat(item.reorderLevel) || 0,
            reorderQuantity: 0,
            costPerUnit: costPerUnit,
            supplier: "Unknown",
            unit: item.unit || "Kg",
            shelfLifeDays: parseFloat(item.shelfLifeDays) || null,
            productionDate: item.productionDate
              ? new Date(item.productionDate).toISOString()
              : new Date().toISOString(),
            imageUrl: "",
            description: "",
            expiryDate: new Date().toISOString(),
          };
          promises.push(
            axios.post(
              `https://resturantai.runasp.net/api/Inventory`,
              payload,
              { headers },
            ),
          );
        }
      }

      await Promise.all(promises);
      toast.success("Inventory updated successfully from invoice");
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setMappedItems([]);
    setNewItems([]);
  };

  const removeMapped = (idx) => {
    setMappedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleEditMapped = (idx) => {
    setMappedItems((prev) => {
      const newArr = [...prev];
      newArr[idx].isEditing = !newArr[idx].isEditing;
      return newArr;
    });
  };

  const removeUnmapped = (idx) => {
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const avgConfidence =
    mappedItems.length > 0
      ? (mappedItems.reduce(
          (acc, curr) => acc + (curr.confidence_score || 0),
          0,
        ) /
          mappedItems.length) *
        100
      : 0;

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
            Upload an invoice, review the extracted items, and correctly map or
            create new inventory entries.
          </DialogDescription>
        </DialogHeader>

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

        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="lg:w-1/3 min-h-[400px] lg:h-auto shrink-0 border border-border/60 rounded-xl bg-muted/10 flex flex-col relative overflow-hidden premium-shadow">
            {!previewUrl ? (
              <div
                className="flex-1 flex flex-col items-center justify-center p-10 text-center hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                />
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl text-foreground">
                  Upload Invoice Document
                </h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Click to browse or drag and drop your PDF or image here. Our
                  AI will automatically extract items.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full relative">
                <div className="absolute top-2 right-2 z-20 flex gap-2">
                  {!file?.type?.includes("pdf") && (
                    <div className="flex items-center bg-background/90 backdrop-blur-sm border border-border rounded-md shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-mono w-12 text-center">
                        {Math.round((zoom - 1) * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Start Over
                  </Button>
                </div>
                <div
                  ref={scrollRef}
                  className={`flex-1 bg-white relative rounded-b-xl overflow-auto select-none ${isZoomed && isDragging ? "cursor-grabbing" : isZoomed ? "cursor-grab" : "cursor-default"}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                >
                  {file?.type?.includes("pdf") ? (
                    <object
                      data={previewUrl}
                      type="application/pdf"
                      className="absolute inset-0 w-full h-full"
                    >
                      <p className="p-4 text-center">
                        PDF preview not available. Please view the document
                        externally.
                      </p>
                    </object>
                  ) : (
                    <div
                      className="flex items-center justify-center transition-all duration-75"
                      style={{
                        width: `calc(100% * ${zoom})`,
                        height: `calc(100% * ${zoom})`,
                        minWidth: "100%",
                        minHeight: "100%",
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt="Invoice Preview"
                        draggable={false}
                        className="w-full h-full object-contain select-none pointer-events-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 lg:w-3/4 min-h-[600px] lg:min-h-0 flex flex-col border border-border/60 rounded-xl bg-card overflow-hidden premium-shadow">
            {isScanning ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground font-medium animate-pulse">
                  Scanning Document...
                </p>
              </div>
            ) : !previewUrl ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-10 text-center">
                Upload a document on the left to begin reviewing data here.
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Matched Items ({mappedItems.length})
                      </span>
                      {mappedItems.length > 0 && (
                        <Badge className="bg-primary/20 text-primary">
                          Avg Confidence: {avgConfidence.toFixed(0)}%
                        </Badge>
                      )}
                    </h3>
                    {mappedItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No items automatically matched.
                      </p>
                    ) : (
                      <div className="border border-border/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                                Original Text
                              </th>
                              <th className="py-2 px-3 text-center font-medium text-muted-foreground">
                                Matched Item
                              </th>
                              <th className="py-2 px-3 text-center font-medium text-muted-foreground w-16">
                                Qty
                              </th>
                              <th className="py-2 px-3 text-center font-medium text-muted-foreground w-20">
                                Price
                              </th>
                              <th className="py-2 px-3 text-center font-medium text-muted-foreground w-36">
                                Prod. Date
                              </th>
                              <th className="py-2 px-3 text-center font-medium text-muted-foreground w-16">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {mappedItems.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-t border-border/30 hover:bg-muted/10 transition-colors"
                              >
                                <td
                                  className="py-2 px-3 text-muted-foreground truncate max-w-[100px]"
                                  title={item.original_invoice_name}
                                >
                                  {item.original_invoice_name}
                                </td>
                                <td className="py-2 px-3 font-medium text-center">
                                  {item.item_name}
                                </td>
                                <td className="py-2 px-2">
                                  {item.isEditing ? (
                                    <Input
                                      type="number"
                                      value={item.quantity_to_add}
                                      onChange={(e) => {
                                        const newArr = [...mappedItems];
                                        newArr[idx].quantity_to_add =
                                          e.target.value;
                                        setMappedItems(newArr);
                                      }}
                                      className="h-8 px-2"
                                    />
                                  ) : (
                                    <div className="text-center w-full">
                                      {item.quantity_to_add}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  {item.isEditing ? (
                                    <Input
                                      type="number"
                                      value={item.total_price}
                                      onChange={(e) => {
                                        const newArr = [...mappedItems];
                                        newArr[idx].total_price =
                                          e.target.value;
                                        setMappedItems(newArr);
                                      }}
                                      className="h-8 px-2"
                                    />
                                  ) : (
                                    <div className="text-center w-full">
                                      ${parseFloat(item.total_price).toFixed(2)}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  {item.isEditing ? (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "h-8 w-full justify-start text-left font-normal px-2 bg-background",
                                            !item.productionDate &&
                                              "text-muted-foreground",
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                          {item.productionDate ? (
                                            format(
                                              new Date(item.productionDate),
                                              "PPP",
                                            )
                                          ) : (
                                            <span className="truncate">
                                              Pick a date
                                            </span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                      >
                                        <Calendar
                                          mode="single"
                                          selected={
                                            item.productionDate
                                              ? new Date(item.productionDate)
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            const newArr = [...mappedItems];
                                            newArr[idx].productionDate = date
                                              ? format(date, "yyyy-MM-dd")
                                              : "";
                                            setMappedItems(newArr);
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                    <div className="text-center w-full text-muted-foreground">
                                      {item.productionDate || "None"}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2 flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-blue-500 hover:bg-blue-500/10"
                                    onClick={() => toggleEditMapped(idx)}
                                  >
                                    {item.isEditing ? (
                                      <Save className="h-4 w-4" />
                                    ) : (
                                      <Pencil className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeMapped(idx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
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
                          <div
                            key={idx}
                            className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4 space-y-4"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Original Invoice Text
                                  </label>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeUnmapped(idx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="font-semibold text-foreground">
                                  {item.original_invoice_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1 space-y-1">
                                <label className="text-xs text-muted-foreground font-medium">
                                  Qty
                                </label>
                                <Input
                                  type="number"
                                  value={item.quantity_to_add}
                                  onChange={(e) => {
                                    const newArr = [...newItems];
                                    newArr[idx].quantity_to_add =
                                      e.target.value;
                                    setNewItems(newArr);
                                  }}
                                  className="h-8 bg-background"
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-xs text-muted-foreground font-medium">
                                  Total Price
                                </label>
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
                                <label className="text-xs text-muted-foreground font-medium">
                                  Production Date
                                </label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "h-8 w-full justify-start text-left font-normal px-2 bg-background",
                                        !item.productionDate &&
                                          "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                      {item.productionDate ? (
                                        format(
                                          new Date(item.productionDate),
                                          "PPP",
                                        )
                                      ) : (
                                        <span className="truncate">
                                          Pick a date
                                        </span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={
                                        item.productionDate
                                          ? new Date(item.productionDate)
                                          : undefined
                                      }
                                      onSelect={(date) => {
                                        const newArr = [...newItems];
                                        newArr[idx].productionDate = date
                                          ? format(date, "yyyy-MM-dd")
                                          : "";
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
                                  variant={
                                    item.action === "map"
                                      ? "default"
                                      : "outline"
                                  }
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
                                  variant={
                                    item.action === "create"
                                      ? "default"
                                      : "outline"
                                  }
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
                                      <SelectItem
                                        key={inv.id}
                                        value={inv.id.toString()}
                                      >
                                        {inv.name} (Current Stock:{" "}
                                        {inv.quantity} {inv.unit})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div className="space-y-1 col-span-2 md:col-span-1">
                                    <label className="text-xs text-muted-foreground">
                                      Item Name
                                    </label>
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
                                    <label className="text-xs text-muted-foreground">
                                      Category
                                    </label>
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
                                    <label className="text-xs text-muted-foreground">
                                      Unit
                                    </label>
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
                                    <label className="text-xs text-muted-foreground">
                                      Reorder
                                    </label>
                                    <Input
                                      type="number"
                                      value={item.reorderLevel}
                                      placeholder="Reorder"
                                      onChange={(e) => {
                                        const newArr = [...newItems];
                                        newArr[idx].reorderLevel =
                                          e.target.value;
                                        setNewItems(newArr);
                                      }}
                                      className="h-8 bg-background"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">
                                      Shelf Life
                                    </label>
                                    <Input
                                      type="number"
                                      value={item.shelfLifeDays}
                                      placeholder="Days"
                                      onChange={(e) => {
                                        const newArr = [...newItems];
                                        newArr[idx].shelfLifeDays =
                                          e.target.value;
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
                </div>

                <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-3 shrink-0">
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
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
