import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// Replaced MUI icons with Lucide icons
import { TriangleAlert, ChevronRight ,TrendingUp,
  TrendingDown,} from "lucide-react";

const Alerts = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="flex flex-col h-full bg-card border-border/60 premium-shadow">
      <CardHeader className="p-6 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            Smart Alerts
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <TriangleAlert className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-[250px] lg:basis-0 lg:min-h-[150px] flex flex-col">
        {!data?.alerts || data.alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground w-full gap-5 pb-6">
            <div className="h-24 w-24 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center shadow-sm">
              <TriangleAlert className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <span className="text-base font-semibold">
              No alerts for now
            </span>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <ul className="space-y-3 list-none m-0 p-0">
              {data.alerts.slice(0, 5).map((alert, index) => (
                <li
                  key={alert.link ?? index}
                  className="flex items-start sm:items-center justify-between gap-4 p-3 rounded-lg border border-border/50 bg-background shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 sm:mt-0 p-1.5 rounded-full shrink-0 shadow-xs border border-border/40 bg-muted/20">
                      {alert.severity === "info" ? (
                        <TrendingUp
                          className="h-4 w-4 text-emerald-500"
                          strokeWidth={3}
                        />
                      ) : (
                        <TrendingDown
                          className="h-4 w-4 text-rose-500"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default Alerts;
