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
      value: data.total_revenue.toFixed(0),
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Net Profit",
      value: data.total_profit.toFixed(0),
      change: "+8.2%",
      isPositive: true,
      icon: PieChart,
    },
    {
      title: "Total Orders",
      value: data.total_orders,
      change: "-3.1%",
      isPositive: false,
      icon: ShoppingBag,
    },
    {
      title: "Avg Order Value",
      value: data.avg_order_value.toFixed(2),
      change: "+5.4%",
      isPositive: true,
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
                ${stat.value}
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
