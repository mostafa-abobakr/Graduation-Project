import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Crosshair } from "lucide-react";

export default function CostAndWasteCard({ data }) {
  if (!data) return null;

  const { costPercentage, vsLastWeek, target } = data;

  const diffFromTarget = costPercentage - target;
  const isIncreasing = vsLastWeek > 0;

  const getProgressColor = () => {
    if (costPercentage <= target) return "bg-emerald-500";
    if (costPercentage <= target + 5) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <Card className="flex flex-col col-span-1 border-border/40 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md justify-center">
      <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            Cost Reduction
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 lg:p-6 pt-2 lg:pt-4 flex-1 flex flex-col justify-between">
        <div className="flex items-end justify-between gap-3 mb-4 lg:mb-6">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Current</span>
            <span className="text-3xl lg:text-4xl font-black text-foreground tracking-tighter">
              {costPercentage}%
            </span>
          </div>

          <Badge
            variant="outline"
            className={`flex items-center gap-1 font-bold py-1.5 px-3 rounded-full shadow-sm border-0 ${
              isIncreasing
                ? "bg-rose-500/10 text-rose-500"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {isIncreasing ? (
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
            )}
            {Math.abs(vsLastWeek)}% vs last week
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
            <Progress
              value={costPercentage}
              className="h-3 bg-muted rounded-full overflow-hidden"
              indicatorClassName={`${getProgressColor()} rounded-full transition-all duration-500`}
            />
          </div>

          <div className="flex justify-between items-center text-sm p-4 bg-muted/40 rounded-xl border border-border/40">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Crosshair className="w-4 h-4 text-primary" />
              <span>Target: {target}%</span>
            </div>

            <span
              className={`font-bold ${
                diffFromTarget > 0 ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {diffFromTarget > 0
                ? `+${diffFromTarget}% over`
                : `${Math.abs(diffFromTarget)}% under`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
