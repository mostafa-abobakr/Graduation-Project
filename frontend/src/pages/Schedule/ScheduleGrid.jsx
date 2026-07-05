import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { getStaffColorLight } from "@/lib/scheduleData";
import { ViewToggler } from "@/components/shared/ViewToggler";

export function ScheduleGrid({
  viewMode,
  displayedDates,
  isLoadingShifts,
  shiftsForDate,
  handleEditShiftClick,
  handleAddShiftClick,
}) {
  const [activeTab, setActiveTab] = useState("Morning");

  const getDayName = (date) =>
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

  const filteredShiftsForDate = (date) => {
    return shiftsForDate(date).filter(
      (shift) =>
        (shift.shiftType || "Morning").toLowerCase() ===
        activeTab.toLowerCase(),
    );
  };

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex items-center justify-end p-3 border-b border-border/60 bg-muted/20">
        <h3 className="font-semibold text-sm text-muted-foreground px-2">
          Shifts View :
        </h3>
        <ViewToggler
          modes={["Morning", "night"]}
          labels={["Morning", "Night"]}
          viewMode={activeTab}
          setViewMode={setActiveTab}
          className="min-w-0 w-[240px]"
        />
      </div>
      <div className="w-full ">
        <div className="pb-4">
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                viewMode !== "day"
                  ? `repeat(${displayedDates.length}, minmax(0, 1fr))`
                  : "repeat(1, minmax(0, 1fr))",
            }}
          >
            {/* Headers Row */}
            {displayedDates.map((date, i) => {
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div
                  key={`header-${i}`}
                  className={`p-3 text-center border-b border-border/30 ${i === displayedDates.length - 1 ? "" : "border-r"} ${isToday ? "bg-primary/5" : ""}`}
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

            {/* Body Row */}
            {isLoadingShifts
              ? displayedDates.map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className={`border-border/30 p-2 min-h-[280px] space-y-2 ${index === displayedDates.length - 1 ? "" : "border-r"}`}
                  >
                    <Skeleton className="h-[60px] w-full rounded-lg" />
                    <Skeleton className="h-[60px] w-full rounded-lg" />
                    <Skeleton className="h-[40px] w-full rounded-lg" />
                  </div>
                ))
              : displayedDates.map((date, index) => (
                  <div
                    key={`body-${index}`}
                    className={`border-border/30 p-2 min-h-[380px]  space-y-2 transition-colors duration-200 ${index === displayedDates.length - 1 ? "" : "border-r"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("bg-primary/5");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("bg-primary/5");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("bg-primary/5");
                      const empId = e.dataTransfer.getData("employeeId");
                      if (empId) {
                        handleAddShiftClick(
                          date,
                          empId,
                          activeTab === "night" ? "Night" : "Morning",
                        );
                      }
                    }}
                  >
                    {filteredShiftsForDate(date).map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => handleEditShiftClick(shift, date)}
                        className={`relative rounded-lg border p-2.5 text-xs cursor-pointer transition-all hover:shadow-md ${
                          shift.source === "AI"
                            ? "border-indigo-400/60 shadow-sm shadow-indigo-100/50 dark:shadow-none"
                            : "border-border/60"
                        } ${getStaffColorLight(shift.staffId)}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {shift.confirmed && (
                              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {shift.staffName ? shift.staffName : "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {shift.source === "AI" && (
                              <Sparkles
                                className="h-3 w-3 text-indigo-500 animate-pulse"
                                title="AI Generated Shift"
                              />
                            )}
                            {shift.isOverridden && (
                              <AlertCircle
                                className="h-3 w-3 text-amber-500"
                                title="Manually Overridden"
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-muted-foreground">
                          {shift.startTime}-{shift.endTime}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        handleAddShiftClick(
                          date,
                          "",
                          activeTab === "night" ? "Night" : "Morning",
                        )
                      }
                      className="w-full rounded-lg border border-dashed border-border/60 p-2 flex items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/30 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
