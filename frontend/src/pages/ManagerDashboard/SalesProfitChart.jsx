import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#3b82f6",
  },
  profit: {
    label: "Profit",
    color: "#10b981",
  },
};



const SalesProfitDashboard = ({ data, viewMode }) => {
  if (!data) return null;

  const getChartData = () => {
    switch (viewMode) {
      case "today":
        return data.hourly || [];
      case "week":
        return data.weekly || [];
      case "month":
        return data.monthly || [];
      default:
        return data.hourly || [];
    }
  };

  const currentData = getChartData();

  return (
    <Card className="lg:col-span-2 flex flex-col bg-card border-border/60 premium-shadow overflow-hidden transition-all">
      <CardHeader className="p-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            Sales & Profit Trend
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        {/* Legend */}
        <div className="flex gap-5 mb-6 text-sm font-semibold text-muted-foreground ml-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500 shadow-sm shadow-blue-500/20" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span>Profit</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full min-h-[300px]">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-full w-full min-h-[300px]"
          >
            <AreaChart
              data={currentData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-profit)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-profit)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                  fontWeight: 500,
                }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                  fontWeight: 500,
                }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency: "USD",
                  }).format(value)
                }
              />
              <ChartTooltip
                cursor={{
                  stroke: "hsl(var(--muted))",
                  strokeWidth: 2,
                  strokeDasharray: "4 4",
                }}
                content={
                  <ChartTooltipContent
                    className="bg-popover/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border/50 animate-in fade-in zoom-in duration-200"
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-1 justify-between gap-6 items-center leading-none">
                          <span className="text-sm font-medium text-foreground capitalize">
                            {name}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            }).format(value)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--color-revenue)"
                strokeWidth={3}
                fill="url(#colorRev)"
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="var(--color-profit)"
                strokeWidth={3}
                fill="url(#colorProf)"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesProfitDashboard;
