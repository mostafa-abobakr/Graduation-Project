import React from "react";
import { Card } from "@/components/ui/card";
import { Wallet, Crosshair } from "lucide-react";

export default function CostReduction({ data }) {
  if (!data) return null;

  const { costPercentage, vsLastWeek, target } = data;

  const diffFromTarget = costPercentage - target;
  // const isIncreasing = vsLastWeek > 0;

  // const getProgressColor = () => {
  //   if (costPercentage <= target) return "bg-emerald-500";
  //   if (costPercentage <= target + 5) return "bg-amber-500";
  //   return "bg-rose-500";
  // };

  return (
    <Card className="bg-card border-border/60 premium-shadow overflow-hidden transition-all flex flex-col justify-center p-4 relative duration-300 hover:bg-muted/30 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-sm lg:text-base font-semibold text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          Cost Reduction
        </h2>
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary shrink-0">
          <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-black text-foreground my-2">
        {costPercentage}%
      </div>

      <div className="flex justify-between items-center text-xs p-2 sm:p-2.5 bg-muted/70 rounded-lg border border-border/40">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Crosshair className="w-3 h-3 text-primary" />
            <span>Target: {target}%</span>
          </div>

          <span
            className={`font-bold ${
              diffFromTarget > 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {diffFromTarget > 0
              ? `+${diffFromTarget}% over`
              : `${Math.abs(diffFromTarget)}% under`}
          </span>
        </div>
    </Card>
  );
}
