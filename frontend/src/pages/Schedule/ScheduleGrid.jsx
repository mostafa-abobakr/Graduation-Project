import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2 } from "lucide-react";
import { getStaffColorLight } from "@/lib/scheduleData";

export function ScheduleGrid({ 
  viewMode, 
  displayedDates, 
  isLoadingShifts, 
  shiftsForDate, 
  handleEditShiftClick, 
  handleAddShiftClick 
}) {
  const getDayName = (date) =>
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[700px]">
        <div
          className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1 max-w-sm mx-auto"} border-b border-border/60`}
        >
          {displayedDates.map((date, i) => {
            const isToday =
              new Date().toDateString() === date.toDateString();
            return (
              <div
                key={i}
                className={`p-3 text-center border-r last:border-r-0 border-border/30 ${isToday ? "bg-primary/5" : ""}`}
              >
                <div className="text-xs font-semibold text-muted-foreground">
                  {getDayName(date)}
                </div>
                <div
                  className={`text-sm font-medium mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}
                >
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1 max-w-sm mx-auto"}`}
        >
          {isLoadingShifts ? (
            displayedDates.map((_, index) => (
              <div
                key={index}
                className="border-r last:border-r-0 border-border/30 p-2 min-h-[280px] space-y-2"
              >
                <Skeleton className="h-[60px] w-full rounded-lg" />
                <Skeleton className="h-[60px] w-full rounded-lg" />
                <Skeleton className="h-[40px] w-full rounded-lg" />
              </div>
            ))
          ) : (
            displayedDates.map((date, index) => (
              <div
                key={index}
                className="border-r last:border-r-0 border-border/30 p-2 min-h-[280px] space-y-2"
              >
                {shiftsForDate(date).map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => handleEditShiftClick(shift, date)}
                    className={`rounded-lg border p-2.5 text-xs cursor-pointer transition-all hover:shadow-md ${getStaffColorLight(shift.staffId)}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {shift.confirmed && (
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      )}
                      <span className="font-semibold text-foreground truncate">
                        {shift.staffName.split(" ")[0]}{" "}
                        {shift.staffName.split(" ")[1]?.[0]}.
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {shift.startTime}-{shift.endTime}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleAddShiftClick(date)}
                  className="w-full rounded-lg border border-dashed border-border/60 p-2 flex items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
