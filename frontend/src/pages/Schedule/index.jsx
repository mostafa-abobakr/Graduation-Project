import { useState, useMemo, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWeekDates, formatWeekRange } from "@/lib/scheduleData"
import { ChevronLeft, ChevronRight, Users, CalendarDays, Sparkles, Loader2, AlertCircle, Bot, Copy, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import {
  useEmployees,
  useShifts,
  useAddShift,
  useUpdateShift,
  useDeleteShift,
  useDeleteScheduleRange,
  useCopyLastWeekSchedule,
} from "@/hooks/useSchedule"
import { EmployeeList } from "./EmployeeList"
import { ScheduleGrid } from "./ScheduleGrid"
import { ManageShiftDialog } from "./ManageShiftDialog"
import { ViewToggler } from "@/components/shared/ViewToggler"
import api from "@/api/axios"

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
  const [customRange, setCustomRange] = useState(null)
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })

  const [formData, setFormData] = useState({
    empID: "",
    startTime: "08:00",
    endTime: "16:00",
    shiftType: "Morning",
    source: "Manual",
    isOverridden: false,
    updatedAt: null,
  })

  const location = useLocation()
  const targetDateStr = location.state?.targetDate
  
  useEffect(() => {
    if (targetDateStr) {
      const target = new Date(targetDateStr)
      setViewMode("day")
      setCustomRange({ from: target, to: target })
    }
  }, [targetDateStr])

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

  const firstDisplayed = displayedDates[0] || baseDate
  const lastDisplayed = displayedDates[displayedDates.length - 1] || baseDate

  const activeStartDate = firstDisplayed

  const activeEndDate = new Date(
    lastDisplayed.getFullYear(),
    lastDisplayed.getMonth(),
    lastDisplayed.getDate() + 1
  )

  const { data: shifts = [], isLoading: isLoadingShifts } = useShifts(
    activeStartDate,
    activeEndDate,
  )

  const addShiftMutation = useAddShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();
  const deleteRangeMutation = useDeleteScheduleRange();
  const copyLastWeekMutation = useCopyLastWeekSchedule();

  const handleAddShiftClick = (date, prefilledEmpId = "", prefilledShiftType = "Morning") => {
    const formattedDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    ).toISOString()
    setSelectedDate(formattedDate)
    setIsEditMode(false)
    setEditingShiftId(null)
    
    const startTime = prefilledShiftType === "Night" ? "16:00" : "08:00"
    const endTime = prefilledShiftType === "Night" ? "00:00" : "16:00"

    setFormData({
      empID: prefilledEmpId ? prefilledEmpId.toString() : "",
      startTime,
      endTime,
      shiftType: prefilledShiftType,
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
      empID: shift.staffId ? shift.staffId.toString() : "",
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
      restID: user?.restId,
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

  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      const targetDateStr = new Date(
        baseDate.getTime() - baseDate.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split("T")[0]

      const restId = user?.restId

      const response = await api.post(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/scheduling/generate/${restId}?target_date=${targetDateStr}`,
        {}
      )

      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      toast.success("AI Schedule Generated!", {
        description: data.message || "Schedule generated successfully for the week."
      })
    }
  })

  const handleGenerateAISchedule = () => {
    generateScheduleMutation.mutate()
  }

  const handleCopyLastWeek = () => {
    const currentStart = displayedDates[0]
    const currentEnd = displayedDates[displayedDates.length - 1]

    if (!currentStart || !currentEnd) {
      toast.error("No dates available.")
      return
    }

    const prevStart = new Date(currentStart)
    prevStart.setDate(prevStart.getDate() - 7)
    const prevEnd = new Date(currentEnd)
    prevEnd.setDate(prevEnd.getDate() - 6)

    copyLastWeekMutation.mutate({
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      currentStartDate: currentStart,
    })
  }

  const handleStartFromScratch = () => {
    const confirmed = window.confirm("Are you sure you want to clear the entire schedule for this week? This action cannot be undone.")
    if (!confirmed) return

    const startDate = displayedDates[0]
    const lastDay = displayedDates[displayedDates.length - 1]
    const endDate = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1)

    if (!startDate || !endDate) {
      toast.error("No dates available to clear.")
      return
    }

    deleteRangeMutation.mutate({ startDate, endDate })
  }

  const handleApplyRange = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select both start and end dates.")
      return
    }
    const fromDate = dateRange.from
    const toDate = dateRange.to
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
    setDateRange({ from: undefined, to: undefined })
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
      setDateRange({ from: newFrom, to: newTo })
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
      setDateRange({ from: newFrom, to: newTo })
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
        title="Schedule Management"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all duration-300"
                  disabled={generateScheduleMutation.isPending}
                >
                  {generateScheduleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generateScheduleMutation.isPending ? "Processing..." : "Schedule Actions"}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Schedule Template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGenerateAISchedule} className="cursor-pointer gap-2">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  <span>Generate with AI</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCopyLastWeek}
                  disabled={copyLastWeekMutation.isPending}
                  className="cursor-pointer gap-2"
                >
                  {copyLastWeekMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-emerald-500" />
                  )}
                  <span>{copyLastWeekMutation.isPending ? "Copying..." : "Copy Last Week"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleStartFromScratch}
                  disabled={deleteRangeMutation.isPending}
                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  {deleteRangeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{deleteRangeMutation.isPending ? "Clearing..." : "Start From Scratch"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 space-y-4">
          <Card className="p-4 bg-card border-border/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <ViewToggler
                modes={["day", "week", "custom"]}
                labels={["This Day", "This Week", "Custom Range"]}
                viewMode={customRange ? "custom" : viewMode}
                setViewMode={(mode) => {
                  if (mode === "custom") {
                    setViewMode("custom")
                    setIsRangePickerOpen(true)
                  } else {
                    setViewMode(mode)
                    setCustomRange(null)
                  }
                }}
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevRange}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={isRangePickerOpen} onOpenChange={setIsRangePickerOpen}>
                  <PopoverTrigger asChild>
                    <div
                      className="flex items-center gap-2 text-foreground font-medium cursor-pointer hover:text-primary transition-colors select-none py-1.5 px-3 rounded-lg hover:bg-muted/30"
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
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 flex flex-col gap-3" align="center">
                    <h4 className="font-semibold text-center border-b border-border/40 pb-2">Select Custom Date Range</h4>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from || baseDate}
                      selected={dateRange}
                      onSelect={setDateRange}
                    />
                    <div className="flex gap-2 pt-1 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-border/60 hover:bg-muted/50"
                        onClick={handleResetRange}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleApplyRange}
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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

          <Card className="bg-card border-border/60 ">
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
