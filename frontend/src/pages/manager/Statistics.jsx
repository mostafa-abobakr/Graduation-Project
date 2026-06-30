import React from "react"
import { DollarSign, ShoppingBag, Receipt, PieChart } from "lucide-react"
import { SummaryCard } from "@/components/shared/SummaryCard"
import { useLanguage } from "@/contexts/LanguageContext"

const Statistics = ({ data }) => {
  const { t } = useLanguage()

  if (!data) return null

  const fmt = (v) =>
    Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v)

  const statsData = [
    {
      title: "Total Revenue",
      prefix: "$",
      value: data.total_revenue,
      change: data.revenue_change_pct,
      icon: DollarSign,
    },
    {
      title: "Net Profit",
      prefix: "$",
      value: data.total_profit,
      change: data.profit_change_pct,
      icon: PieChart,
    },
    {
      title: "Total Orders",
      prefix: "",
      value: data.total_orders,
      change: data.orders_change_pct,
      icon: ShoppingBag,
    },
    {
      title: "Avg Order Value",
      prefix: "$",
      value: data.avg_order_value,
      change: data.avg_order_value_change_pct,
      icon: Receipt,
    },
  ]

  return (
    <>
      {statsData.map((stat) => (
        <SummaryCard
          key={stat.title}
          title={t(stat.title)}
          value={`${stat.prefix}${fmt(stat.value)}`}
          icon={stat.icon}
          iconColorClass="text-primary"
          iconWrapper
          trend={stat.change || undefined}
        />
      ))}
    </>
  )
}

export default Statistics
