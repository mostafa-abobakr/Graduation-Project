import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, Activity } from "lucide-react";

const PeakTimes = ({ data, viewMode }) => {
  if (!data) return null;

  const formatTo12Hr = (timeStr) => {
    const [hours] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  // On Today view, show more hours and hide Top Days
  const hoursLimit = viewMode === "today" ? 5 : 3;
  const hours = data.peak_hours?.slice(0, hoursLimit) || [];
  const days = data.peak_days?.slice(0, 3) || [];
  const maxOrderCount = Math.max(...hours.map((h) => h.order_count), 1);
  const maxRevenueDayIndex = days.length > 0
    ? days.reduce((maxIdx, day, idx, arr) => day.revenue > arr[maxIdx].revenue ? idx : maxIdx, 0)
    : -1;

  return (
    <Card className="flex flex-col bg-card border-border/60 premium-shadow h-full">
      <CardHeader className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            Peak Times
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2 flex flex-col flex-1">
        <div className="space-y-6 flex-1 flex flex-col justify-between">
          {/* Top Hours Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Busiest Hours
              </span>
            </div>

            <div className="space-y-4">
              {hours.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-foreground">
                      {formatTo12Hr(item.hour)}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full border border-border/50">
                      {item.order_count.toLocaleString()} orders
                    </span>
                  </div>
                  <Progress
                    value={(item.order_count / maxOrderCount) * 100}
                    className="h-2 bg-muted rounded-full overflow-hidden"
                    indicatorClassName={`${
                      index === 0 ? "bg-amber-500" : "bg-primary"
                    } rounded-full transition-all duration-500`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Top Days Section */}
          {viewMode !== "today" && (
            <section className="pt-2">
              <div className="flex items-center gap-2 mb-3">
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
                    index === maxRevenueDayIndex
                      ? "border-amber-500/30 bg-amber-500/10 shadow-sm"
                      : "border-border/40 bg-muted/30"
                  }`}
                >
                  <span
                    className={`block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 ${
                      index === maxRevenueDayIndex ? "text-amber-500" : "text-muted-foreground"
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PeakTimes;
