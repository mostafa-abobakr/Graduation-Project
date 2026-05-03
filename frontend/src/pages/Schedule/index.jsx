import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWeekDates, formatWeekRange } from "@/lib/scheduleData";
import { ChevronLeft, ChevronRight, Users, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useShifts,
  useAddShift,
  useUpdateShift,
  useDeleteShift,
} from "@/hooks/useSchedule";
import { EmployeeList } from "./EmployeeList";
import { ScheduleGrid } from "./ScheduleGrid";
import { ManageShiftDialog } from "./ManageShiftDialog";

export default function SchedulePage() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("week");
  const [isVisble, setIsVisble] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);

  const [formData, setFormData] = useState({
    empID: "",
    startTime: "09:00",
    endTime: "17:00",
    shiftType: "Morning",
  });

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const { data: employees = [] } = useEmployees();

  const startDate = weekDates[0];
  const endDate = weekDates[weekDates.length - 1];
  const { data: shifts = [], isLoading: isLoadingShifts } = useShifts(
    startDate,
    endDate,
  );

  const addShiftMutation = useAddShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();

  const handleAddShiftClick = (date) => {
    const formattedDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    ).toISOString();
    setSelectedDate(formattedDate);
    setIsEditMode(false);
    setEditingShiftId(null);
    setFormData({
      empID: "",
      startTime: "09:00",
      endTime: "17:00",
      shiftType: "Morning",
    });
    setIsModalOpen(true);
  };

  const handleEditShiftClick = (shift, dateObj) => {
    const formattedDate = new Date(
      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
    ).toISOString();
    setSelectedDate(formattedDate);
    setIsEditMode(true);
    setEditingShiftId(parseInt(shift.id.replace("shift-", ""), 10));

    const convert12to24 = (time12h) => {
      if (!time12h) return "";
      const [time, modifier] = time12h.split(" ");
      let [hours, minutes] = time.split(":");
      if (hours === "12") hours = "00";
      if (modifier && modifier.toLowerCase() === "pm")
        hours = parseInt(hours, 10) + 12;
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    setFormData({
      empID: shift.staffId.toString(),
      startTime: convert12to24(shift.startTime),
      endTime: convert12to24(shift.endTime),
      shiftType: shift.shiftType || "Morning",
    });
    setIsModalOpen(true);
  };

  const handleSubmitShift = (e) => {
    e.preventDefault();
    if (!formData.empID) {
      toast.error("Please select an employee.");
      return;
    }

    const payload = {
      empID: parseInt(formData.empID, 10),
      restID: user?.restId || 0,
      day: selectedDate,
      startTime: formData.startTime + ":00",
      endTime: formData.endTime + ":00",
      shiftType: formData.shiftType,
    };

    if (isEditMode) {
      payload.scheduleID = editingShiftId;
      updateShiftMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      addShiftMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDeleteShift = () => {
    if (!editingShiftId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this shift?",
    );
    if (!confirmed) return;

    deleteShiftMutation.mutate(editingShiftId, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  const displayedDates = viewMode === "week" ? weekDates : [baseDate];

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
      map[s.id] = {
        hours: s.workingHoursPerDay * s.workingDaysPerWeek || 0,
        shifts: weekShifts.length,
      };
    });
    return map;
  }, [weekDates, shifts, employees]);

  return (
    <div className="space-y-6 animate-fade-in py-5">
      <PageHeader
        icon={CalendarDays}
        title="Staff Schedule Manager"
        description="Create and manage weekly staff schedules"
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsVisble(!isVisble)}
          >
            <Users className="h-4 w-4" />
            Employee List
          </Button>
        }
      />
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

          <Card className="bg-card border-border/60 overflow-hidden">
            <ScheduleGrid
              viewMode={viewMode}
              displayedDates={displayedDates}
              isLoadingShifts={isLoadingShifts}
              shiftsForDate={shiftsForDate}
              handleEditShiftClick={handleEditShiftClick}
              handleAddShiftClick={handleAddShiftClick}
            />
          </Card>
        </div>

        <EmployeeList
          isVisble={isVisble}
          employees={employees}
          staffHours={staffHours}
        />
      </div>

      <ManageShiftDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEditMode={isEditMode}
        handleSubmitShift={handleSubmitShift}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        handleDeleteShift={handleDeleteShift}
        isDeleting={deleteShiftMutation.isPending}
        isSubmitting={
          addShiftMutation.isPending || updateShiftMutation.isPending
        }
      />
    </div>
  );
}
