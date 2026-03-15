import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingDown, ArrowUpRight, ArrowDownRight, UserPlus, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const overviewStats = [
  { label: "Monthly Recurring Revenue", value: "$12,400", change: "+8.2%", up: true, icon: DollarSign },
  { label: "Total Customers", value: "312", change: "+14", up: true, icon: Users },
  { label: "Churn Rate", value: "2.1%", change: "-0.3%", up: false, icon: TrendingDown },
  { label: "Avg Revenue Per User", value: "$39.74", change: "+$1.20", up: true, icon: DollarSign },
];

const planDistribution = [
  { name: "Starter", customers: 142, revenue: 0, color: "hsl(var(--muted-foreground))" },
  { name: "Pro", customers: 128, revenue: 6272, color: "hsl(var(--primary))" },
  { name: "Enterprise", customers: 42, revenue: 6258, color: "hsl(var(--accent-foreground))" },
];

const growthMetrics = [
  { month: "Oct", signups: 18, upgrades: 8, downgrades: 3 },
  { month: "Nov", signups: 24, upgrades: 11, downgrades: 2 },
  { month: "Dec", signups: 15, upgrades: 6, downgrades: 5 },
  { month: "Jan", signups: 28, upgrades: 14, downgrades: 3 },
  { month: "Feb", signups: 32, upgrades: 12, downgrades: 4 },
  { month: "Mar", signups: 22, upgrades: 9, downgrades: 2 },
];

const customers = [
  { name: "Bella's Kitchen", plan: "Pro", status: "Active", mrr: "$49", joined: "Jan 15, 2025" },
  { name: "Urban Grill Co.", plan: "Enterprise", status: "Active", mrr: "$149", joined: "Mar 3, 2025" },
  { name: "Sakura Sushi Bar", plan: "Pro", status: "Active", mrr: "$49", joined: "May 20, 2025" },
  { name: "The Green Plate", plan: "Starter", status: "Active", mrr: "$0", joined: "Jul 8, 2025" },
  { name: "Pasta Paradise", plan: "Pro", status: "Past Due", mrr: "$49", joined: "Aug 12, 2025" },
  { name: "Smokehouse BBQ", plan: "Enterprise", status: "Active", mrr: "$149", joined: "Sep 1, 2025" },
  { name: "Café Lumière", plan: "Starter", status: "Active", mrr: "$0", joined: "Oct 22, 2025" },
  { name: "Taco Fiesta", plan: "Pro", status: "Cancelled", mrr: "$0", joined: "Nov 5, 2025" },
];

const recentTransactions = [
  { customer: "Urban Grill Co.", type: "Renewal", amount: "$149.00", date: "Mar 3, 2026" },
  { customer: "Bella's Kitchen", type: "Renewal", amount: "$49.00", date: "Mar 1, 2026" },
  { customer: "Smokehouse BBQ", type: "Upgrade", amount: "$149.00", date: "Feb 28, 2026" },
  { customer: "Sakura Sushi Bar", type: "Renewal", amount: "$49.00", date: "Feb 20, 2026" },
  { customer: "Pasta Paradise", type: "Payment Failed", amount: "$49.00", date: "Feb 12, 2026" },
];

export default function AdminBillingView() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <Card key={stat.label} className="p-5 bg-card border-border/60">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><stat.icon className="h-4 w-4 text-primary" /></div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {stat.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border/60">
          <h3 className="font-semibold text-foreground mb-4">Growth Metrics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={growthMetrics} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="New Signups" />
              <Bar dataKey="upgrades" fill="hsl(var(--primary) / 0.5)" radius={[3, 3, 0, 0]} name="Upgrades" />
              <Bar dataKey="downgrades" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} name="Downgrades" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5 bg-card border-border/60">
          <h3 className="font-semibold text-foreground mb-4">Plan Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="customers">
                  {planDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {planDistribution.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: plan.color }} />
                    <span className="text-sm text-foreground">{plan.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">{plan.customers}</span>
                    <span className="text-xs text-muted-foreground ml-1">customers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Customer Breakdown</h2>
          <Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Export List</Button>
        </div>
        <Card className="bg-card border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Restaurant</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Plan</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">MRR</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Joined</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3"><Badge variant={c.plan === "Enterprise" ? "default" : "secondary"} className="text-xs">{c.plan}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="secondary" className={`text-xs font-normal ${c.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : c.status === "Past Due" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-destructive/10 text-destructive"}`}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-foreground">{c.mrr}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="h-7 text-xs"><ArrowUpRight className="h-3 w-3 mr-1" />View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Platform Transactions</h2>
        <Card className="bg-card border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.customer}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className={`text-xs font-normal ${t.type === "Upgrade" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : t.type === "Payment Failed" ? "bg-destructive/10 text-destructive" : ""}`}>{t.type}</Badge></td>
                    <td className="px-4 py-3 text-foreground">{t.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
