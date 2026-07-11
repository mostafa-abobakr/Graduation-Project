import React from "react";
import { Card } from "@/components/ui/card";
import { Wallet, Crosshair } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatNumber } from "@/lib/formatNumber";

export default function CostReduction({ data }) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const { costPercentage, vsLastWeek, target } = data;

  const diffFromTarget = costPercentage - target;

  return (
    <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all flex flex-col justify-center p-4 relative duration-300 hover:bg-muted/30 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-sm lg:text-base font-semibold text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {t("Cost Reduction")}
        </h2>
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary shrink-0">
          <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-black text-foreground my-2">
        {formatNumber(costPercentage, language === 'ar')}%
      </div>

      <div className="flex justify-between items-center text-xs p-2 sm:p-2.5 bg-muted/70 rounded-lg border border-border/40">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Crosshair className="w-3 h-3 text-primary" />
          <span>
            {t("Target")}: {formatNumber(target, language === 'ar')}%
          </span>
        </div>

        <span
          className={`font-bold ${
            diffFromTarget > 0 ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {diffFromTarget > 0
            ? `+${formatNumber(diffFromTarget, language === 'ar')}% ${t("over")}`
            : `${formatNumber(Math.abs(diffFromTarget), language === 'ar')}% ${t("under")}`}
        </span>
      </div>
    </Card>
  );
}
