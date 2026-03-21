import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar } from "lucide-react";

const PeakTimes = ({ data }) => {
  if (!data) return null;

  // Helper to convert "17:00" to "5 PM"
  const formatTo12Hr = (timeStr) => {
    const [hours] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  const hours = data.peak_hours || [];
  const days = data.peak_days || [];
  const maxOrderCount = Math.max(...hours.map((h) => h.order_count), 1);

  return (
    <Card className="flex-1 min-h-0 bg-card border-border/60 premium-shadow max-h-[360px]">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
          Peak Performance
        </CardTitle>
      </CardHeader>

      <ScrollArea className="h-[290px]">
        <CardContent className="p-5 pt-0 space-y-6">
          {/* Top Hours Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">
                Busiest Hours
              </span>
            </div>

            <div className="space-y-4">
              {hours.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">
                      {formatTo12Hr(item.hour)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.order_count.toLocaleString()} orders
                    </span>
                  </div>
                  <Progress
                    value={(item.order_count / maxOrderCount) * 100}
                    className="h-2 bg-muted"
                    indicatorClassName={
                      index === 0 ? "bg-orange-500" : "bg-primary"
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Top Days Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">
                Top Days (Revenue)
              </span>
            </div>
            <div className="flex gap-2">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`
                    p-3 rounded-lg border text-center flex-1 transition-colors
                    ${
                      index === 0
                        ? "border-orange-500/50 bg-orange-500/10"
                        : "border-border/60 bg-muted/20"
                    }
                  `}
                >
                  <span
                    className={`block text-xs font-bold uppercase mb-1 ${
                      index === 0 ? "text-orange-600" : "text-foreground"
                    }`}
                  >
                    {day.day.substring(0, 3)}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    ${(day.revenue / 1000).toFixed(1)}k
                  </span>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default PeakTimes;
