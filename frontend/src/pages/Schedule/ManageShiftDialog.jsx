import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Sparkles } from "lucide-react"

export function ManageShiftDialog({
  isModalOpen,
  setIsModalOpen,
  isEditMode,
  handleSubmitShift,
  formData,
  setFormData,
  employees,
  handleDeleteShift,
  isDeleting,
  isSubmitting,
}) {
  return (
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
                  <option key={member.id} value={member.id?.toString()}>
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
            {isEditMode && formData.source && (
              <div className="grid grid-cols-4 items-start gap-4 bg-muted/40 p-3 rounded-lg border border-border/50 text-xs">
                <span className="font-semibold text-muted-foreground text-right col-span-1 pt-1">
                  Metadata
                </span>
                <div className="col-span-3 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {formData.source === "AI" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50">
                        <Sparkles className="h-2.5 w-2.5 text-indigo-500" /> AI Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                        Manual Entry
                      </span>
                    )}

                    {formData.isOverridden && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 animate-pulse">
                        Overridden
                      </span>
                    )}
                  </div>
                  {formData.updatedAt && (
                    <div className="text-[10px] text-muted-foreground">
                      Last Updated: {new Date(formData.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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
  );
}
