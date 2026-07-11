import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  TriangleAlert,
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
} from "lucide-react"

import { formatNumber } from "@/lib/formatNumber"

const AlertIcon = ({ type, severity }) => {
  const iconMap = {
    // Business Rule-Based Alerts
    revenue_drop: { Icon: TrendingDown, color: "text-rose-500" },
    revenue_spike: { Icon: TrendingUp, color: "text-emerald-500" },
    cold_item_underperformance: { Icon: Snowflake, color: "text-sky-400" },
    hot_item_underperformance: { Icon: Coffee, color: "text-orange-500" },
    low_margin_high_volume: { Icon: AlertTriangle, color: "text-rose-600" },
    high_margin_low_volume: { Icon: Gem, color: "text-violet-500" },

    // Predictive Forecast Alerts
    item_decrease: { Icon: PackageMinus, color: "text-amber-500" },
    item_surge: { Icon: PackagePlus, color: "text-emerald-500" },
    low_margin_surge: { Icon: BadgeAlert, color: "text-rose-500" },
    high_margin_surge: { Icon: Rocket, color: "text-emerald-600" },
    forecast_revenue_drop: { Icon: TrendingDown, color: "text-rose-500" },
    forecast_revenue_spike: { Icon: TrendingUp, color: "text-emerald-500" },
  }

  const config = iconMap[type]

  // Fallback if an unknown alert type is passed
  if (!config) {
    const FallbackIcon = severity === "warning" ? AlertTriangle : Info
    const defaultColor =
      severity === "warning" ? "text-rose-500" : "text-emerald-500"
    return (
      <FallbackIcon className={`h-4 w-4 ${defaultColor}`} strokeWidth={3} />
    )
  }

  const { Icon, color } = config
  return <Icon className={`h-4 w-4 ${color}`} strokeWidth={3} />
}

const renderAlertMessage = (message, t, language) => {
  const isArabic = language === "ar";

  if (isArabic) {
    const regex = /'(.*?)' Has A High Margin \((.*?)\%\) But Lower Than Average Sales Volume \((.*?) Orders\)\. Consider Featuring This Item To Boost Profit\./i;
    const match = message.match(regex);
    if (match) {
      const [, itemName, margin, orders] = match;
      const localizedMargin = formatNumber(margin, isArabic);
      const localizedOrders = formatNumber(orders, isArabic);
      return `الصنف '${t(itemName)}' يحقق هامش ربح عالي (${localizedMargin}%) ولكن حجم مبيعاته أقل من المتوسط (${localizedOrders} طلبات). ينصح بإبراز هذا الصنف لزيادة الأرباح.`;
    }

    return (
      <div dir="ltr" className="text-left inline-block">
        {t(message)}
      </div>
    );
  }

  return t(message);
};

const Alerts = ({ data }) => {
  const { t, language } = useLanguage()

  if (!data) return null

  return (
    <Card className="flex flex-col h-full bg-card border-border/60 premium-shadow">
      <CardHeader className="p-6 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            {t("Smart Alerts")}
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0 ms-2">
            <TriangleAlert className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-[250px] lg:basis-0 lg:min-h-[150px] flex flex-col">
        {!data?.alerts || data.alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground w-full gap-5 pb-6">
            <div className="h-24 w-24 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center shadow-sm">
              <TriangleAlert
                className="h-12 w-12 text-muted-foreground/60"
                strokeWidth={1.5}
              />
            </div>
            <span className="text-base font-semibold">{t("No alerts for now")}</span>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <ul className="space-y-3 list-none m-0 p-0">
              {data.alerts.map((alert, index) => (
                <li
                  key={alert.link ?? index}
                  className="flex flex-col justify-center p-3 rounded-lg border border-border/50 bg-background shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300"
                >
                  <div className={`flex items-start sm:items-center gap-3 flex-1 min-w-0 ${language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                    <div className="mt-0.5 sm:mt-0 p-1.5 rounded-full shrink-0 shadow-xs border border-border/40 bg-muted/20">
                      <AlertIcon type={alert.type} severity={alert.severity} />
                    </div>
                    <div className="text-xs sm:text-sm text-foreground leading-relaxed w-full">
                      {renderAlertMessage(alert.message, t, language)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default Alerts
