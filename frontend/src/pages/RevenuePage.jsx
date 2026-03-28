import { Card } from "@/components/ui/card";
import { dailyData, revenueByItem } from "@/lib/mockData";
import {
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
import { useChartTheme } from "@/hooks/useChartTheme";
import { DollarSign } from "lucide-react";
export default function RevenuePage() {
  const ct = useChartTheme();
  const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = Math.round(totalRevenue / dailyData.length);
  return (
    <div className="space-y-5 animate-fade-in py-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
          <p className="text-muted-foreground text-sm">Revenue trends and profit analysis</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="text-sm text-muted-foreground mb-2">
            30-Day Revenue
          </div>
          <div className="stat-number text-foreground">
            ${totalRevenue.toLocaleString()}
          </div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="text-sm text-muted-foreground mb-2">
            Daily Average
          </div>
          <div className="stat-number text-foreground">
            ${avgDaily.toLocaleString()}
          </div>
        </Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow">
          <div className="text-sm text-muted-foreground mb-2">
            Avg. Profit Margin
          </div>
          <div className="stat-number text-primary">
            {Math.round(
              revenueByItem.reduce((s, i) => s + i.margin, 0) /
                revenueByItem.length,
            )}
            %
          </div>
        </Card>
      </div>
      <Card className="p-6 bg-card border-border/60 premium-shadow">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Daily Revenue
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
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
              tick={{ ...ct.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={ct.tick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip {...ct.tooltip} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(160 84% 39%)"
              fill="url(#revGrad2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Revenue by Item
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByItem} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
                width={120}
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
        <Card className="p-6 bg-card border-border/60 premium-shadow">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Profit Margin by Item
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByItem} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={ct.tick}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip {...ct.tooltip} />
              <Bar
                dataKey="margin"
                fill="hsl(210 76% 52%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
