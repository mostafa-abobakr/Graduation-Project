import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { restaurantStats } from "@/lib/mockData";
import { Building2, MapPin, Users, TrendingUp, Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RestaurantsPage() {
  const active = restaurantStats.filter(r => r.status === "active").length;
  const totalRevenue = restaurantStats.reduce((s, r) => s + r.revenue, 0);
  const totalStaff = restaurantStats.reduce((s, r) => s + r.staff, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="text-muted-foreground">Manage all restaurant locations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Restaurant
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Locations</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{restaurantStats.length}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-primary">{active}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">${totalRevenue.toLocaleString()}</div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Staff</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-number text-foreground">{totalStaff}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurantStats.map((r) => (
          <Card key={r.id} className="p-6 bg-card border-border/60 premium-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{r.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {r.city}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "active" ? "default" : "secondary"} className={r.status === "active" ? "bg-primary/15 text-primary border-0" : ""}>
                  {r.status === "active" ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">Manager: <span className="text-foreground">{r.manager}</span></div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-sm font-semibold text-foreground">${r.revenue.toLocaleString()}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground">Visitors</div>
                <div className="text-sm font-semibold text-foreground">{r.visitors}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground">Waste</div>
                <div className={`text-sm font-semibold ${r.waste > 6 ? "text-destructive" : "text-primary"}`}>{r.waste}%</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground">Staff</div>
                <div className="text-sm font-semibold text-foreground">{r.staff}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
