import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventoryItems } from "@/lib/mockData";
import { Package, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

const statusConfig = {
  good:     { label: "In Stock",  class: "bg-primary/15 text-primary border-0" },
  low:      { label: "Low Stock", class: "bg-warning/15 text-warning border-0" },
  critical: { label: "Critical",  class: "bg-destructive/15 text-destructive border-0" },
};

export default function InventoryPage() {
  const critical = inventoryItems.filter((i) => i.status === "critical").length;
  const low = inventoryItems.filter((i) => i.status === "low").length;

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Tracking</h1>
          <p className="text-muted-foreground text-sm">Monitor stock levels and reorder alerts</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{inventoryItems.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Critical Items</span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="stat-number text-destructive">{critical}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Low Stock</span>
            <TrendingDown className="h-4 w-4 text-warning" />
          </div>
          <div className="stat-number text-warning">{low}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">In Stock</span>
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="stat-number text-primary">{inventoryItems.length - critical - low}</div>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Item</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stock</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Reorder Level</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Cost/unit</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Supplier</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                  <td className="py-3 px-4 text-right text-foreground font-mono">{item.stock} {item.unit}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground font-mono">{item.reorderLevel} {item.unit}</td>
                  <td className="py-3 px-4 text-right text-foreground">${item.cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{item.supplier}</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className={statusConfig[item.status].class}>
                      {statusConfig[item.status].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
