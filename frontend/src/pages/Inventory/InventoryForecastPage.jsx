import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, PackageSearch, TrendingDown } from "lucide-react";

const shortageData = [
  { inventory_id: 1230, item_name: "Burger Bun", required: 2022, in_stock: 1050.7, shortage: 971.3 },
  { inventory_id: 1229, item_name: "Minced Meat", required: 404.4, in_stock: 110, shortage: 294.4 },
  { inventory_id: 1221, item_name: "Main Raw Ingredient", required: 397.5, in_stock: 173.65, shortage: 223.85 },
  { inventory_id: 1222, item_name: "Base Garnish", required: 79.5, in_stock: 259.05, shortage: 0 },
  { inventory_id: 1223, item_name: "Packaging Box", required: 1590, in_stock: 1647.4, shortage: 0 },
];

const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function InventoryForecastPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const enriched = useMemo(
    () =>
      shortageData.map((r) => {
        const coverage = r.required > 0 ? Math.min(100, (r.in_stock / r.required) * 100) : 100;
        const isShort = r.shortage > 0;
        return { ...r, coverage, isShort };
      }),
    [],
  );

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      const matchesSearch = r.item_name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ? true : filter === "shortage" ? r.isShort : !r.isShort;
      return matchesSearch && matchesFilter;
    });
  }, [enriched, search, filter]);

  const shortageCount = enriched.filter((r) => r.isShort).length;
  const sufficientCount = enriched.length - shortageCount;
  const totalShortage = enriched.reduce((s, r) => s + r.shortage, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Forecast</h1>
        <p className="text-muted-foreground">Required vs in-stock comparison across inventory items</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Tracked Items</span>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{enriched.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Items Short</span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="stat-number text-destructive">{shortageCount}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Sufficient</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="stat-number text-primary">{sufficientCount}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Shortage</span>
            <TrendingDown className="h-4 w-4 text-warning" />
          </div>
          <div className="stat-number text-warning">{fmt(totalShortage)}</div>
        </Card>
      </div>

      {shortageCount > 0 && (
        <Card className="p-4 bg-destructive/10 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Restock required</div>
              <div className="text-sm text-muted-foreground">
                {shortageCount} item{shortageCount > 1 ? "s are" : " is"} below the required quantity. Reorder soon to
                avoid service disruption.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="shortage">Shortage</TabsTrigger>
            <TabsTrigger value="ok">Sufficient</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Item</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Required</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">In Stock</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Shortage</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium w-[200px]">Coverage</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.inventory_id}
                  className={`border-b border-border/30 transition-colors ${
                    r.isShort ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/20"
                  }`}
                >
                  <td className="py-3 px-4 text-muted-foreground mono">#{r.inventory_id}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{r.item_name}</td>
                  <td className="py-3 px-4 text-right text-foreground mono">{fmt(r.required)}</td>
                  <td className="py-3 px-4 text-right text-foreground mono">{fmt(r.in_stock)}</td>
                  <td
                    className={`py-3 px-4 text-right mono font-semibold ${
                      r.isShort ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {r.isShort ? `-${fmt(r.shortage)}` : "0"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.isShort ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${r.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mono w-10 text-right">
                        {Math.round(r.coverage)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {r.isShort ? (
                      <Badge variant="secondary" className="bg-destructive/15 text-destructive border-0">
                        Shortage
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/15 text-primary border-0">
                        Sufficient
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No items match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
