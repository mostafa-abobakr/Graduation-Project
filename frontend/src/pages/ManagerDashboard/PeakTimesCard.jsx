import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, Activity } from "lucide-react";

const PeakTimes = ({ data }) => {
  if (!data) return null;

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
    <Card className="flex flex-col border-border/40 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md h-[400px]">
      <CardHeader className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground tracking-tight">
            Peak Performance
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        <ScrollArea className="h-full px-6 pb-6 w-full">
          <div className="space-y-8 pt-2">
            {/* Top Hours Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  Busiest Hours
                </span>
              </div>

              <div className="space-y-5">
                {hours.map((item, index) => (
                  <div key={index} className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-foreground">
                        {formatTo12Hr(item.hour)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                        {item.order_count.toLocaleString()} orders
                      </span>
                    </div>
                    <Progress
                      value={(item.order_count / maxOrderCount) * 100}
                      className="h-2.5 bg-muted rounded-full overflow-hidden"
                      indicatorClassName={`${
                        index === 0 ? "bg-amber-500" : "bg-primary"
                      } rounded-full transition-all duration-500`}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Top Days Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  Top Days (Revenue)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-colors duration-300 ${
                      index === 0
                        ? "border-amber-500/30 bg-amber-500/10 shadow-sm"
                        : "border-border/40 bg-muted/30"
                    }`}
                  >
                    <span
                      className={`block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 ${
                        index === 0 ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    >
                      {day.day.substring(0, 3)}
                    </span>
                    <span className="text-sm md:text-base font-black tracking-tight text-foreground truncate max-w-full">
                      ${(day.revenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PeakTimes;
