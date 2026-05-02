import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Package,
  Clock,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  History,
  Layers,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Pencil,
  Trash2,
  CalendarIcon,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

// ─── Consume Group Row ────────────────────────────────────────────────────────
function ConsumeGroupRow({ event, itemUnit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 relative group w-full">
      <div 
        className="flex gap-4 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-muted/50 text-muted-foreground z-10">
          <TrendingDown className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                Daily Consumption
              </p>
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(event.dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono font-medium text-rose-400">
                -{event.totalQuantity} {itemUnit}
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="ml-12 pl-4 border-l-2 border-border/50 space-y-3 pb-2 pt-1 animate-fade-in">
          {event.deductions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(d => (
            <div key={d.transactionId} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(d.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/20 ml-2">
                  Batch #{d.batchId}
                </Badge>
              </div>
              <div className="font-mono text-xs text-rose-400/80 mr-11">
                -{d.quantity} {itemUnit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch Edit Dialog ───────────────────────────────────────────────────────
function BatchEditDialog({ batch, restId, itemId, open, onClose, token, shelfLife }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(String(batch?.quantity ?? ""));
  const [unitCost, setUnitCost] = useState(String(batch?.unitCost ?? ""));
  const [prodDate, setProdDate] = useState(
    batch?.productionDate ? batch.productionDate.split("T")[0] : "",
  );

  // Keep form in sync when a different batch is opened
  React.useEffect(() => {
    if (batch) {
      setQty(String(batch.quantity ?? ""));
      setUnitCost(String(batch.unitCost ?? ""));
      setProdDate(batch.productionDate ? batch.productionDate.split("T")[0] : "");
    }
  }, [batch]);

  // Compute expiry live: productionDate + shelfLife days
  const computedExpiry = React.useMemo(() => {
    if (!prodDate || !shelfLife) return null;
    const d = new Date(prodDate);
    d.setDate(d.getDate() + parseInt(shelfLife, 10));
    return d;
  }, [prodDate, shelfLife]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        quantity: parseFloat(qty) || 0,
        unitCost: parseFloat(unitCost) || 0,
        productionDate: prodDate
          ? new Date(prodDate).toISOString()
          : new Date().toISOString(),
      };
      await axios.put(
        `https://resturantai.runasp.net/api/InventoryBatch/restaurant/${restId}/batch/${batch.batchId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
    },
    onSuccess: () => {
      toast.success(`Batch #${batch.batchId} updated`);
      queryClient.invalidateQueries(["batchDetails", restId, itemId]);
      queryClient.invalidateQueries(["inventoryItems", restId]);
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update batch");
    },
  });

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
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending && (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const restId = user?.restId || 2;
  const token = user?.token || localStorage.getItem("authToken");

  const [editingBatch, setEditingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);

  const queryClient = useQueryClient();

  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId) => {
      await axios.delete(
        `https://resturantai.runasp.net/api/InventoryBatch/restaurant/${restId}/batch/${batchId}`,
        {
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
    },
    onSuccess: () => {
      toast.success(`Batch #${deletingBatch?.batchId} deleted`);
      queryClient.invalidateQueries(["batchDetails", restId, id]);
      queryClient.invalidateQueries(["inventoryItems", restId]);
      setDeletingBatch(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete batch");
      setDeletingBatch(null);
    },
  });

  // Fetch inventory list (for item meta: name, category, unit, reorderLevel…)
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["inventoryItems", user?.restId],
    queryFn: async () => {
      const response = await axios.get(
        `https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}`,
      );
      return response.data.map((item) => ({
        id: item.inventoryID,
        name: item.itemName,
        category: item.category || "Other",
        quantity: item.stock,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        cost: item.costPerUnit || 0,
        shelfLife: item.shelfLife ?? null,
        batchesCount: item.batchesCount ?? 0,
        supplier: item.supplier || "Unknown",
        apiStatus: item.status,
      }));
    },
    enabled: !!user?.restId,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch live batch details from the dedicated batch endpoint
  const {
    data: batchData,
    isLoading: batchesLoading,
    isError: batchesError,
  } = useQuery({
    queryKey: ["batchDetails", restId, id],
    queryFn: async () => {
      const res = await axios.get(
        `https://resturantai.runasp.net/api/InventoryBatch/restaurant/${restId}/item/${id}`,
        { headers: { accept: "*/*" } },
      );
      return res.data;
    },
    enabled: !!id && !!restId,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch transactions from real endpoint
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useQuery({
    queryKey: ["itemTransactions", restId, id],
    queryFn: async () => {
      const res = await axios.get(
        `https://resturantai.runasp.net/api/InventoryTransactions/restaurant/${restId}/item/${id}`,
        { headers: { accept: "*/*" } },
      );
      return res.data;
    },
    enabled: !!id && !!restId,
    refetchOnWindowFocus: true,
  });

  const item = items.find((i) => String(i.id) === String(id));

  const batches = batchData?.batches ?? [];
  const sortedBatches = batches.slice().sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const timelineEvents = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const adds = [];
    const consumes = [];
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 30);
    const cutoffMs = cutoffTime.getTime();

    transactions.forEach(t => {
      if (!t.transactionDate || new Date(t.transactionDate).getTime() < cutoffMs) return;

      if (t.transactionType === "AddBatch") {
        adds.push(t);
      } else if (t.transactionType === "ConsumeBatch") {
        consumes.push(t);
      }
    });

    const groupedConsumes = {};
    consumes.forEach(c => {
      if (!c.transactionDate) return;
      const dateStr = c.transactionDate.split("T")[0]; 
      if (!groupedConsumes[dateStr]) {
        groupedConsumes[dateStr] = {
          type: "consumeGroup",
          dateStr: dateStr,
          rawDate: new Date(dateStr).getTime(),
          totalQuantity: 0,
          deductions: []
        };
      }
      groupedConsumes[dateStr].totalQuantity += c.quantity;
      groupedConsumes[dateStr].deductions.push(c);
    });

    const events = [
      ...adds.map(a => ({
        type: "add",
        dateStr: a.transactionDate, 
        rawDate: new Date(a.transactionDate).getTime(),
        data: a
      })),
      ...Object.values(groupedConsumes)
    ];

    return events.sort((a, b) => b.rawDate - a.rawDate);
  }, [transactions]);

  const totalQuantity = batchData?.totalQuantity ?? item?.quantity ?? 0;

  // ── Loading state ──
  if (itemsLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        {/* Bottom Grid Skeleton */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground">Item not found</h2>
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  const isCritical = totalQuantity <= item.reorderLevel;
  const isLow = !isCritical && totalQuantity <= item.reorderLevel * 1.5;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/inventory")}
          className="rounded-full hover:bg-muted/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {item.name}
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20"
            >
              {item.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Item ID: #{item.id} • Supplier: {item.supplier}
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Quantity */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Available Quantity
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-foreground">
                    {totalQuantity}
                  </span>
                  <span className="text-lg text-muted-foreground font-medium">
                    {item.unit}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across{" "}
                  <span className="font-semibold text-foreground">
                    {batches.length}
                  </span>{" "}
                  active batch{batches.length !== 1 ? "es" : ""}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Stock Health
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {isCritical ? (
                    <Badge
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      Critical Stock
                    </Badge>
                  ) : isLow ? (
                    <Badge
                      variant="outline"
                      className="bg-warning/10 text-warning border-warning/20 text-sm py-1"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 text-sm py-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      Optimal Stock
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Reorder threshold:{" "}
                  <span className="font-mono">
                    {item.reorderLevel} {item.unit}
                  </span>
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  isCritical
                    ? "bg-destructive/10"
                    : isLow
                    ? "bg-warning/10"
                    : "bg-primary/10"
                }`}
              >
                {isCritical ? (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                ) : isLow ? (
                  <AlertCircle className="h-6 w-6 text-warning" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Grid: Batches + History ── */}
      <div className="flex flex-col gap-6">
        {/* Active Batches */}
        <Card className="border-border/50 shadow-sm bg-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" strokeWidth={2.5} />
                Active Batches
              </CardTitle>
              <CardDescription>
                Tracked supply batches sorted by closest expiry date.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {batchesLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                Loading batches…
              </div>
            ) : batchesError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-destructive/5 rounded-lg border border-dashed border-destructive/20">
                <AlertCircle className="h-8 w-8 text-destructive mb-3 opacity-70" />
                <p className="font-medium text-foreground">
                  Could not load batches
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please try again later.
                </p>
              </div>
            ) : sortedBatches.length > 0 ? (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-gray-700/50">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-medium text-slate-300">
                        Batch
                      </th>
                      <th className="py-2.5 px-3 text-center font-medium text-slate-300">
                        Qty
                      </th>
                      <th className="py-2.5 px-3 text-right font-medium text-slate-300">
                        Cost/u
                      </th>
                      <th className="py-2.5 px-3 text-center font-medium text-slate-300">
                        Expiry
                      </th>
                      <th className="py-2.5 px-3 text-center font-medium text-slate-300">
                        Status
                      </th>
                      <th className="py-2.5 px-5 text-right font-medium text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBatches.map((batch, idx) => {
                      const isExpired =
                        batch.expiryDate &&
                        new Date(batch.expiryDate) < new Date();
                      return (
                        <tr
                          key={batch.batchId ?? idx}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group"
                        >
                          {/* Batch ID */}
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-muted-foreground">
                              #{batch.batchId ?? "—"}
                            </span>
                          </td>
                          {/* Qty */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono font-semibold text-sm">
                              {batch.quantity}
                            </span>
                          </td>
                          {/* Unit Cost */}
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            ${(batch.unitCost ?? 0).toFixed(2)}
                          </td>
                          {/* Expiry */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>
                                {batch.expiryDate
                                  ? new Date(batch.expiryDate).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isExpired
                                  ? "text-destructive border-destructive/30 bg-destructive/5"
                                  : "text-primary border-primary/30 bg-primary/5"
                              }`}
                            >
                              {isExpired ? "Expired" : "Active"}
                            </Badge>
                          </td>
                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors shrink-0"
                                onClick={() => setEditingBatch(batch)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                                onClick={() => setDeletingBatch(batch)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border/50">
                <Package className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                <p className="font-medium text-foreground">No active batches</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Restock this item to create a tracked batch.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-border/50 shadow-sm bg-card h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" strokeWidth={2.5} />
              Transaction History
            </CardTitle>
            <CardDescription>
              Log of all additions and daily consumptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                Loading history...
              </div>
            ) : transactionsError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-destructive/5 rounded-lg border border-dashed border-destructive/20">
                <AlertCircle className="h-8 w-8 text-destructive mb-3 opacity-70" />
                <p className="font-medium text-foreground">
                  Could not load transactions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineEvents && timelineEvents.length > 0 ? (
                  timelineEvents.map((event, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== timelineEvents.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-[-16px] w-px bg-border/50" />
                      )}
                      
                      {event.type === "add" ? (
                        <div className="flex gap-4 p-2 w-full">
                          <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-primary/10 text-primary z-10">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-foreground flex items-center gap-2">
                                  Restock
                                  {event.data.batchId && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 text-primary border-primary/20">
                                      Batch #{event.data.batchId}
                                    </Badge>
                                  )}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(event.dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium text-primary">
                                  +{event.data.quantity} {item?.unit}
                                </div>
                                {(event.data.price > 0) && (
                                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                                    ${event.data.price.toFixed(2)} / unit
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <ConsumeGroupRow event={event} itemUnit={item?.unit} />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg bg-muted/10">
                    No history recorded for this item.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Batch Edit Dialog ── */}
      {editingBatch && (
        <BatchEditDialog
          batch={editingBatch}
          restId={restId}
          itemId={id}
          open={!!editingBatch}
          onClose={() => setEditingBatch(null)}
          token={token}
          shelfLife={item?.shelfLife}
        />
      )}

      {/* ── Batch Delete Confirmation ── */}
      <AlertDialog
        open={!!deletingBatch}
        onOpenChange={(v) => !v && setDeletingBatch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Batch #{deletingBatch?.batchId}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the batch and its{" "}
              <span className="font-semibold">
                {deletingBatch?.quantity} {item?.unit}
              </span>{" "}
              from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteBatchMutation.mutate(deletingBatch?.batchId)
              }
              disabled={deleteBatchMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteBatchMutation.isPending && (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              )}
              Delete Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
