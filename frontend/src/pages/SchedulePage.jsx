import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  mockShifts,
  getWeekDates,
  formatWeekRange,
  getStaffColor,
  getStaffColorLight,
} from "@/lib/scheduleData";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Send,
  Plus,
  Clock,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("week");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isVisble, setIsVisble] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    empID: "",
    startTime: "09:00",
    endTime: "17:00",
    shiftType: "Morning"
  });

  const getRestId = () => {
    try {
      let token = localStorage.getItem("authToken");
      if (!token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) token = JSON.parse(storedUser).token;
      }

      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload.RestID || payload.restId || payload.restID || "0", 10);
      }
    } catch (e) {
      console.error("Could not parse token", e);
    }
    return 0;
  };

  const handleAddShiftClick = (date) => {
    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    setSelectedDate(formattedDate);
    setIsEditMode(false);
    setEditingShiftId(null);
    setFormData({
      empID: "",
      startTime: "09:00",
      endTime: "17:00",
      shiftType: "Morning"
    });
    setIsModalOpen(true);
  };

  const handleEditShiftClick = (shift, dateObj) => {
    const formattedDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString();
    setSelectedDate(formattedDate);
    setIsEditMode(true);
    setEditingShiftId(parseInt(shift.id.replace("shift-", ""), 10));
    
    // Convert "09:00 pm" back to "21:00" natively
    const convert12to24 = (time12h) => {
      if (!time12h) return "";
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier && modifier.toLowerCase() === 'pm') hours = parseInt(hours, 10) + 12;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    setFormData({
      empID: shift.staffId.toString(),
      startTime: convert12to24(shift.startTime),
      endTime: convert12to24(shift.endTime),
      shiftType: shift.shiftType || "Morning"
    });
    setIsModalOpen(true);
  };

  const handleSubmitShift = async (e) => {
    e.preventDefault();
    if (!formData.empID) {
      toast.error("Please select an employee.");
      return;
    }

    setIsSubmitting(true);
    try {
      let token = localStorage.getItem("authToken");
      if (!token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) token = JSON.parse(storedUser).token;
      }

      const payload = {
        empID: parseInt(formData.empID, 10),
        restID: getRestId(),
        day: selectedDate,
        startTime: formData.startTime + ":00",
        endTime: formData.endTime + ":00",
        shiftType: formData.shiftType
      };

      if (isEditMode) {
        payload.scheduleID = editingShiftId;
      }

      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch("https://resturantai.runasp.net/api/Schedule", {
        method: method,
        headers: {
          "Accept": "*/*",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Failed to ${isEditMode ? "update" : "create"} shift`);
      
      toast.success(`Shift ${isEditMode ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving shift:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "add"} shift.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!editingShiftId) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this shift?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      let token = localStorage.getItem("authToken");
      if (!token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) token = JSON.parse(storedUser).token;
      }

      const response = await fetch(`https://resturantai.runasp.net/api/Schedule/${editingShiftId}`, {
        method: "DELETE",
        headers: {
          "Accept": "*/*",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete shift");
      
      toast.success("Shift deleted successfully!");
      setIsModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast.error("Failed to delete shift.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate network delay
    setTimeout(() => {
      setIsPublishing(false);
      toast.success("Schedule published successfully!", {
        description:
          "All employees have been notified of their updated shifts.",
      });
    }, 1500);
  };

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        let token = localStorage.getItem("authToken");
        if (!token) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            token = JSON.parse(storedUser).token;
          }
        }
        
        if (!token) {
          console.warn("No authentication token found. Please log in.");
          return;
        }

        const response = await fetch("https://resturantai.runasp.net/api/Employees", {
          headers: {
            "Accept": "*/*",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
             toast.error("Your session has expired or you are unauthorized. Please log in again.");
          }
          throw new Error(`Failed to fetch employees: ${response.status}`);
        }
        const data = await response.json();
        
        const formattedEmployees = data.map(emp => ({
          id: emp.empID,
          name: emp.fullName,
          role: emp.role,
          avatar: emp.fullName ? emp.fullName.split(" ").map(n => n[0]).join("") : "",
          status: emp.status ? emp.status.toLowerCase() : "active",
          workingHoursPerDay: emp.workingHoursPerDay || 8,
          workingDaysPerWeek: emp.workingDaysPerWeek || 5,
        }));
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    function convert24to12(time24) {
      if (!time24) return "";
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }

    const transformScheduleData = (apiData) => {
      return apiData.map(item => ({
        id: `shift-${item.scheduleID}`,
        staffId: item.empID,
        staffName: item.employeeName,
        avatar: item.employeeName ? item.employeeName.split(' ').map(n => n[0]).join('') : "",
        date: item.day ? item.day.split('T')[0] : "",
        startTime: item.startTime ? convert24to12(item.startTime.substring(0, 5)) : "",
        endTime: item.endTime ? convert24to12(item.endTime.substring(0, 5)) : "",
        shiftType: item.shiftType || "Morning",
        confirmed: true
      }));
    };

    const fetchShifts = async () => {
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];

      const startFormatted = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;
      const endFormatted = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;

      setIsLoadingShifts(true);
      try {
        let token = localStorage.getItem("authToken");
        if (!token) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) token = JSON.parse(storedUser).token;
        }

        const url = `https://resturantai.runasp.net/api/Schedule/range?start_date=${startFormatted}&end_date=${endFormatted}`;
        const response = await fetch(url, {
          headers: {
            "Accept": "*/*",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch API");
        const data = await response.json();
        
        const formattedShifts = transformScheduleData(data);
        setShifts(formattedShifts);
      } catch (error) {
        console.error("Error fetching shifts:", error);
        toast.error("Failed to load schedule data.");
        setShifts([]);
      } finally {
        setIsLoadingShifts(false);
      }
    };
    
    fetchShifts();
  }, [weekDates, refreshKey]);

  const displayedDates = viewMode === "week" ? weekDates : [baseDate];
  const getDayName = (date) =>
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

  const shiftsForDate = (dateObj) => {
    const dateString = new Date(
      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    return shifts.filter((s) => s.date === dateString);
  };

  const staffHours = useMemo(() => {
    const map = {};
    const weekDateStrings = weekDates.map(
      (d) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0],
    );

    employees.forEach((s) => {
      const weekShifts = shifts.filter(
        (sh) => sh.staffId === s.id && weekDateStrings.includes(sh.date),
      );
      map[s.id] = { hours: s.workingHoursPerDay * s.workingDaysPerWeek || 0, shifts: weekShifts.length };
    });
    return map;
  }, [weekDates, shifts, employees]);

  return (
    <div className="space-y-6 animate-fade-in py-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Staff Schedule Manager
            </h1>
            <p className="text-muted-foreground text-sm">
              Create and manage weekly staff schedules
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsVisble(!isVisble)}
          >
            <Users className="h-4 w-4" />
            Employee List
          </Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 space-y-4">
          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset((o) => o - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {formatWeekRange(weekDates)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset((o) => o + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          {/* <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground mr-2">Show:</span>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              className="h-7 px-3 text-xs"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
              className="h-7 px-3 text-xs"
            >
              Day
            </Button>
          </div> */}
          {/* <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: "70%" }}
            />
          </div> */}
          <Card className="bg-card border-border/60 overflow-hidden">
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
          </Card>
        </div>

        {/* staff list */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden origin-right shrink-0 ml-4
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
                <h3 className="text-base font-semibold text-foreground">
                  Employees
                </h3>
                <p className="text-xs text-muted-foreground">
                  {employees.length} total
                </p>
              </div>
              <div className="space-y-4">
                {employees.map((member) => {
                  const info = staffHours[member.id];
                  return (
                    <div key={member.id} className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full ${getStaffColor(
                          member.id,
                        )} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                      >
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.role}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {info?.hours || 0} hrs
                          </span>
                          <span>{info?.shifts || 0} shifts</span>
                        </div>
                      </div>
                      {member.status === "on-leave" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmitShift}>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Shift" : "Add New Shift"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="empID" className="text-right">
                  Employee
                </Label>
                <select
                  id="empID"
                  className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.empID}
                  onChange={(e) =>
                    setFormData({ ...formData, empID: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select employee
                  </option>
                  {employees.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shiftType" className="text-right">
                  Shift Type
                </Label>
                <select
                  id="shiftType"
                  className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.shiftType}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftType: e.target.value })
                  }
                  required
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  className="col-span-3"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  className="col-span-3"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-between w-full">
              {isEditMode ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteShift}
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Shift
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? "Update Shift" : "Save Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
