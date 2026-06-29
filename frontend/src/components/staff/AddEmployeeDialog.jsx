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
import { useAddEmployee } from "@/hooks/useStaff"
import { useAuth } from "@/contexts/AuthContext"

const SHIFT_OPTIONS = ["Morning", "Night"]

const employeeSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  phone: z.string().min(1, "Phone is required"),
  shift: z.string().min(1, "Shift is required"),
  email: z.string().email("Invalid email"),
  workingHoursPerDay: z.coerce.number().min(1, "Required").max(24, "Max 24"),
  workingDaysPerWeek: z.coerce.number().min(1, "Required").max(7, "Max 7"),
})

export function AddEmployeeDialog({ isOpen, onOpenChange }) {
  const { user } = useAuth()
  const addEmployeeMutation = useAddEmployee()
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      role: "chef",
      salary: 0,
      phone: "",
      shift: "Morning",
      email: "",
      workingHoursPerDay: 8,
      workingDaysPerWeek: 6,
    }
  })

  const handleAddEmployee = (data) => {
    addEmployeeMutation.mutate({
      restID: user?.restId || 0,
      ...data,
      password: data.phone,
      status: "Active",
    }, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit(handleAddEmployee)}>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter Full Name"
                {...register("fullName")}
              />
              {errors.fullName && <span className="text-xs text-destructive">{errors.fullName.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Casher</SelectItem>
                        <SelectItem value="chef">Cook</SelectItem>
                        <SelectItem value="employee">Waiter</SelectItem>

                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && <span className="text-xs text-destructive">{errors.role.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Controller
                  name="shift"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="01010000000"
                  {...register("phone")}
                />
                {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary ($)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="staffEmail">Email</Label>
              <Input
                id="staffEmail"
                type="email"
                placeholder="username@example.com"
                {...register("email")}
                autoComplete="new-password"
              />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs text-muted-foreground flex gap-2">
              <span className="shrink-0">ℹ️</span>
              <span>The employee's phone number will be automatically set as their initial login password.</span>
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
            <Button type="submit" disabled={addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
