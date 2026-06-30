import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, AlertCircle, Clock, Pencil, Trash2, Package } from "lucide-react";

export function ActiveBatchesTable({ 
  batchesLoading, 
  batchesError, 
  sortedBatches, 
  onEditBatch, 
  onDeleteBatch,
  highlightBatchId
}) {
  return (
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
                      className={`border-b border-border/30 last:border-0 transition-colors group ${
                        highlightBatchId && String(highlightBatchId) === String(batch.batchId)
                          ? isExpired
                            ? "bg-destructive/15 hover:bg-destructive/15 ring-2 ring-destructive/50"
                            : "bg-amber-500/15 hover:bg-amber-500/15 ring-2 ring-amber-500/50"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-muted-foreground">
                          #{batch.batchId ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-semibold text-sm">
                          {batch.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        ${(batch.unitCost ?? 0).toFixed(2)}
                      </td>
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
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors shrink-0"
                            onClick={() => onEditBatch(batch)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                            onClick={() => onDeleteBatch(batch)}
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
  );
}
