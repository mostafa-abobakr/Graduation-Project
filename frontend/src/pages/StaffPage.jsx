import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Clock,
  UserCheck,
  Loader2,
  Plus,
  Search,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useStaffQuery, useAddEmployee } from "@/hooks/useStaff";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SummaryCard } from "@/components/shared/SummaryCard";

const SHIFT_OPTIONS = ["Morning", "Evening", "Night"];

export default function StaffPage() {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const token = localStorage.getItem("authToken");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const employeeSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    salary: z.coerce.number().min(0, "Salary must be positive"),
    phone: z.string().min(1, "Phone is required"),
    status: z.string().default("Active"),
    shift: z.string().min(1, "Shift is required"),
    workingHoursPerDay: z.coerce.number().min(1).default(8),
    workingDaysPerWeek: z.coerce.number().min(1).default(5),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 chars"),
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      role: "Cook",
      salary: "",
      phone: "",
      status: "Active",
      shift: "Morning",
      workingHoursPerDay: "8",
      workingDaysPerWeek: "5",
      email: "",
      password: ""
    }
  });

  const { data: employees = [], isLoading, error, isError } = useStaffQuery();
  const addEmployeeMutation = useAddEmployee();

  const handleAddEmployee = (data) => {
    addEmployeeMutation.mutate({
      restID: user?.restId || 0,
      ...data,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };
const active = employees.filter((s) => s.status === "Active").length;
const totalHours = employees.reduce(
  (acc, curr) => acc + curr.workingHoursPerDay * curr.workingDaysPerWeek,
  0,
);
const totalSalaryBill = employees.reduce(
  (acc, curr) => acc + (Number(curr.salary) || 0),
  0,
);
const filtered = employees.filter((employee) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const name = (employee.fullName || "").toLowerCase();
  const role = (employee.role || "").toLowerCase();
  return name.includes(q) || role.includes(q);
});

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const EmployeeTable = () => (
  <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
    <div className="p-6 pb-0">
      <h3 className="text-base font-semibold text-foreground mb-4">
        Staff Directory
      </h3>
    </div>
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                Employee Name
              </th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                Role
              </th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                Contact
              </th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                Hire Date
              </th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                Salary / Schedule
              </th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr
                key={e.empID}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {e.fullName
                        ? e.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                        : ""}
                    </div>
                    <span className="text-foreground font-medium">
                      {e.fullName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{e.role}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  <div className="text-sm">{e.email}</div>
                  <div className="text-xs opacity-70">{e.phone}</div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {new Date(e.hireDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-foreground font-mono font-medium">
                    ${e.salary}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.shift} ({e.workingDaysPerWeek}d x{" "}
                    {e.workingHoursPerDay}h)
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={e.status === "Active" ? "default" : "secondary"}
                    className={
                      e.status === "Active"
                        ? "bg-primary/15 text-primary border-0"
                        : ""
                    }
                  >
                    {e.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {employees.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan="6"
                  className="py-8 text-center text-muted-foreground"
                >
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  </Card>
);

return (
  <div className="space-y-5 animate-fade-in py-5">
    {/* ── Error State ──────────────────────────────────────────── */}
    {isError && (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive font-medium">
          Failed to load employees
        </p>
        <p className="text-destructive/70 text-sm mt-1">
          {error?.message || "Please try refreshing the page"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["employees"] })
          }
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )}

    {/* ── Header ──────────────────────────────────────────── */}
    <PageHeader
      icon={Users}
      title={isAdmin ? "Staff Management Dashboard" : "Staff Management"}
      description={
        isAdmin
          ? "Global employee overview and directories"
          : "Manage your employees and schedules"
      }
      actions={
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      }
    >
      {isAdmin && (
        <Badge
          variant="outline"
          className="border-primary/30 text-primary text-xs"
        >
          Admin
        </Badge>
      )}
    </PageHeader>

    {/* ── KPI Cards ───────────────────────────────────────── */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Staff"
        value={
          isLoading ? <Skeleton className="h-8 w-20" /> : employees.length
        }
        icon={Users}
        iconWrapper
      />
      <SummaryCard
        title="Active Members"
        value={isLoading ? <Skeleton className="h-8 w-20" /> : active}
        icon={UserCheck}
        iconWrapper
        valueColorClass="text-primary"
      />
      <SummaryCard
        title="Weekly Hrs"
        value={
          isLoading ? <Skeleton className="h-8 w-20" /> : `${totalHours}h`
        }
        icon={Clock}
        iconWrapper
      />
      <SummaryCard
        title="Monthly Salary Bill"
        value={
          isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            `$${totalSalaryBill.toLocaleString()}`
          )
        }
        icon={DollarSign}
        iconWrapper
      />
    </div>

    {/* ── Table Card ──────────────────────────────────────── */}
    <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
      <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">
          Staff Directory
          {!isLoading && (
            <Badge
              variant="secondary"
              className="ml-2 bg-primary/10 text-primary border-0 text-xs font-semibold"
            >
              {filtered.length}
            </Badge>
          )}
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Employee
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Role
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Contact
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Hire Date
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                Schedule
              </th>
              <th className="text-right py-3 px-5 text-muted-foreground font-semibold">
                Salary
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    searchQuery={search}
                    searchItemName="employees"
                    onAction={() => setSearch("")}
                    icon={Users}
                    title="No employees found"
                    description="You don't have any employees yet."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.empID}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {initials(e.fullName)}
                      </div>
                      <span className="text-foreground font-semibold">
                        {e.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">
                    {e.role}
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-sm text-foreground">{e.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.phone}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">
                    {e.hireDate
                      ? new Date(e.hireDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "—"}
                  </td>
                  <td className="py-4 px-5 text-center text-muted-foreground">
                    <div className="text-xs">{e.shift}</div>
                    <div className="text-xs opacity-70">
                      {e.workingDaysPerWeek}d × {e.workingHoursPerDay}h
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-medium text-foreground">
                    ${e.salary?.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Badge
                      variant={
                        e.status === "Active" ? "default" : "secondary"
                      }
                      className={
                        e.status === "Active"
                          ? "bg-primary/15 text-primary border-0"
                          : ""
                      }
                    >
                      {e.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>

    {/* ── Add Employee Dialog ──────────────────────────────── */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                
                {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
              </div>
            </div >
            </div>
  <DialogFooter className="mt-2">
    <Button
      type="button"
      variant="ghost"
      onClick={() => setIsModalOpen(false)}
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
          </form >
        </DialogContent >
      </Dialog >
    </div >
  );
}
