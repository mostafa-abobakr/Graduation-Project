import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWeekDates, formatWeekRange } from "@/lib/scheduleData"
import { ChevronLeft, ChevronRight, Users, CalendarDays, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import {
  useEmployees,
  useShifts,
  useAddShift,
  useUpdateShift,
  useDeleteShift,
} from "@/hooks/useSchedule"
import { EmployeeList } from "./EmployeeList"
import { ScheduleGrid } from "./ScheduleGrid"
import { ManageShiftDialog } from "./ManageShiftDialog"

export default function SchedulePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState("week")
  const [isVisble, setIsVisble] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingShiftId, setEditingShiftId] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [customRange, setCustomRange] = useState(null)
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false)
  const [rangeInputs, setRangeInputs] = useState({ from: "", to: "" })

  const [formData, setFormData] = useState({
    empID: "",
    startTime: "09:00",
    endTime: "17:00",
    shiftType: "Morning",
    source: "Manual",
    isOverridden: false,
    updatedAt: null,
  })

  const baseDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const getSaturdayToWednesdayDates = (base) => {
    const d = new Date(base)
    const day = d.getDay()
    const daysToSubtract = day === 6 ? 0 : day + 1
    const sat = new Date(d)
    sat.setDate(d.getDate() - daysToSubtract)
    
    return Array.from({ length: 7 }, (_, i) => {
      const current = new Date(sat)
      current.setDate(sat.getDate() + i)
      return current
    })
  }

  const getDatesInRange = (start, end) => {
    const dates = []
    let curr = new Date(start)
    const last = new Date(end)
    let limit = 0
    while (curr <= last && limit < 31) {
      dates.push(new Date(curr))
      curr.setDate(curr.getDate() + 1)
      limit++
    }
    return dates
  }

  const displayedDates = customRange 
    ? getDatesInRange(customRange.from, customRange.to) 
    : (viewMode === "week" ? getSaturdayToWednesdayDates(baseDate) : [baseDate])

  const { data: employees = [] } = useEmployees()

  const activeStartDate = displayedDates[0] || baseDate
  const activeEndDate = displayedDates[displayedDates.length - 1] || baseDate

  const { data: shifts = [], isLoading: isLoadingShifts } = useShifts(
    activeStartDate,
    activeEndDate,
  )

  const addShiftMutation = useAddShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();

  const handleAddShiftClick = (date, prefilledEmpId = "") => {
    const formattedDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    ).toISOString()
    setSelectedDate(formattedDate)
    setIsEditMode(false)
    setEditingShiftId(null)
    setFormData({
      empID: prefilledEmpId ? prefilledEmpId.toString() : "",
      startTime: "09:00",
      endTime: "17:00",
      shiftType: "Morning",
      source: "Manual",
      isOverridden: false,
      updatedAt: null,
    })
    setIsModalOpen(true)
  }

  const handleEditShiftClick = (shift, dateObj) => {
    const formattedDate = new Date(
      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
    ).toISOString()
    setSelectedDate(formattedDate)
    setIsEditMode(true)
    setEditingShiftId(parseInt(shift.id.replace("shift-", ""), 10))

    const convert12to24 = (time12h) => {
      if (!time12h) return ""
      const [time, modifier] = time12h.split(" ")
      let [hours, minutes] = time.split(":")
      if (hours === "12") hours = "00"
      if (modifier && modifier.toLowerCase() === "pm")
        hours = parseInt(hours, 10) + 12
      return `${hours.toString().padStart(2, "0")}:${minutes}`
    }

    setFormData({
      empID: shift.staffId.toString(),
      startTime: convert12to24(shift.startTime),
      endTime: convert12to24(shift.endTime),
      shiftType: shift.shiftType || "Morning",
      source: shift.source || "Manual",
      isOverridden: shift.isOverridden || false,
      updatedAt: shift.updatedAt || null,
    })
    setIsModalOpen(true)
  }

  const handleSubmitShift = (e) => {
    e.preventDefault()
    if (!formData.empID) {
      toast.error("Please select an employee.")
      return
    }

    const payload = {
      empID: parseInt(formData.empID, 10),
      restID: user?.restId || 0,
      day: selectedDate,
      startTime: formData.startTime + ":00",
      endTime: formData.endTime + ":00",
      shiftType: formData.shiftType,
    }

    if (isEditMode) {
      payload.scheduleID = editingShiftId
      if (formData.source === "AI") {
        payload.isOverridden = true
        payload.source = "AI"
      }
      updateShiftMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      })
    } else {
      addShiftMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      })
    }
  }

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

  const handleGenerateAISchedule = async () => {
    setIsGenerating(true)
    const targetDateStr = new Date(
      baseDate.getTime() - baseDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0]

    const restId = user?.restId || 54
    console.log(targetDateStr);
    
    try {
      const response = await fetch(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/scheduling/generate/${restId}?target_date=${targetDateStr}`,
        {
          method: "POST",
          headers: {
            "accept": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to generate schedule")
      }

      const data = await response.json()
      
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      
      toast.success("AI Schedule Generated!", {
        description: data.message || "Schedule generated successfully for the week."
      })
    } catch (error) {
      console.error(error)
      toast.error("Error generating schedule", {
        description: error.message || "Something went wrong."
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyRange = () => {
    if (!rangeInputs.from || !rangeInputs.to) {
      toast.error("Please select both start and end dates.")
      return
    }
    const fromDate = new Date(rangeInputs.from + "T00:00:00")
    const toDate = new Date(rangeInputs.to + "T00:00:00")
    if (fromDate > toDate) {
      toast.error("Start date must be before or equal to end date.")
      return
    }
    const diffTime = Math.abs(toDate - fromDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    if (diffDays > 31) {
      toast.error("Please select a range of 31 days or less.")
      return
    }

    setCustomRange({ from: fromDate, to: toDate })
    setIsRangePickerOpen(false)
  }

  const handleResetRange = () => {
    setCustomRange(null)
    setRangeInputs({ from: "", to: "" })
    setIsRangePickerOpen(false)
  }

  const handlePrevRange = () => {
    if (customRange) {
      const diffTime = Math.abs(customRange.to - customRange.from)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      const newFrom = new Date(customRange.from)
      newFrom.setDate(newFrom.getDate() - diffDays)
      const newTo = new Date(customRange.to)
      newTo.setDate(newTo.getDate() - diffDays)
      setCustomRange({ from: newFrom, to: newTo })
      setRangeInputs({
        from: newFrom.toISOString().split("T")[0],
        to: newTo.toISOString().split("T")[0]
      })
    } else {
      setWeekOffset((o) => o - 1)
    }
  }

  const handleNextRange = () => {
    if (customRange) {
      const diffTime = Math.abs(customRange.to - customRange.from)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      const newFrom = new Date(customRange.from)
      newFrom.setDate(newFrom.getDate() + diffDays)
      const newTo = new Date(customRange.to)
      newTo.setDate(newTo.getDate() + diffDays)
      setCustomRange({ from: newFrom, to: newTo })
      setRangeInputs({
        from: newFrom.toISOString().split("T")[0],
        to: newTo.toISOString().split("T")[0]
      })
    } else {
      setWeekOffset((o) => o + 1)
    }
  }

  const shiftsForDate = (dateObj) => {
    const dateString = new Date(
      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    return shifts.filter((s) => s.date === dateString);
  };

  const staffHours = useMemo(() => {
    const map = {}
    const displayedDateStrings = displayedDates.map(
      (d) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0]
    )

    employees.forEach((s) => {
      const visibleShifts = shifts.filter(
        (sh) => sh.staffId === s.id && displayedDateStrings.includes(sh.date)
      )
      map[s.id] = {
        hours: s.workingHoursPerDay * s.workingDaysPerWeek || 0,
        shifts: visibleShifts.length,
      }
    })
    return map
  }, [displayedDates, shifts, employees])

  const aiStats = useMemo(() => {
    let aiCount = 0
    let manualCount = 0
    let overrideCount = 0

    shifts.forEach((s) => {
      if (s.source === "AI") {
        aiCount++
      } else {
        manualCount++
      }
      if (s.isOverridden) {
        overrideCount++
      }
    })

    return { aiCount, manualCount, overrideCount }
  }, [shifts])

  return (
    <div className="space-y-6 animate-fade-in py-5">
      <PageHeader
        icon={CalendarDays}
        title="Staff Schedule Manager"
        description="Create and manage weekly staff schedules"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsVisble(!isVisble)}
            >
              <Users className="h-4 w-4" />
              Employee List
            </Button>
            <Button
              variant="default"
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all duration-300"
              onClick={handleGenerateAISchedule}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate AI Schedule"}
            </Button>
          </div>
        }
      />
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 space-y-4">
          <Card className="p-4 bg-card border-border/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 text-xs shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("day")
                    setCustomRange(null)
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                    viewMode === "day" && !customRange
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  This Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("week")
                    setCustomRange(null)
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                    viewMode === "week" && !customRange
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("custom")
                    setIsRangePickerOpen(true)
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                    customRange
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Custom Range
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevRange}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div 
                  className="relative flex items-center gap-2 text-foreground font-medium cursor-pointer hover:text-primary transition-colors select-none py-1.5 px-3 rounded-lg hover:bg-muted/30"
                  onClick={() => setIsRangePickerOpen(!isRangePickerOpen)}
                >
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {customRange ? (
                    <span>
                      {customRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {customRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  ) : viewMode === "week" ? (
                    <span>
                      {displayedDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {displayedDates[displayedDates.length - 1]?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  ) : (
                    <span>
                      {baseDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}

                  {isRangePickerOpen && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-72 p-4 bg-card border border-border/80 rounded-xl shadow-xl space-y-3 text-sm text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4 className="font-semibold text-center border-b border-border/40 pb-2">Select Custom Date Range</h4>
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-xs text-muted-foreground font-medium">Start Date</label>
                          <input
                            type="date"
                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80"
                            value={rangeInputs.from}
                            onChange={(e) => setRangeInputs({ ...rangeInputs, from: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-xs text-muted-foreground font-medium">End Date</label>
                          <input
                            type="date"
                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80"
                            value={rangeInputs.to}
                            onChange={(e) => setRangeInputs({ ...rangeInputs, to: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={handleResetRange}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={handleApplyRange}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextRange}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* {shifts.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-xl border border-border/40 text-xs text-center backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-muted-foreground font-medium mb-0.5">AI Generated Shifts</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse shrink-0" />
                  {aiStats.aiCount}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-muted-foreground font-medium mb-0.5">Manual Overrides</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  {aiStats.overrideCount}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-muted-foreground font-medium mb-0.5">Total Shifts Active</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                  {shifts.length}
                </span>
              </div>
            </div>
          )} */}

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
        isModalOpen={isModalOpen}_
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
