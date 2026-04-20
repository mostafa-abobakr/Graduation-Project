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
} from "lucide-react";
import { mockInventoryItems } from "../../services/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const item = mockInventoryItems.find((i) => i.id === id);

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
              {item.itemName}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Quick Stats */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Available Quantity
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold font-mono">
                    {item.quantity}
                  </span>
                  <span className="text-lg text-muted-foreground font-medium mb-1">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-muted-foreground">Reorder Level</p>
                  <p className="font-mono text-sm">
                    {item.reorderLevel} {item.unit}
                  </p>
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.quantity <= item.reorderLevel ? "bg-warning" : "bg-primary"}`}
                    style={{
                      width: `${Math.min(100, (item.quantity / (item.reorderLevel * 3)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Expiry Date</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {item.expiryDate}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              >
                Mark as Wasted
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History & Logs */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm bg-card h-full">
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
                  <p className="text-center text-muted-foreground py-8">
                    No history recorded for this item.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
