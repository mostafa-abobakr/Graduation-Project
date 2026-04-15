import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, ShoppingBag } from "lucide-react";

export default function ForecastSummaryCards({ data, alignment, isLoading }) {
  const statistics = [
    {
      name: "Total Revenue",
      value: data?.total_revenue?.toFixed(0) || 0,
      change: data?.revenue_change_pct || "+0%",
      icon: DollarSign,
    },
    {
      name: "Total Profit",
      value: data?.total_profit?.toFixed(0) || 0,
      change: data?.profit_change_pct || "+0%",
      icon: TrendingUp,
    },
    {
      name: "Orders",
      value: data?.total_orders || 0,
      change: data?.orders_change_pct || "+0%",
      icon: ShoppingBag,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {statistics.map((stat) => {
        const Icon = stat.icon;
        const displayValue =
          stat.name !== "Orders" && stat.value >= 1000
            ? `$${(stat.value / 1000).toFixed(1)}K`
            : stat.name !== "Orders"
              ? `$${stat.value}`
              : stat.value;
        const isPositive = String(stat.change).startsWith("+");
        return (
          <Card key={stat.name} className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="stat-number text-foreground">{displayValue}</p>
            <p className="text-xs mt-1">
              <span className={isPositive ? "text-primary" : "text-destructive"}>
                {stat.change}
              </span>
              <span className="text-muted-foreground ml-1">
                {alignment === "day" ? "vs yesterday" : "vs last week"}
              </span>
            </p>
          </Card>
        );
      })}
    </div>
  );
}
