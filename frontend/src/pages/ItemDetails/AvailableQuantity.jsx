import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export function AvailableQuantity({ totalQuantity, unit, batchesCount }) {
  return (
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
                {unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across{" "}
              <span className="font-semibold text-foreground">
                {batchesCount}
              </span>{" "}
              active batch{batchesCount !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
