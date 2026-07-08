import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { useQueryClient } from "@tanstack/react-query";
import { 
  useInventoryItems, 
  useBatchDetails, 
  useItemTransactions, 
  useDeleteBatch, 
  useUpdateBatch 
} from "@/hooks/useInventory";
import { toast } from "sonner";

import { BatchEditDialog } from "./BatchEditDialog";
import { AvailableQuantity } from "./AvailableQuantity";
import { StockHealth } from "./StockHealth";
import { ActiveBatchesTable } from "./ActiveBatchesTable";
import { TransactionHistory } from "./TransactionHistory";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const restId = user?.restId;
  const token = user?.token;
  
  const highlightBatchIdFromState = location.state?.highlightBatchId;
  const [activeHighlightBatchId, setActiveHighlightBatchId] = useState(null);

  React.useEffect(() => {
    if (highlightBatchIdFromState) {
      setActiveHighlightBatchId(highlightBatchIdFromState);
      const timer = setTimeout(() => {
        setActiveHighlightBatchId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightBatchIdFromState]);

  const [editingBatch, setEditingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);

  const queryClient = useQueryClient();

  const deleteBatchMutation = useDeleteBatch();

  const handleDeleteBatch = () => {
    if (!deletingBatch) return;
    deleteBatchMutation.mutate(
      { restId, batchId: deletingBatch.batchId },
      {
        onSettled: () => setDeletingBatch(null)
      }
    );
  };

  const { data: items = [], isLoading: itemsLoading } = useInventoryItems(restId);
  const { data: batchData, isLoading: batchesLoading, isError: batchesError } = useBatchDetails(restId, id);
  const { data: transactions = [], isLoading: transactionsLoading, isError: transactionsError } = useItemTransactions(restId, id);

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
        <Button variant="outline" onClick={() => navigate("/dashboard/inventory/stock")}>
          Back to Inventory
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/inventory/stock")}
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
        <AvailableQuantity 
          totalQuantity={totalQuantity} 
          unit={item.unit} 
          batchesCount={batches.length} 
        />
        <StockHealth 
          totalQuantity={totalQuantity} 
          reorderLevel={item.reorderLevel} 
          unit={item.unit} 
        />
      </div>

      {/* ── Bottom Grid: Batches + History ── */}
      <div className="flex flex-col gap-6">
        <ActiveBatchesTable 
          batchesLoading={batchesLoading} 
          batchesError={batchesError} 
          sortedBatches={sortedBatches} 
          onEditBatch={setEditingBatch} 
          onDeleteBatch={setDeletingBatch} 
          highlightBatchId={activeHighlightBatchId}
        />
        <TransactionHistory 
          transactionsLoading={transactionsLoading} 
          transactionsError={transactionsError} 
          timelineEvents={timelineEvents} 
          unit={item.unit} 
        />
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
              onClick={handleDeleteBatch}
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
