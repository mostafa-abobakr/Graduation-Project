import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRevenueData } from "@/hooks/useRevenue";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewToggler } from "@/components/shared/ViewToggler";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { LoadingSkeleton } from "@/components/shared/Skeletons";
import { useLanguage } from "@/contexts/LanguageContext";

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

function formatLabel(timestamp, viewMode, language = "en") {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp.replace(" ", "T"));
    if (viewMode === "day") {
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "numeric", hour12: true });
    }
    return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
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
          ? "bg-destructive/15 text-destructive"
          : "bg-success/15 text-success"
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
      ? "bg-success/15 text-success"
      : value >= 40
        ? "bg-warning/15 text-warning"
        : "bg-destructive/15 text-destructive";
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}
    >
      {value.toFixed(1)}%
    </span>
  );
}



export default function RevenuePage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState("day");

  const { data, isPending, isError, error } = useRevenueData(user?.restId);

  if (isPending) {
    return (
      <div className="space-y-5 animate-fade-in py-5">
        <PageHeader
          icon={DollarSign}
          title={t("Revenue Analytics")}
          description={t("Revenue trends and profit analysis")}
          actions={
            <ViewToggler
              viewMode={viewMode}
              setViewMode={setViewMode}
              modes={VIEWS.map((v) => v.id)}
              labels={VIEWS.map((v) => t(v.label))}
            />
          }
        />
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-5">
        <Card className="p-6 bg-card border-border/60 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">
            {t("Failed to load revenue data")}
          </p>
          <p className="text-muted-foreground text-sm">
            {error?.message || t("Something went wrong")}
          </p>
        </Card>
      </div>
    )
  }

  const currentData = data?.data?.[viewMode]
  const metrics = currentData?.metrics ?? {
    period_revenue: 0,
    daily_average: 0,
    avg_profit_margin: 0,
    revenue_change_pct: "N/A",
  }

  const totalOrders = (currentData?.revenue_trend ?? []).reduce(
    (s, r) => s + (r.order_count ?? 0),
    0
  )

  const trendData = (currentData?.revenue_trend ?? []).map((r) => ({
    label: formatLabel(r.timestamp, viewMode, language),
    revenue: r.revenue ?? 0,
    orders: r.order_count ?? 0,
  }))

  const itemPerformance = (currentData?.item_performance ?? []).map((item) => ({
    name: item.item_name,
    revenue: item.revenue ?? 0,
    profit: item.profit ?? 0,
    margin: item.margin_percentage ?? 0,
    orders: item.orders ?? 0,
  }))

  const viewIdx = VIEWS.findIndex((v) => v.id === viewMode)

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* ── Header + Toggle ─────────────────────────────────────── */}
      <PageHeader
        icon={DollarSign}
        title={t("Revenue Analytics")}
        description={t("Revenue trends and profit analysis")}
        actions={
          <ViewToggler
            viewMode={viewMode}
            setViewMode={setViewMode}
            modes={VIEWS.map((v) => v.id)}
            labels={VIEWS.map((v) => t(v.label))}
          />
        }
      />

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title={`${t(VIEWS.find((v) => v.id === viewMode)?.label)} ${t("Revenue")}`}
          value={formatCompact(metrics.period_revenue)}
          icon={DollarSign}
          iconColorClass="text-primary"
          iconWrapper
          trend={
            metrics.revenue_change_pct !== "N/A"
              ? metrics.revenue_change_pct
              : undefined
          }
        />
        <SummaryCard
          title={t("Daily Average")}
          value={formatCompact(metrics.daily_average)}
          icon={BarChart3}
          iconColorClass="text-primary"
          iconWrapper
        />
        <SummaryCard
          title={t("Avg. Profit Margin")}
          value={`${(metrics.avg_profit_margin ?? 0).toFixed(1)}%`}
          icon={PieChart}
          iconColorClass="text-primary"
          iconWrapper
          valueColorClass="text-primary"
        />
        <SummaryCard
          title={t("Total Orders")}
          value={Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(totalOrders)}
          icon={ShoppingBag}
          iconColorClass="text-primary"
          iconWrapper
        />
      </div>

      {/* ── Revenue Trend Chart ─────────────────────────────────── */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-bold text-foreground">
              {t("Revenue Trend")} — {t(VIEWS.find((v) => v.id === viewMode)?.label)}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {trendData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              {t("No trend data available for this period.")}
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
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
                  minTickGap={30}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <ChartTooltip
                  cursor={{
                    stroke: "hsl(var(--muted))",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                  content={
                    <ChartTooltipContent
                      className="bg-popover/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border/50"
                      formatter={(value, name, item) => (
                        <>
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex flex-1 justify-between gap-5 items-center leading-none">
                            <span className="text-sm font-medium text-foreground capitalize">
                              {name}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {name === "Revenue"
                                ? formatCurrency(value)
                                : value}
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
            <CardTitle className="text-base font-semibold text-foreground">
              {t("Revenue by Item")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {itemPerformance.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {t("No data available for this period.")}
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={itemPerformance}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="4 4"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickFormatter={(v) => formatCompact(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
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
                              <span className="text-sm font-medium text-foreground">
                                {t("Revenue")}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[0, 4, 4, 0]}
                  >
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
            <CardTitle className="text-base font-semibold text-foreground">
              {t("Profit Margin by Item")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {itemPerformance.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {t("No data available for this period.")}
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={itemPerformance}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="4 4"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
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
                              <span className="text-sm font-medium text-foreground">
                                {t("Margin")}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {Number(value).toFixed(1)}%
                              </span>
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
                            ? "hsl(var(--success))"
                            : item.margin >= 40
                              ? "hsl(var(--warning))"
                              : "hsl(var(--destructive))"
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
