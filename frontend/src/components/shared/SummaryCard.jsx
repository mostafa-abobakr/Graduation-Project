import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SummaryCard({
  title,
  value,
  sub,
  trendSub,
  icon: Icon,
  iconColorClass = "text-muted-foreground",
  iconWrapper = false,
  valueColorClass = "text-foreground",
  valueSizeClass = "stat-number font-bold tracking-tight",
  trend,
  trendIsPositive,
  className,
  children,
}) {
  return (
    <Card
      className={cn(
        "p-4 bg-card border-border/60 premium-shadow flex flex-col justify-center relative",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-muted-foreground line-clamp-1 break-all me-2">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "shrink-0",
              iconWrapper
                ? "p-1.5 sm:p-2 bg-primary/10 rounded-full"
                : "",
              iconWrapper ? "text-primary" : iconColorClass
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                iconWrapper && "text-primary"
              )}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 mt-auto">
        <div className={cn(valueSizeClass, valueColorClass)}>
          {value}
        </div>

        {(trend !== undefined || trendSub) && (
          <div className="flex flex-col items-end gap-0.5">
            {trend !== undefined && typeof trend === "string" && (
              <div
                className={cn(
                  "flex items-center text-[10px] font-bold px-2 mt-4 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0",
                  (trendIsPositive ?? trend.startsWith("+"))
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                )}
              >
                {(trendIsPositive ?? trend.startsWith("+")) ? (
                  <TrendingUp className="h-3 w-3 me-1" strokeWidth={3} />
                ) : (
                  <TrendingDown className="h-3 w-3 me-1" strokeWidth={3} />
                )}
                {trend}
              </div>
            )}

            {trend !== undefined && typeof trend !== "string" && trend}

            {trendSub && (
              <div className="text-[10px] text-muted-foreground/80 font-medium whitespace-nowrap text-end pe-0.5">
                {trendSub}
              </div>
            )}
          </div>
        )}
      </div>

      {sub && (
        <div className="text-xs mt-1.5 text-muted-foreground">{sub}</div>
      )}

      {children}
    </Card>
  );
}
