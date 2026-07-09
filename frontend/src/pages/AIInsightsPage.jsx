import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/api/axios";
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Snowflake,
  Coffee,
  AlertTriangle,
  Gem,
  PackageMinus,
  PackagePlus,
  BadgeAlert,
  Rocket,
  Info,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewToggler } from "@/components/shared/ViewToggler";
import { SummaryCard } from "@/components/shared/SummaryCard";

// ── Icon map identical to Alerts.jsx so styles stay consistent ──────────────
const iconMap = {
  revenue_drop: { Icon: TrendingDown, color: "text-rose-500" },
  revenue_spike: { Icon: TrendingUp, color: "text-emerald-500" },
  cold_item_underperformance: { Icon: Snowflake, color: "text-sky-400" },
  hot_item_underperformance: { Icon: Coffee, color: "text-orange-500" },
  low_margin_high_volume: { Icon: AlertTriangle, color: "text-rose-600" },
  high_margin_low_volume: { Icon: Gem, color: "text-violet-500" },
  item_decrease: { Icon: PackageMinus, color: "text-amber-500" },
  item_surge: { Icon: PackagePlus, color: "text-emerald-500" },
  low_margin_surge: { Icon: BadgeAlert, color: "text-rose-500" },
  high_margin_surge: { Icon: Rocket, color: "text-emerald-600" },
  forecast_revenue_drop: { Icon: TrendingDown, color: "text-rose-500" },
  forecast_revenue_spike: { Icon: TrendingUp, color: "text-emerald-500" },
};

function AlertIcon({ type, severity }) {
  const config = iconMap[type];
  if (!config) {
    const FallbackIcon = severity === "warning" ? AlertTriangle : Info;
    const color = severity === "warning" ? "text-rose-500" : "text-emerald-500";
    return <FallbackIcon className={`h-4 w-4 ${color}`} strokeWidth={3} />;
  }
  const { Icon, color } = config;
  return <Icon className={`h-4 w-4 ${color}`} strokeWidth={3} />;
}

// ── Severity badge ───────────────────────────────────────────────────────────
const severityStyles = {
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  info: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

// ── Format currency ──────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
  );
}

export default function AIInsightsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("day"); // "day" | "week"
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["forecastAlerts", user?.restId],
    queryFn: async () => {
      try {
        const res = await api.post(
          `https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/alerts/forecast/${user?.restId}`,
          {}
        );
        return res.data;
      } catch (error) {
        throw new Error(`Failed to fetch forecast alerts: ${error.message}`);
      }
    },
    enabled: !!user?.restId,
    staleTime: 5 * 60 * 1000,
  });

  const periodData = data?.[period];
  const alerts = periodData?.alerts ?? [];

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <PageHeader
        icon={Lightbulb}
        title={t("AI Insights")}
        description={t("Forecast Alerts Powered By AI")}
        actions={
          <ViewToggler
            viewMode={period}
            setViewMode={setPeriod}
            modes={["day", "week"]}
            labels={["Tomorrow", "Next Week"]}
          />
        }
      />

      {/* ── Alert list ───────────────────────────────────────────────────── */}
      <Card className="flex flex-col bg-card border-border/60 premium-shadow">
        <CardHeader className="p-5 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">
              {period === "day"
                ? t("Tomorrow's Forecast Alerts")
                : t("Next Week's Forecast Alerts")}
            </CardTitle>
            {!isLoading && !isError && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {alerts.length} {t("alerts")}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-4">
          {isLoading ? (
            <div className="px-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : isError ? null : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
              <div className="h-16 w-16 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
                <Lightbulb
                  className="h-8 w-8 text-muted-foreground/50"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm font-medium">
                {t("No forecast alerts available")}
              </p>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <ul className="space-y-2.5 list-none m-0 p-0 pt-1">
                {alerts.map((alert, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
                  >
                    {/* Icon */}
                    <div className="mt-0.5 p-1.5 rounded-full shrink-0 shadow-xs border border-border/40 bg-muted/20">
                      <AlertIcon type={alert.type} severity={alert.severity} />
                    </div>

                    {/* Message */}
                    <p className="flex-1 text-xs sm:text-sm text-foreground leading-relaxed min-w-0">
                      {t(alert.message)}
                    </p>

                    {/* Severity badge */}
                    <span
                      className={`shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        severityStyles[alert.severity] ?? severityStyles.info
                      }`}
                    >
                      {t(alert.severity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
