import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggler } from "@/components/shared/ViewToggler";
import {
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SummaryCard } from "@/components/shared/SummaryCard";

const fmt = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function InventoryForecastPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventoryForecast", user?.restId],
    queryFn: async () => {
      const res = await fetch(
        `/InventoryForecast/restaurant/${user.restId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch inventory forecast");
      return res.json();
    },
    enabled: !!user?.restId,
  });

  const enriched = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((r) => ({
      ...r,
      isShort: r.status === "Shortage",
      shortage: Math.abs(r.shortage || 0),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      const matchesSearch = r.itemName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "shortage"
            ? r.isShort
            : !r.isShort;
      return matchesSearch && matchesFilter;
    });
  }, [enriched, search, filter]);

  const shortageCount = data?.itemsShort ?? enriched.filter((r) => r.isShort).length;
  const sufficientCount = data?.sufficient ?? (enriched.length - shortageCount);
  const totalShortage = data?.totalShortage ?? enriched.reduce((s, r) => s + r.shortage, 0);

  if (error) {
    return (
      <div className="space-y-5 py-5 animate-fade-in">
        <PageHeader
          icon={AlertTriangle}
          title="Inventory Forecast"
          description="Required vs in-stock comparison across inventory items"
        />
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 mt-5">
          <h3 className="font-bold text-lg mb-2">Error Loading Forecast</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <PageHeader
        icon={AlertTriangle}
        title="Inventory Forecast"
        description="Required vs in-stock comparison across inventory items"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard
          title="Tracked Items"
          icon={PackageSearch}
          value={isLoading ? "-" : enriched.length}
        />
        <SummaryCard
          title="Items Short"
          icon={AlertTriangle}
          iconColorClass="text-destructive"
          valueColorClass="text-destructive"
          value={isLoading ? "-" : shortageCount}
        />
        <SummaryCard
          title="Sufficient"
          icon={CheckCircle2}
          iconColorClass="text-primary"
          valueColorClass="text-primary"
          value={isLoading ? "-" : sufficientCount}
        />
        <SummaryCard
          title="Total Shortage"
          icon={TrendingDown}
          iconColorClass="text-warning"
          valueColorClass="text-warning"
          value={isLoading ? "-" : fmt(totalShortage)}
        />
      </div>

      {shortageCount > 0 && !isLoading && (
        <Card className="p-4 bg-destructive/10 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">
                Restock required
              </div>
              <div className="text-sm text-muted-foreground">
                {shortageCount} item{shortageCount > 1 ? "s are" : " is"} below
                the required quantity. Reorder soon to avoid service disruption.
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
        <ViewToggler
          viewMode={filter}
          setViewMode={setFilter}
          modes={["all", "shortage", "ok"]}
          labels={["All", "Shortage", "Sufficient"]}
        />
      </div>

      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  ID
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  Item
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Required
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  In Stock
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Shortage
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium w-[200px]">
                  Coverage
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="flex-1 h-1.5 rounded-full" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      searchQuery={search}
                      searchItemName="items"
                      onAction={() => setSearch("")}
                      icon={PackageSearch}
                      title="No items found"
                      description="No items match your filters."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.inventoryID}
                    className={`border-b border-border/30 transition-colors ${
                      r.isShort
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="py-3 px-4 text-muted-foreground mono">
                      #{r.inventoryID}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {r.itemName}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground mono">
                      {fmt(r.required)}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground mono">
                      {fmt(r.inStock)}
                    </td>
                    <td
                      className={`py-3 px-4 text-center mono font-semibold ${
                        r.isShort ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {r.isShort ? `${fmt(r.shortage)}` : "0"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.isShort ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${r.coveragePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mono w-10 text-right">
                          {Math.round(r.coveragePercentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.isShort ? (
                        <Badge
                          variant="secondary"
                          className="bg-destructive/15 text-destructive border-0"
                        >
                          Shortage
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-primary/15 text-primary border-0"
                        >
                          Sufficient
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
