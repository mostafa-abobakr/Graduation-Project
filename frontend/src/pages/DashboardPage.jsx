import { Card } from "@/components/ui/card";
// Removed todaySummary since it was only used in the old ManagerDashboard
import { dailyData, restaurantStats, platformSummary } from "@/lib/mockData";
import {
  Users,
  DollarSign,
  Trash2,
  Building2,
  Store,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

// Import your newly converted ManagerDashboard!
// IMPORTANT: Adjust this path based on where your file is located.
import ManagerDashboard from "./ManagerDashboard";

const adminStatCards = [
  {
    title: "Total Restaurants",
    value: platformSummary.totalRestaurants,
    change: 0,
    icon: Building2,
    prefix: "",
  },
  {
    title: "Platform Revenue",
    value: platformSummary.totalRevenue,
    change: platformSummary.revenueChange,
    icon: DollarSign,
    prefix: "$",
  },
  {
    title: "Total Visitors",
    value: platformSummary.totalVisitors,
    change: platformSummary.visitorsChange,
    icon: Users,
    prefix: "",
  },
  {
    title: "Avg Waste",
    value: platformSummary.avgWaste,
    change: platformSummary.wasteChange,
    icon: Trash2,
    prefix: "",
    suffix: "%",
  },
];

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    tooltip: {
      contentStyle: {
        backgroundColor: isDark ? "hsl(224 18% 10%)" : "hsl(0 0% 100%)",
        border: `1px solid ${isDark ? "hsl(224 12% 17%)" : "hsl(220 13% 91%)"}`,
        borderRadius: "8px",
        color: isDark ? "hsl(210 20% 93%)" : "hsl(220 20% 12%)",
        boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
      },
      labelStyle: { color: isDark ? "hsl(220 10% 50%)" : "hsl(220 10% 46%)" },
    },
    grid: isDark ? "hsl(224 12% 17%)" : "hsl(220 13% 91%)",
    tick: {
      fill: isDark ? "hsl(220 10% 50%)" : "hsl(220 10% 46%)",
      fontSize: 12,
    },
  };
}

function AdminDashboard({ ct }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Platform Overview
          </h1>
          <Badge
            variant="outline"
            className="border-primary/30 text-primary text-xs"
          >
            Admin
          </Badge>
        </div>
        <p className="text-muted-foreground">
          All restaurants performance overview
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStatCards.map((stat) => (
          <Card
            key={stat.title}
            className="p-5 bg-card border-border/60 premium-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {stat.title}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="stat-number text-foreground">
              {stat.prefix}
              {stat.value.toLocaleString()}
              {stat.suffix || ""}
            </div>
            {stat.change !== 0 && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${stat.change >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {stat.change >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(stat.change)}% vs last week
              </div>
            )}
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="p-6 pb-0">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            Restaurant Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  Restaurant
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  City
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  Manager
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                  Visitors
                </th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                  Waste %
                </th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                  Orders
                </th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurantStats.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="text-foreground font-medium">
                      {r.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.city}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.manager}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={r.status === "active" ? "default" : "secondary"}
                      className={
                        r.status === "active"
                          ? "bg-primary/15 text-primary border-0"
                          : ""
                      }
                    >
                      {r.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {r.visitors}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ${r.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={
                        r.waste > 6 ? "text-destructive" : "text-primary"
                      }
                    >
                      {r.waste}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {r.orders}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-foreground font-medium">
                      {r.rating}
                    </span>
                    <span className="text-muted-foreground">/5</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Platform Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData.slice(-14)}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(160 84% 39%)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(160 84% 39%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                dataKey="label"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={ct.tick} axisLine={false} tickLine={false} />
              <Tooltip {...ct.tooltip} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(160 84% 39%)"
                fill="url(#revGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Revenue by Restaurant
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={restaurantStats.filter((r) => r.status === "active")}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip {...ct.tooltip} />
              <Bar
                dataKey="revenue"
                fill="hsl(160 84% 39%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const ct = useChartTheme();
  const { isAdmin } = useAuth();

  // Notice we removed `ct={ct}` from ManagerDashboard because your new version
  // uses Tailwind classes to handle themes instead of the `useChartTheme` hook.
  return isAdmin ? <AdminDashboard ct={ct} /> : <ManagerDashboard />;
}
