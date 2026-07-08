import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, ShoppingBag } from "lucide-react"
import { SummaryCard } from "@/components/shared/SummaryCard"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ForecastSummaryCards({ data, alignment, isLoading }) {
  const { t } = useLanguage()
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
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:justify-center sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statistics.map((stat) => {
        const displayValue =
          stat.name !== "Orders" && stat.value >= 1000
            ? `$${(stat.value / 1000).toFixed(1)}K`
            : stat.name !== "Orders"
              ? `$${stat.value}`
              : stat.value

        return (
          <SummaryCard
            key={stat.name}
            title={t(stat.name)}
            value={displayValue}
            icon={stat.icon}
            iconColorClass="text-primary"
            iconWrapper
            trend={stat.change}
            trendSub={
              <span className="text-muted-foreground">
                {alignment === "day" ? t("vs yesterday") : t("vs last week")}
              </span>
            }
          />
        )
      })}
    </div>
  )
}
