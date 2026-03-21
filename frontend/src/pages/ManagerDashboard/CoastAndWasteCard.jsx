import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CostAndWasteCard({ data }) {
  if (!data) return null;

  const { costPercentage, vsLastWeek, target } = data;

  // ===== Calculations =====
  const diffFromTarget = costPercentage - target;
  const isIncreasing = vsLastWeek > 0;

  // ===== Risk Color Logic for Progress Bar =====
  const getProgressColor = () => {
    // Note: shadcn Progress uses a single color by default.
    // We apply these classes to the indicator inside the component.
    if (costPercentage >= target) return "bg-primary"; // green/theme-primary
    if (costPercentage >= target + 5) return "bg-orange-500";
    return "bg-destructive"; // red
  };

  return (
    <Card className="flex-1 min-h-0 bg-card border-border/60 premium-shadow max-h-[350px] overflow-y-auto">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
          Cost Reduction
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        {/* Main % + Trend */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-foreground">
            {costPercentage}%
          </span>

          <Badge
            variant="outline"
            className={`flex items-center gap-1 font-medium ${
              isIncreasing
                ? "text-primary border-primary/30"
                : "text-destructive border-destructive/30"
            }`}
          >
            {isIncreasing ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(vsLastWeek)}% vs last week
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={costPercentage}
            className="h-2.5 bg-muted"
            // Customizing the internal indicator color based on logic
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* Target Comparison */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Target: {target}%</span>

          <span
            className={`font-semibold ${
              diffFromTarget > 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {diffFromTarget > 0
              ? `+${diffFromTarget}% above target`
              : `${Math.abs(diffFromTarget)}% below target`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
