import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, ShieldCheck, TrendingDown } from "lucide-react";

export function StockHealth({ totalQuantity, reorderLevel, unit }) {
  const isCritical = totalQuantity <= reorderLevel;
  const isLow = !isCritical && totalQuantity <= reorderLevel * 1.5;

  return (
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
                {reorderLevel} {unit}
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
  );
}
