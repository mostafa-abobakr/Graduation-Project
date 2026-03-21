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
import { BarChart3 } from "lucide-react";

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border/50 animate-in fade-in zoom-in duration-200">
        <p className="text-xs font-bold text-muted-foreground mb-3">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              <span className="text-sm font-medium text-foreground">Revenue</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              ${payload[0].value.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-sm font-medium text-foreground">Profit</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              ${payload[1].value.toLocaleString()}
            </span>
          </div>
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
  const revenueColor = "#3b82f6"; // Tailwind blue-500
  const profitColor = "#10b981"; // Tailwind emerald-500

  return (
    <Card className="lg:col-span-2 flex flex-col border-border/40 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md transition-all">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground tracking-tight">
            Sales & Profit Trend
          </CardTitle>
        </div>

        {/* Animated Segmented Picker (Glider) */}
        <div className="relative flex bg-muted/60 p-1.5 rounded-xl w-full sm:w-[320px] shadow-inner border border-border/40">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-background rounded-lg shadow transition-transform duration-300 ease-spring"
            style={{
              transform: `translateX(calc(${
                viewMode === "today" ? "0" : viewMode === "week" ? "100" : "200"
              }% + ${viewMode === "today" ? "0px" : viewMode === "week" ? "6px" : "12px"}))`,
            }}
          />
          {["today", "week", "month"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`relative z-10 flex-1 py-1 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
                viewMode === mode
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        {/* Legend */}
        <div className="flex gap-5 mb-6 text-sm font-semibold text-muted-foreground ml-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#3b82f6] shadow-sm shadow-[#3b82f6]/20" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#10b981] shadow-sm shadow-[#10b981]/20" />
            <span>Profit</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={revenueColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={revenueColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={profitColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={profitColor} stopOpacity={0} />
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
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={revenueColor}
                strokeWidth={3}
                fill="url(#colorRev)"
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke={profitColor}
                strokeWidth={3}
                fill="url(#colorProf)"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesProfitDashboard;
