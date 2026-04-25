import React from "react";
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
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventoryItems', user?.restId],
    queryFn: async () => {
      const response = await axios.get(`https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}`);
      return response.data.map((item) => ({
        id: item.inventoryID,
        name: item.itemName,
        category: item.category || "Other",
        quantity: item.stock,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        cost: item.costPerUnit || 0,
        expiryDate: item.expiryDate,
        supplier: item.supplier || "Unknown",
        apiStatus: item.status,
      }));
    },
    enabled: !!user?.restId,
  });

  const item = items.find((i) => String(i.id) === String(id));

  const sortedBatches = (item?.batches || []).slice().sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });
  
  const rootQuantity = item?.batches ? item.batches.reduce((sum, b) => sum + (b.quantity || 0), 0) : item?.quantity;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground">
          Item not found
        </h2>
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 animate-fade-in">
      {/* Header */}
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
              {item.name || item.itemName}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card 1: Available Quantity */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Available Quantity
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-foreground">
                    {rootQuantity}
                  </span>
                  <span className="text-lg text-muted-foreground font-medium">
                    {item.unit}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Stock Health */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Stock Health
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {rootQuantity <= item.reorderLevel ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      Critical Stock
                    </Badge>
                  ) : rootQuantity <= item.reorderLevel * 1.5 ? (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-sm py-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm py-1">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      Optimal Stock
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Reorder threshold: <span className="font-mono">{item.reorderLevel} {item.unit}</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl flex items-center justify-center ${
                rootQuantity <= item.reorderLevel ? "bg-destructive/10" :
                rootQuantity <= item.reorderLevel * 1.5 ? "bg-warning/10" :
                "bg-primary/10"
              }`}>
                {rootQuantity <= item.reorderLevel ? (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                ) : rootQuantity <= item.reorderLevel * 1.5 ? (
                  <AlertCircle className="h-6 w-6 text-warning" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Batches */}
        <Card className="border-border/50 shadow-sm bg-card h-full -mb-px">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Active Batches
              </CardTitle>
              <CardDescription>Tracked supply batches sorted by closest expiry date.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {sortedBatches.length > 0 ? (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Batch ID</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Expiry</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBatches.map((batch, idx) => {
                      const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date();
                      return (
                        <tr key={batch.batchId || idx} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            {batch.batchId?.toUpperCase() || `BATCH-${idx+1}`}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-semibold">{batch.quantity}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className={isExpired ? 'text-destructive border-destructive/30 bg-destructive/5' : 'text-primary border-primary/30 bg-primary/5'}>
                              {isExpired ? 'Expired' : 'Active'}
                            </Badge>
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
                <p className="text-sm text-muted-foreground mt-1">Restock this item to create a tracked batch.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Transaction History */}
        <Card className="border-border/50 shadow-sm bg-card h-full -mb-px">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Log of all additions, usages, and waste for this item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {item.history && item.history.length > 0 ? (
                item.history.map((log, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== item.history.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-border/50" />
                    )}
                    <div
                      className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center relative z-10 ${
                        log.type === "add"
                          ? "bg-primary/10 text-primary"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {log.type === "add" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">
                            {log.type === "add"
                              ? "Stock Added"
                              : "Stock Used"}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {log.date}
                          </div>
                        </div>
                        <div
                          className={`font-mono font-medium ${log.type === "add" ? "text-primary" : "text-warning"}`}
                        >
                          {log.type === "add" ? "+" : "-"}
                          {log.amount} {item.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg bg-muted/10">
                  No history recorded for this item.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
