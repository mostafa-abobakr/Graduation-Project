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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SummaryCard } from "@/components/shared/SummaryCard";


const SHIFT_OPTIONS = ["Morning", "Evening", "Night"];

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    role: "Employee",
    salary: "",
    phone: "",
    status: "Active",
    shift: "Morning",
    workingHoursPerDay: "8",
    workingDaysPerWeek: "5",
    email: "",
    password: ""
  });

function getToken() {
  let token = localStorage.getItem("authToken");
  if (!token) {
    const stored = localStorage.getItem("user");
    if (stored) token = JSON.parse(stored).token;
  }
  return token;
}

function getRestIdFromToken() {
  try {
    const token = getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.RestID || payload.restId || payload.restID || "0", 10);
    }
  } catch { /* ignore */ }
  return 0;
}

  /* ── Fetch employees ──────────────────────────────────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("https://resturantai.runasp.net/api/Employees", {
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        });
        if (res.ok) setEmployees(await res.json());
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, [refreshKey]);

  /* ── Add employee ─────────────────────────────────────── */
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        restID: getRestIdFromToken(),
        fullName: formData.fullName,
        role: formData.role,
        salary: parseFloat(formData.salary) || 0,
        phone: formData.phone,
        status: formData.status,
        shift: formData.shift,
        workingHoursPerDay: parseInt(formData.workingHoursPerDay, 10) || 0,
        workingDaysPerWeek: parseInt(formData.workingDaysPerWeek, 10) || 0,
        email: formData.email,
        password: formData.password,
      };

      const res = await fetch("http://resturantai.runasp.net/api/Employees", {
        method: "POST",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to add employee");

      toast.success("Employee added successfully!");
      setIsModalOpen(false);
      setFormData({
        fullName: "", role: "Employee", salary: "", phone: "", status: "Active",
        shift: "Morning", workingHoursPerDay: "8", workingDaysPerWeek: "5", email: "", password: ""
      });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        if (!token) return;

        const response = await fetch("http://resturantai.runasp.net/api/Employees", {
          headers: {
            "Accept": "*/*",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, [refreshKey]);

  const active = employees.filter((s) => s.status === "Active").length;
  const totalHours = employees.reduce((acc, curr) => acc + (curr.workingHoursPerDay * curr.workingDaysPerWeek), 0);
  const totalSalaryBill = employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
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
        <h3 className="text-base font-semibold text-foreground mb-4">Staff Directory</h3>
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
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Employee Name</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hire Date</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Salary / Schedule</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.empID} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                        {e.fullName ? e.fullName.split(' ').map(n => n[0]).join('') : ''}
                      </div>
                      <span className="text-foreground font-medium">{e.fullName}</span>
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
                    <div className="text-foreground font-mono font-medium">${e.salary}</div>
                    <div className="text-xs text-muted-foreground">{e.shift} ({e.workingDaysPerWeek}d x {e.workingHoursPerDay}h)</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={e.status === "Active" ? "default" : "secondary"}
                      className={e.status === "Active" ? "bg-primary/15 text-primary border-0" : ""}
                    >
                      {e.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-muted-foreground">
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

      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        icon={Users}
        title={isAdmin ? "Staff Management Dashboard" : "Staff Management"}
        description={isAdmin ? "Global employee overview and directories" : "Manage your employees and schedules"}
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      >
        {isAdmin && (
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">Admin</Badge>
        )}
      </PageHeader>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Staff"
          value={isLoading ? <Skeleton className="h-8 w-20" /> : employees.length}
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
          value={isLoading ? <Skeleton className="h-8 w-20" /> : `${totalHours}h`}
          icon={Clock}
          iconWrapper
        />
        <SummaryCard
          title="Monthly Salary Bill"
          value={isLoading ? <Skeleton className="h-8 w-20" /> : `$${totalSalaryBill.toLocaleString()}`}
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
                <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Employee</th>
                <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Role</th>
                <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Contact</th>
                <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Hire Date</th>
                <th className="text-center py-3 px-5 text-muted-foreground font-semibold">Schedule</th>
                <th className="text-right py-3 px-5 text-muted-foreground font-semibold">Salary</th>
                <th className="text-center py-3 px-5 text-muted-foreground font-semibold">Status</th>
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
                    <td className="py-4 px-5"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-5"><div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></td>
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
                  <tr key={e.empID} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {initials(e.fullName)}
                        </div>
                        <span className="text-foreground font-semibold">{e.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground">{e.role}</td>
                    <td className="py-4 px-5">
                      <div className="text-sm text-foreground">{e.email}</div>
                      <div className="text-xs text-muted-foreground">{e.phone}</div>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground">
                      {e.hireDate ? new Date(e.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="py-4 px-5 text-center text-muted-foreground">
                      <div className="text-xs">{e.shift}</div>
                      <div className="text-xs opacity-70">{e.workingDaysPerWeek}d × {e.workingHoursPerDay}h</div>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-medium text-foreground">
                      ${e.salary?.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Badge
                        variant={e.status === "Active" ? "default" : "secondary"}
                        className={e.status === "Active" ? "bg-primary/15 text-primary border-0" : ""}
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
          <form onSubmit={handleAddEmployee}>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <select
                    id="shift"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    {SHIFT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="01010000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary ($)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="2500"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password123!"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
