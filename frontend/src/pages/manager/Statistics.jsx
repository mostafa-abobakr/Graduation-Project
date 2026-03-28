import React from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Receipt,
  PieChart,
} from "lucide-react";

const Statistics = ({ data }) => {
  if (!data) return null;

  const statsData = [
    {
      title: "Total Revenue",
      prefix: "$",
      value: data.total_revenue,
      change: data.revenue_change_pct,
      isPositive: data.revenue_change_pct?.startsWith("+"),
      icon: DollarSign,
    },
    {
      title: "Net Profit",
      prefix: "$",
      value: data.total_profit,
      change: data.profit_change_pct,
      isPositive: data.profit_change_pct?.startsWith("+"),
      icon: PieChart,
    },
    {
      title: "Total Orders",
      prefix: "",
      value: data.total_orders,
      change: data.orders_change_pct,
      isPositive: data.orders_change_pct?.startsWith("+"),
      icon: ShoppingBag,
    },
    {
      title: "Avg Order Value",
      prefix: "$",
      value: data.avg_order_value,
      change: data.avg_order_value_change_pct,
      isPositive: data.avg_order_value_change_pct?.startsWith("+"),
      icon: Receipt,
    },
  ];

  return (
    <>
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="bg-card border-border/60 premium-shadow overflow-hidden transition-all p-4 flex flex-col justify-center relative group duration-300 hover:bg-muted/30 h-full"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-sm lg:text-base font-semibold text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {stat.title}
              </h2>
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-auto">
              <span className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                {stat.prefix}{Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(stat.value)}
              </span>

              {stat.change && (
                <div
                  className={`flex items-center text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0 ${
                    stat.isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1"
                      strokeWidth={3}
                    />
                  ) : (
                    <TrendingDown
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1"
                      strokeWidth={3}
                    />
                  )}
                  {stat.change}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
};

export default Statistics;
