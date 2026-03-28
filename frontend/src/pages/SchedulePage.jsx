import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { staffMembers } from "@/lib/mockData";
import { mockShifts, getWeekDates, formatWeekRange, getStaffColor, getStaffColorLight } from "@/lib/scheduleData";
import { ChevronLeft, ChevronRight, Users, Send, Plus, Clock, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("week");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isVisble, setIsVisble] = useState(false);
  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate network delay
    setTimeout(() => {
      setIsPublishing(false);
      toast.success("Schedule published successfully!", {
        description: "All employees have been notified of their updated shifts.",
      });
    }, 1500);
  };

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  
  const displayedDates = viewMode === "week" ? weekDates : [baseDate];
  const getDayName = (date) => ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
  
  const shiftsForDate = (dateObj) => {
    const dateString = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
      .toISOString()
      .split("T")[0];
    return mockShifts.filter((s) => s.date === dateString);
  };

  const staffHours = useMemo(() => {
    const map = {};
    const weekDateStrings = weekDates.map((d) => 
      new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0]
    );

    staffMembers.forEach((s) => {
      const weekShifts = mockShifts.filter(
        (sh) => sh.staffId === s.id && weekDateStrings.includes(sh.date)
      );
      map[s.id] = { hours: s.hours, shifts: weekShifts.length };
    });
    return map;
  }, [weekDates]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Schedule Manager</h1>
          <p className="text-muted-foreground">Create and manage weekly staff schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsVisble(!isVisble)}>
            <Users className="h-4 w-4" />Employee List
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isPublishing ? "Publishing..." : "Publish Schedule"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-2 text-foreground font-medium"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatWeekRange(weekDates)}</div>
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </Card>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground mr-2">Show:</span>
            <Button size="sm" variant={viewMode === "week" ? "default" : "outline"} onClick={() => setViewMode("week")} className="h-7 px-3 text-xs">Week</Button>
            <Button size="sm" variant={viewMode === "day" ? "default" : "outline"} onClick={() => setViewMode("day")} className="h-7 px-3 text-xs">Day</Button>
          </div>
          <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: "70%" }} />
          </div>
          <Card className="bg-card border-border/60 overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1 max-w-sm mx-auto"} border-b border-border/60`}>
                  {displayedDates.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <div key={i} className={`p-3 text-center border-r last:border-r-0 border-border/30 ${isToday ? "bg-primary/5" : ""}`}>
                        <div className="text-xs font-semibold text-muted-foreground">{getDayName(date)}</div>
                        <div className={`text-sm font-medium mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                    );
                  })}
                </div>
                <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1 max-w-sm mx-auto"}`}>
                  {displayedDates.map((date, index) => (
                    <div key={index} className="border-r last:border-r-0 border-border/30 p-2 min-h-[280px] space-y-2">
                      {shiftsForDate(date).map((shift) => (
                        <div key={shift.id} className={`rounded-lg border p-2.5 text-xs cursor-pointer transition-all hover:shadow-md ${getStaffColorLight(shift.staffId)}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {shift.confirmed && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                            <span className="font-semibold text-foreground truncate">{shift.staffName.split(" ")[0]} {shift.staffName.split(" ")[1]?.[0]}.</span>
                          </div>
                          <div className="text-muted-foreground">{shift.startTime}-{shift.endTime}</div>
                        </div>
                      ))}
                      <button className="w-full rounded-lg border border-dashed border-border/60 p-2 flex items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/30 transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

       
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden origin-right shrink-0
            ${
              isVisble
                ? "w-full lg:w-72 max-h-[2000px] opacity-100 scale-100"
                : "w-0 lg:w-0 max-h-0 lg:max-h-[2000px] opacity-0 scale-95 !m-0"
            }
          `}
        >
      
          <div className="w-full lg:w-72 min-w-[280px]">
            <Card
              id="employee-list-section"
              className="bg-card border-border/60 p-5 h-fit shadow-lg shadow-background/50"
            >
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Employees</h3>
                <p className="text-xs text-muted-foreground">{staffMembers.length} total</p>
              </div>
              <div className="space-y-4">
                {staffMembers.map((member) => {
                  const info = staffHours[member.id];
                  return (
                    <div key={member.id} className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full ${getStaffColor(
                          member.id
                        )} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                      >
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {info?.hours || 0} hrs
                          </span>
                          <span>{info?.shifts || 0} shifts</span>
                        </div>
                      </div>
                      {member.status === "on-leave" && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          Leave
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
