import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  PieChart,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const chartConfig = {
  revenue: { label: "Revenue", color: "#3b82f6" },
  margin: { label: "Margin", color: "#10b981" },
};

const VIEWS = [
  { id: "day", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All Time" },
];

function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val ?? 0);
}

function formatCompact(val) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(val ?? 0);
}

function formatLabel(timestamp, viewMode) {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp.replace(" ", "T"));
    if (viewMode === "day") {
      return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return timestamp;
  }
}

function ChangePill({ value }) {
  if (!value || value === "N/A" || value === "0.0%") return null;
  const isNeg = value.startsWith("-");
  return (
    <div
      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
        isNeg
          ? "bg-rose-500/10 text-rose-500"
          : "bg-emerald-500/10 text-emerald-500"
      }`}
    >
      {isNeg ? (
        <TrendingDown className="h-3 w-3" strokeWidth={3} />
      ) : (
        <TrendingUp className="h-3 w-3" strokeWidth={3} />
      )}
      {value}
    </div>
  );
}

function MarginBadge({ value }) {
  const cls =
    value >= 70
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : value >= 40
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>
      {value.toFixed(1)}%
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-[400px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}

export default function RevenuePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("day");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["revenueData", user?.restId],
    queryFn: async () => {
      if (!user?.restId) return null;
      const res = await fetch(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/revenue/${user.restId}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch revenue data");
      return res.json();
    },
    enabled: !!user?.restId,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-5">
        <Card className="p-6 bg-card border-border/60 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">Failed to load revenue data</p>
          <p className="text-muted-foreground text-sm">{error?.message || "Something went wrong"}</p>
        </Card>
      </div>
    );
  }

  const currentData = data?.data?.[viewMode];
  const metrics = currentData?.metrics ?? {
    period_revenue: 0,
    daily_average: 0,
    avg_profit_margin: 0,
    revenue_change_pct: "N/A",
  };

  const totalOrders = (currentData?.revenue_trend ?? []).reduce(
    (s, r) => s + (r.order_count ?? 0),
    0
  );

  const trendData = (currentData?.revenue_trend ?? []).map((r) => ({
    label: formatLabel(r.timestamp, viewMode),
    revenue: r.revenue ?? 0,
    orders: r.order_count ?? 0,
  }));

  const itemPerformance = (currentData?.item_performance ?? []).map((item) => ({
    name: item.item_name,
    revenue: item.revenue ?? 0,
    profit: item.profit ?? 0,
    margin: item.margin_percentage ?? 0,
    orders: item.orders ?? 0,
  }));

  const viewIdx = VIEWS.findIndex((v) => v.id === viewMode);

  return (
    <div className="space-y-5 animate-fade-in py-5">

      {/* ── Header + Toggle ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
            <p className="text-muted-foreground text-sm">Revenue trends and profit analysis</p>
          </div>
        </div>

        {/* Animated glider toggle */}
        <div className="relative flex bg-muted/60 p-1.5 rounded-xl w-full sm:w-[380px] shadow-inner border border-border/40 shrink-0">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-background rounded-lg shadow transition-transform duration-300 ease-out"
            style={{ transform: `translateX(calc(${viewIdx * 100}%))` }}
          />
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              aria-pressed={viewMode === v.id}
              className={`relative z-10 flex-1 py-1.5 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
                viewMode === v.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Revenue */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all p-4 flex flex-col justify-center relative group duration-300 hover:bg-muted/30 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {VIEWS.find((v) => v.id === viewMode)?.label} Revenue
            </h2>
            <div className="p-1.5 bg-primary/10 rounded-full text-primary shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 mt-auto">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {formatCompact(metrics.period_revenue)}
            </span>
            <ChangePill value={metrics.revenue_change_pct} />
          </div>
        </Card>

        {/* Daily Average */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all p-4 flex flex-col justify-center relative group duration-300 hover:bg-muted/30 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Daily Average</h2>
            <div className="p-1.5 bg-primary/10 rounded-full text-primary shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {formatCompact(metrics.daily_average)}
            </span>
          </div>
        </Card>

        {/* Avg Profit Margin */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all p-4 flex flex-col justify-center relative group duration-300 hover:bg-muted/30 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Avg. Profit Margin</h2>
            <div className="p-1.5 bg-primary/10 rounded-full text-primary shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-primary">
              {(metrics.avg_profit_margin ?? 0).toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all p-4 flex flex-col justify-center relative group duration-300 hover:bg-muted/30 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Total Orders</h2>
            <div className="p-1.5 bg-primary/10 rounded-full text-primary shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(totalOrders)}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Revenue Trend Chart ─────────────────────────────────── */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-bold text-foreground">
              Revenue Trend — {VIEWS.find((v) => v.id === viewMode)?.label}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {trendData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No trend data available for this period.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--muted))", strokeWidth: 2, strokeDasharray: "4 4" }}
                  content={
                    <ChartTooltipContent
                      className="bg-popover/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border/50"
                      formatter={(value, name, item) => (
                        <>
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          <div className="flex flex-1 justify-between gap-5 items-center leading-none">
                            <span className="text-sm font-medium text-foreground capitalize">{name}</span>
                            <span className="text-sm font-bold text-foreground">
                              {name === "Revenue" ? formatCurrency(value) : value}
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
                  fill="url(#revGrad)"
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Item Charts ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Revenue by Item */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Revenue by Item</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {itemPerformance.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                No data available for this period.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={itemPerformance}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(v) => formatCompact(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    content={
                      <ChartTooltipContent
                        className="bg-popover/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-border/50"
                        formatter={(value, name) => (
                          <>
                            <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            <div className="flex flex-1 justify-between gap-4 items-center">
                              <span className="text-sm font-medium text-foreground">Revenue</span>
                              <span className="text-sm font-bold text-foreground">{formatCurrency(value)}</span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]}>
                    {itemPerformance.map((_, i) => (
                      <Cell key={i} fillOpacity={0.85 - i * 0.04} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Profit Margin by Item */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Profit Margin by Item</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {itemPerformance.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                No data available for this period.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={itemPerformance}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    content={
                      <ChartTooltipContent
                        className="bg-popover/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-border/50"
                        formatter={(value) => (
                          <>
                            <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                            <div className="flex flex-1 justify-between gap-4 items-center">
                              <span className="text-sm font-medium text-foreground">Margin</span>
                              <span className="text-sm font-bold text-foreground">{Number(value).toFixed(1)}%</span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                    {itemPerformance.map((item, i) => (
                      <Cell
                        key={i}
                        fill={
                          item.margin >= 70
                            ? "#10b981"
                            : item.margin >= 40
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
