import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
    </div>
  );
}
