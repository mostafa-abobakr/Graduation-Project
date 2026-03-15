import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, ShieldCheck, UserCheck } from "lucide-react";

const users = [
  { id: 1, name: "Ahmed Hassan", email: "ahmed@zerowaste-downtown.com", role: "manager", restaurant: "ZeroWaste Downtown", status: "active", lastLogin: "2026-03-08" },
  { id: 2, name: "Fatima Ali", email: "fatima@zerowaste-marina.com", role: "manager", restaurant: "ZeroWaste Marina", status: "active", lastLogin: "2026-03-07" },
  { id: 3, name: "Omar Khalil", email: "omar@zerowaste-mall.com", role: "manager", restaurant: "ZeroWaste Mall", status: "active", lastLogin: "2026-03-08" },
  { id: 4, name: "Sara Mohamed", email: "sara@zerowaste-airport.com", role: "manager", restaurant: "ZeroWaste Airport", status: "inactive", lastLogin: "2026-02-28" },
  { id: 5, name: "Admin User", email: "admin@restaurant.com", role: "admin", restaurant: "All Locations", status: "active", lastLogin: "2026-03-08" },
];

export default function UsersPage() {
  const activeUsers = users.filter(u => u.status === "active").length;
  const admins = users.filter(u => u.role === "admin").length;
  const managers = users.filter(u => u.role === "manager").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users & Managers</h1>
          <p className="text-muted-foreground">Manage platform users and access</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Users</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{users.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-primary">{activeUsers}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Admins</span>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{admins}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Managers</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{managers}</div>
        </Card>
      </div>

      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Restaurant</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Last Login</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-foreground font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className={user.role === "admin" ? "bg-primary/15 text-primary border-0" : ""}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.restaurant}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.status === "active" ? "default" : "secondary"} className={user.status === "active" ? "bg-primary/15 text-primary border-0" : ""}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.lastLogin}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
