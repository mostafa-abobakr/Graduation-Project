import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staffMembers, restaurantStats } from "@/lib/mockData";
import { Users, Clock, Award, UserCheck, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const active = staffMembers.filter((s) => s.status === "active").length;
  const totalHours = staffMembers.reduce((s, m) => s + m.hours, 0);

  if (isAdmin) {
    return (
      <div className="space-y-5 animate-fade-in py-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                All Restaurants
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">Staff overview across all locations</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Staff (Platform)</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="stat-number text-foreground">
              {restaurantStats.reduce((s, r) => s + r.staff, 0)}
            </div>
          </Card>
          <Card className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Active Locations</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="stat-number text-primary">
              {restaurantStats.filter((r) => r.status === "active").length}
            </div>
          </Card>
          <Card className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg. Rating</span>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="stat-number text-foreground">
              {(restaurantStats.reduce((s, r) => s + r.rating, 0) / restaurantStats.length).toFixed(1)}
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
          <div className="p-6 pb-0">
            <h3 className="text-base font-semibold text-foreground mb-4">Staff by Location</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Restaurant</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">City</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Manager</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Staff Count</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Rating</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {restaurantStats.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{r.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.city}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.manager}</td>
                    <td className="py-3 px-4 text-right text-foreground">{r.staff}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-foreground font-medium">{r.rating}</span>
                      <span className="text-muted-foreground">/5</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={r.status === "active" ? "default" : "secondary"}
                        className={r.status === "active" ? "bg-primary/15 text-primary border-0" : ""}
                      >
                        {r.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm">Manage your employees, shifts, and performance</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Staff</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{staffMembers.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active Today</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-primary">{active}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Hours This Week</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{totalHours}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Avg. Rating</span>
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">
            {(staffMembers.reduce((s, m) => s + m.rating, 0) / staffMembers.length).toFixed(1)}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Employee</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Shift</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Hours/wk</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((member) => (
                <tr key={member.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {member.avatar}
                      </div>
                      <span className="text-foreground font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{member.role}</td>
                  <td className="py-3 px-4 text-muted-foreground">{member.shift}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={member.status === "active" ? "default" : "secondary"}
                      className={member.status === "active" ? "bg-primary/15 text-primary border-0" : ""}
                    >
                      {member.status === "active" ? "Active" : "On Leave"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground font-mono">{member.hours}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-foreground font-medium">{member.rating}</span>
                    <span className="text-muted-foreground">/5</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
