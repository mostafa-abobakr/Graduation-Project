import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { useUpdateEmployee, useEmployeeDetails } from "@/hooks/useStaff"
import { useAuth } from "@/contexts/AuthContext"

const SHIFT_OPTIONS = ["Morning", "Night"]
const STATUS_OPTIONS = ["Active", "Inactive (Off Duty)", "On Leave"]

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  phone: z.string().min(1, "Phone is required"),
  shift: z.string().min(1, "Shift is required"),
  status: z.string().min(1, "Status is required"),
  workingHoursPerDay: z.coerce.number().min(1, "Required").max(24, "Max 24"),
  workingDaysPerWeek: z.coerce.number().min(1, "Required").max(7, "Max 7"),
})

export function EditEmployeeDialog({ isOpen, onOpenChange, employee }) {
  const { user } = useAuth()
  const updateEmployeeMutation = useUpdateEmployee()
  const empId = employee?.id || employee?.empID || employee?.empId

  const { data: detailedEmployee, isPending: isLoading } = useEmployeeDetails(empId, isOpen)
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      fullName: "",
      role: "",
      salary: 0,
      phone: "",
      shift: "Morning",
      status: "Active",
      workingHoursPerDay: 8,
      workingDaysPerWeek: 6,
    }
  })

  // Populate form when employee data changes
  useEffect(() => {
    if (detailedEmployee && isOpen) {
      reset({
        fullName: detailedEmployee.fullName || "",
        role: detailedEmployee.role || "",
        salary: detailedEmployee.salary || 0,
        phone: detailedEmployee.phone || "",
        shift: detailedEmployee.shift || "Morning",
        status: detailedEmployee.status || "Active",
        workingHoursPerDay: detailedEmployee.workingHoursPerDay || 8,
        workingDaysPerWeek: detailedEmployee.workingDaysPerWeek || 6,
      })
    }
  }, [detailedEmployee, isOpen, reset])

  const handleUpdateEmployee = (data) => {
    if (!empId) return
    
    updateEmployeeMutation.mutate({
      empId,
      data: {
        restID: user?.restId,
        fullName: data.fullName,
        salary: data.salary,
        phone: data.phone,
        status: data.status,
        shift: data.shift,
        workingHoursPerDay: data.workingHoursPerDay,
        workingDaysPerWeek: data.workingDaysPerWeek,
      }
    }, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Loading employee data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleUpdateEmployee)}>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  {...register("fullName")}
                />
                {errors.fullName && <span className="text-xs text-destructive">{errors.fullName.message}</span>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    disabled
                    className="bg-muted/50"
                    {...register("role")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && <span className="text-xs text-destructive">{errors.status.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="01010000000"
                    {...register("phone")}
                  />
                  {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (EGP)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="2500"
                    {...register("salary")}
                  />
                  {errors.salary && <span className="text-xs text-destructive">{errors.salary.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Controller
                    name="shift"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="shift">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.shift && <span className="text-xs text-destructive">{errors.shift.message}</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workingHoursPerDay">Hours / Day</Label>
                  <Input
                    id="workingHoursPerDay"
                    type="number"
                    placeholder="8"
                    {...register("workingHoursPerDay")}
                  />
                  {errors.workingHoursPerDay && <span className="text-xs text-destructive">{errors.workingHoursPerDay.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerWeek">Days / Week</Label>
                  <Input
                    id="workingDaysPerWeek"
                    type="number"
                    placeholder="5"
                    {...register("workingDaysPerWeek")}
                  />
                  {errors.workingDaysPerWeek && <span className="text-xs text-destructive">{errors.workingDaysPerWeek.message}</span>}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                {updateEmployeeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
