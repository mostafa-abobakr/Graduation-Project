import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Search, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MenuAnalyticsPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("orders");
  const [sortAsc, setSortAsc] = useState(false);
  const [timeframe, setTimeframe] = useState("day");
  const {user}= useAuth();
  // Fetch the data from the ZeroBite AI Engine
  const { data, isLoading, error } = useQuery({
    queryKey: ["menuPerformance", user?.restId],
    queryFn: async () => {
      const res = await fetch(`https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/menu/performance/${user.restId}`, {
        headers: { accept: "application/json" }
      });
      if (!res.ok) throw new Error("Failed to fetch menu analytics");
      const json = await res.json();
      return json.data; 
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract the specific array based on the timeframe (day, week, month, all)
  const currentData = data ? data[timeframe] || [] : [];

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // Filter and sort the data
  const filtered = currentData
    .filter((i) => i.item_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === "item_name") return mult * a.item_name.localeCompare(b.item_name);
      return mult * (a[sortKey] - b[sortKey]);
    });

  const SortIcon = ({ col }) => {
    const isActive = sortKey === col;
    const Icon = isActive && sortAsc ? ArrowUp : ArrowDown;
    return <Icon className={`h-3 w-3 shrink-0 transition-opacity ${isActive ? "opacity-100 text-primary" : "opacity-0"}`} />;
  };

  if (error) {
    return (
      <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
        <h3 className="font-bold text-lg mb-2">Error Loading Analytics</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <PageHeader
        icon={UtensilsCrossed}
        title="Menu Item Performance"
        description="Detailed real-time analytics for every item on your menu."
      />

      {/* Controls Row */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60 premium-shadow"
          />
        </div>

        {/* Animated Segmented Picker (Glider) */}
        <div className="relative flex bg-muted/60 p-1.5 rounded-xl w-full sm:w-[380px] shadow-inner border border-border/40 shrink-0">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-background rounded-lg shadow transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(calc(${
                timeframe === "day" ? "0" : timeframe === "week" ? "100" : timeframe === "month" ? "200" : "300"
              }%))`,
            }}
          />
          {[
            { id: "day", label: "Today" },
            { id: "week", label: "Week" },
            { id: "month", label: "Month" },
            { id: "all", label: "All Time" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTimeframe(mode.id)}
              aria-pressed={timeframe === mode.id}
              className={`relative z-10 flex-1 py-1.5 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
                timeframe === mode.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border/60 bg-muted/40 shadow-sm">
                {[
                  { key: "item_name", label: "Menu Items", align: "left" },
                  { key: "orders", label: "Total Orders", align: "center" },
                  { key: "revenue", label: "Generated Revenue", align: "center" },
                  { key: "profit", label: "Net Profit", align: "center" },
                  { key: "margin_percentage", label: "Profit Margin", align: "center" },
                ].map(({ key, label, align }) => (
                  <th
                    key={key}
                    className={`py-4 px-5 text-muted-foreground font-semibold cursor-pointer hover:text-foreground select-none transition-colors ${
                      align === "left" ? "text-left" : "text-center"
                    }`}
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {label}
                      {key === "item_name" && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none rounded-md px-1.5 py-0 min-w-[1.5rem] items-center justify-center">
                          {filtered.length}
                        </Badge>
                      )}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="py-4 px-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-20 mx-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-20 mx-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      searchQuery={search}
                      searchItemName="menu items"
                      onAction={() => setSearch("")}
                    />
                  </td>
                </tr>
              ) : (
                // Data Rows
                filtered.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-5 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        {item.image_url && item.image_url.startsWith("http") ? (
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="h-10 w-10 rounded-md object-cover border border-border/40"
                          />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-background/50 text-xl border shrink-0">
                            {item.image_url || "🍽️"}
                          </div>
                        )}
                        <span>{item.item_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-medium text-muted-foreground">
                      {item.orders.toLocaleString("en-US")}
                    </td>
                    <td className="py-4 px-5 text-center font-medium text-foreground">
                      {item.revenue.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-4 px-5 text-center font-medium text-emerald-600 dark:text-emerald-500">
                      {item.profit.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.margin_percentage >= 70
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : item.margin_percentage >= 40
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {item.margin_percentage.toFixed(1)}%
                      </span>
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
