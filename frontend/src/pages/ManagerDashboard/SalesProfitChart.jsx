import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 rounded-lg shadow-xl border border-border animate-in fade-in zoom-in duration-200">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#2F80ED]">
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm font-bold text-[#70ae95]">
            Profit: ${payload[1].value.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const SalesProfitDashboard = ({ data }) => {
  if (!data) return null;
  const [viewMode, setViewMode] = useState("today");

  const getChartData = () => {
    switch (viewMode) {
      case "today":
        return data.hourly;
      case "week":
        return data.weekly;
      case "month":
        return data.monthly;
      default:
        return data.hourly;
    }
  };

  const currentData = getChartData();
  const revenueColor = "#2F80ED";
  const profitColor = "#70ae95";

  return (
    <Card className="lg:col-span-2 bg-card border-border/60 premium-shadow">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6">
        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
          Sales & Profit Trend
        </CardTitle>

        {/* Animated Segmented Picker (Glider) */}
        <div className="relative flex bg-muted p-1 rounded-lg w-full sm:w-[300px] h-10">
          <div
            className="absolute top-1 left-1 bottom-1 w-[calc(33.33%-4px)] bg-primary rounded-md shadow-sm transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${viewMode === "today" ? "0%" : viewMode === "week" ? "100%" : "200%"})`,
            }}
          />
          {["today", "week", "month"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`relative z-10 flex-1 text-xs font-medium capitalize transition-colors duration-200 ${
                viewMode === mode
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Legend */}
        <div className="flex gap-4 mb-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#2F80ED]" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#70ae95]" />
            <span>Profit</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={revenueColor}
                    stopOpacity={0.2}
                  />
                  <stop offset="95%" stopColor={revenueColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={profitColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={profitColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={revenueColor}
                strokeWidth={2.5}
                fill="url(#colorRev)"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke={profitColor}
                strokeWidth={2.5}
                fill="url(#colorProf)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesProfitDashboard;
