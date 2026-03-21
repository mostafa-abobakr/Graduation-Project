import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const Statistics = ({ data }) => {
  if (!data) return null;

  const statsData = [
    {
      title: "Total Revenue",
      value: `$${data.total_revenue.toLocaleString()}`,
      change: "+12%", // Example: can be dynamic
      isPositive: true,
    },
    {
      title: "Net Profit",
      value: `$${data.total_profit.toLocaleString()}`,
      change: "+8%",
      isPositive: true,
    },
    {
      title: "Orders",
      value: data.total_orders.toLocaleString(),
      change: "-3%",
      isPositive: false,
    },
    {
      title: "Avg Order Value",
      value: `$${data.avg_order_value.toFixed(2)}`,
      change: "+5%",
      isPositive: true,
    },
  ];

  return (
    <Card className="lg:col-span-2 bg-card border-border/60 premium-shadow">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {statsData.map((stat) => (
          <div
            key={stat.title}
            className="p-6 flex flex-col items-center justify-center text-center group transition-colors hover:bg-muted/10"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {stat.title}
            </h2>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
              </span>

              {/* Optional Trend indicator if you decide to use 'change' */}
              {stat.change && (
                <div
                  className={`flex items-center text-xs font-medium ${
                    stat.isPositive ? "text-primary" : "text-destructive"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Statistics;
