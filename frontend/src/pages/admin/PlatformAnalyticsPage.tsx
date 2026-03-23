import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { restaurantStats, dailyData, platformSummary } from "@/lib/mockData";
import { TrendingUp, TrendingDown, BarChart3, Activity, Trash2, DollarSign } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useChartTheme } from "@/pages/DashboardPage";

const wasteByRestaurant = restaurantStats.map(r => ({
  name: r.name.replace("ZeroWaste ", ""),
  waste: r.waste,
  orders: r.orders,
}));

const COLORS = ["hsl(160 84% 39%)", "hsl(210 76% 52%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"];

export default function PlatformAnalyticsPage() {
  const ct = useChartTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">Admin</Badge>
        </div>
        <p className="text-muted-foreground">Aggregated performance across all restaurants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Platform Revenue", value: `$${platformSummary.totalRevenue.toLocaleString()}`, change: platformSummary.revenueChange, icon: DollarSign },
          { title: "Total Visitors", value: platformSummary.totalVisitors.toLocaleString(), change: platformSummary.visitorsChange, icon: Activity },
          { title: "Total Orders", value: platformSummary.totalOrders.toLocaleString(), change: 7.3, icon: BarChart3 },
          { title: "Avg Waste Rate", value: `${platformSummary.avgWaste}%`, change: platformSummary.wasteChange, icon: Trash2 },
        ].map((stat) => (
          <Card key={stat.title} className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="stat-number text-foreground">{stat.value}</div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${stat.change >= 0 ? "text-primary" : "text-destructive"}`}>
              {stat.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(stat.change)}% vs last week
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">Platform Revenue Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="platRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="label" tick={{ ...ct.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={ct.tick} axisLine={false} tickLine={false} />
              <Tooltip {...ct.tooltip} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(160 84% 39%)" fill="url(#platRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">Waste Rate by Location</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={wasteByRestaurant}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="name" tick={ct.tick} axisLine={false} tickLine={false} />
              <YAxis tick={ct.tick} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...ct.tooltip} />
              <Bar dataKey="waste" radius={[4, 4, 0, 0]}>
                {wasteByRestaurant.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">Orders Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={wasteByRestaurant} dataKey="orders" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {wasteByRestaurant.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...ct.tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">Location Performance Comparison</h3>
          <div className="space-y-4">
            {restaurantStats.filter(r => r.status === "active").map((r) => {
              const maxRev = Math.max(...restaurantStats.map(x => x.revenue));
              const pct = Math.round((r.revenue / maxRev) * 100);
              return (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{r.name.replace("ZeroWaste ", "")}</span>
                    <span className="text-muted-foreground">${r.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
