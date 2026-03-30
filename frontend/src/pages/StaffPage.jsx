import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, UserCheck, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    role: "staff",
    salary: "",
    phone: "",
    status: "Active",
    shift: "Morning",
    workingHoursPerDay: "8",
    workingDaysPerWeek: "5",
    email: "",
    password: ""
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

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let token = localStorage.getItem("authToken");
      if (!token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) token = JSON.parse(storedUser).token;
      }
      
      const payload = {
        restID: getRestId(),
        fullName: formData.fullName,
        role: formData.role,
        salary: parseFloat(formData.salary) || 0,
        phone: formData.phone,
        status: formData.status,
        shift: formData.shift,
        workingHoursPerDay: parseInt(formData.workingHoursPerDay, 10) || 0,
        workingDaysPerWeek: parseInt(formData.workingDaysPerWeek, 10) || 0,
        email: formData.email,
        password: formData.password
      };

      const response = await fetch("http://resturantai.runasp.net/api/Employees", {
        method: "POST",
        headers: {
          "Accept": "*/*",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log("data"+response);
      if (!response.ok) throw new Error("Failed to add employee");

      toast.success("Employee added successfully!");
      setIsModalOpen(false);
      setFormData({
        fullName: "", role: "staff", salary: "", phone: "", status: "Active",
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
                  {/* <td className="py-3 px-4 text-muted-foreground">staff</td> */}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {isAdmin ? "Staff Management Dashboard" : "Staff Management"}
              </h1>
              {isAdmin && (
                <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? "Global employee overview and directories" : "Manage your employees and performance"}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Staff</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{employees.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active Members</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-primary">{active}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Weekly Staff Hours</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{totalHours}</div>
        </Card>
      </div>

      {/* Table */}
      <EmployeeTable />

      {/* Add Employee Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="staff">staff</option>
                    <option value="chef">chef</option>
                    <option value="waiter">waiter</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift Prefix</Label>
                  <select
                    id="shift"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
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
            <DialogFooter className="mt-2 text-right">
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
