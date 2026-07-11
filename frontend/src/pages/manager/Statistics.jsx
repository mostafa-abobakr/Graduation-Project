import React from "react"
import { DollarSign, ShoppingBag, Receipt, PieChart } from "lucide-react"
import { SummaryCard } from "@/components/shared/SummaryCard"
import { useLanguage } from "@/contexts/LanguageContext"

import { formatNumber } from "@/lib/formatNumber"

const Statistics = ({ data }) => {
  const { t, language } = useLanguage()

  if (!data) return null

  const fmt = (v) => formatNumber(v, language === 'ar', {
    notation: "compact",
    maximumFractionDigits: 1,
  })

  const statsData = [
    {
      title: "Total Revenue",
      suffix: "EGP",
      value: data.total_revenue,
      change: data.revenue_change_pct,
      icon: DollarSign,
    },
    {
      title: "Net Profit",
      suffix: "EGP",
      value: data.total_profit,
      change: data.profit_change_pct,
      icon: PieChart,
    },
    {
      title: "Total Orders",
      suffix: "",
      value: data.total_orders,
      change: data.orders_change_pct,
      icon: ShoppingBag,
    },
    {
      title: "Avg Order Value",
      suffix: "EGP",
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
          value={`${fmt(stat.value)}${stat.suffix ? " " + t(stat.suffix) : ""}`}
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
