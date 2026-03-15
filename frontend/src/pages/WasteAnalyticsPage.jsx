import { Card } from "@/components/ui/card";
import { dailyData, wasteByItem } from "@/lib/mockData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useChartTheme } from "./DashboardPage";
const COLORS = ["hsl(160 84% 39%)", "hsl(210 76% 52%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)", "hsl(173 58% 39%)", "hsl(280 60% 55%)", "hsl(30 80% 55%)", "hsl(180 60% 45%)"];
export default function WasteAnalyticsPage() {
  const ct = useChartTheme();
  const totalWaste = wasteByItem.reduce((s, i) => s + i.waste, 0);
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-foreground">Waste Analytics</h1><p className="text-muted-foreground">Track and reduce food waste across your restaurant</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">Today's Waste</div><div className="stat-number text-foreground">{totalWaste} kg</div></Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">Waste Cost</div><div className="stat-number text-foreground">${wasteByItem.reduce((s, i) => s + i.cost, 0).toFixed(0)}</div></Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">30-Day Reduction</div><div className="stat-number text-primary">-23%</div></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/60 premium-shadow"><h3 className="text-base font-semibold text-foreground mb-4">Daily Waste (30 Days)</h3><ResponsiveContainer width="100%" height={280}><BarChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke={ct.grid} /><XAxis dataKey="label" tick={{ ...ct.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval={3} /><YAxis tick={ct.tick} axisLine={false} tickLine={false} unit="%" /><Tooltip {...ct.tooltip} /><Bar dataKey="waste" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        <Card className="p-6 bg-card border-border/60 premium-shadow"><h3 className="text-base font-semibold text-foreground mb-4">Waste by Menu Item</h3><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={wasteByItem} dataKey="waste" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>{wasteByItem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip {...ct.tooltip} /></PieChart></ResponsiveContainer><div className="flex flex-wrap gap-3 mt-2 justify-center">{wasteByItem.map((item, i) => (<span key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{item.name}</span>))}</div></Card>
        <Card className="p-6 bg-card border-border/60 premium-shadow lg:col-span-2"><h3 className="text-base font-semibold text-foreground mb-4">Waste Reduction Over Time</h3><ResponsiveContainer width="100%" height={250}><LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke={ct.grid} /><XAxis dataKey="label" tick={{ ...ct.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval={3} /><YAxis tick={ct.tick} axisLine={false} tickLine={false} unit="%" /><Tooltip {...ct.tooltip} /><Line type="monotone" dataKey="waste" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
      </div>
    </div>
  );
}
