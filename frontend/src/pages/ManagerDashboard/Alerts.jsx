import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// Replaced MUI icons with Lucide icons
import { TriangleAlert, ChevronRight } from "lucide-react";

const Alerts = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="flex-1 min-h-0 bg-card border-border/60 premium-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
          Smart Alerts
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-4 pb-4">
          <ul className="space-y-3 list-none m-0 p-0">
            {data.alerts.slice(0, 5).map((alert, index) => (
              <li
                key={alert.link ?? index}
                className="flex items-center justify-between gap-3 p-3 rounded-md border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Replaced WarningAmberIcon */}
                  <TriangleAlert className="text-orange-500 h-5 w-5 shrink-0" />
                  <span className="text-sm text-foreground leading-tight [text-wrap:balance]">
                    {alert.message}
                  </span>
                </div>

                {/* Replaced ArrowForwardIosIcon */}
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Alerts;
