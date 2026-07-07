import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Sparkles, Clock } from "lucide-react";

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
              <Select
                value={formData.empID}
                onValueChange={(value) =>
                  setFormData({ ...formData, empID: value })
                }
                required
              >
                <SelectTrigger id="empID" className="col-span-3">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((member) => (
                    <SelectItem
                      key={member.id || member.empID}
                      value={(member.id || member.empID)?.toString()}
                    >
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shiftType" className="text-right">
                Shift Type
              </Label>
              <Select
                value={formData.shiftType}
                onValueChange={(type) => {
                  const times =
                    type === "Morning"
                      ? { startTime: "08:00", endTime: "16:00" }
                      : { startTime: "16:00", endTime: "00:00" };
                  setFormData({ ...formData, shiftType: type, ...times });
                }}
                required
              >
                <SelectTrigger id="shiftType" className="col-span-3">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <div className="col-span-3 relative flex items-center">
                <Input
                  id="startTime"
                  type="time"
                  className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  onClick={(e) => {
                    try {
                      if (e.currentTarget.showPicker) {
                        e.currentTarget.showPicker();
                      }
                    } catch (err) {}
                  }}
                  required
                />
                <Clock className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <div className="col-span-3 relative flex items-center">
                <Input
                  id="endTime"
                  type="time"
                  className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  onClick={(e) => {
                    try {
                      if (e.currentTarget.showPicker) {
                        e.currentTarget.showPicker();
                      }
                    } catch (err) {}
                  }}
                  required
                />
                <Clock className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {isEditMode && formData.source && (
              <div className="grid grid-cols-4 items-start gap-4 bg-muted/40 p-3 rounded-lg border border-border/50 text-xs">
                <span className="font-semibold text-muted-foreground text-right col-span-1 pt-1">
                  Metadata
                </span>
                <div className="col-span-3 space-y-1.5">
                  <div className="flex flex-wrap gap-2">
                    {formData.source === "AI" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50">
                        <Sparkles className="h-2.5 w-2.5 text-indigo-500" /> AI
                        Generated
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
                      Last Updated:{" "}
                      {new Date(formData.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
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
