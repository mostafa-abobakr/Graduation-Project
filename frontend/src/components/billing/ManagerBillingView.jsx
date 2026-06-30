import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, Zap, Crown, Building2, Download, ArrowUpRight } from "lucide-react";

const plans = [
  { name: "Operations Pro", price: "$49", interval: "/month", description: "Ideal for growing restaurants focusing on core operations.", features: ["Dashboard & POS System", "AI Insights & Demand Forecasting", "Inventory Alerts & Forecasting", "Menu Management & Analytics", "Revenue Tracking & Reports"], current: true, cta: "Current Plan", accent: true },
  { name: "Full Management Suite", price: "$129", interval: "/month", description: "For premium restaurants that need full staff and operations management.", features: ["All Operations Pro Features", "Staff Management", "Smart Staff Scheduling", "Advanced Priority Support"], current: false, cta: "Upgrade", accent: false },
];

const paymentHistory = [
  { id: "INV-2024-012", date: "Mar 1, 2026", amount: "$49.00", status: "Paid", plan: "Pro" },
  { id: "INV-2024-011", date: "Feb 1, 2026", amount: "$49.00", status: "Paid", plan: "Pro" },
  { id: "INV-2024-010", date: "Jan 1, 2026", amount: "$49.00", status: "Paid", plan: "Pro" },
  { id: "INV-2024-009", date: "Dec 1, 2025", amount: "$49.00", status: "Paid", plan: "Pro" },
  { id: "INV-2024-008", date: "Nov 1, 2025", amount: "$49.00", status: "Paid", plan: "Pro" },
];

const usageStats = [
  { label: "AI Insights Generated", used: 847, limit: 1000, unit: "queries" },
  { label: "Data Storage", used: 2.4, limit: 5, unit: "GB" },
  { label: "API Calls", used: 12450, limit: 50000, unit: "calls" },
  { label: "Team Members", used: 4, limit: 10, unit: "seats" },
];

export default function ManagerBillingView() {
  return (
    <div className="space-y-8">
      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><Crown className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="flex items-center gap-2"><h3 className="font-semibold text-foreground">Pro Plan</h3><Badge variant="secondary" className="text-xs">Active</Badge></div>
              <p className="text-sm text-muted-foreground">Next billing date: April 1, 2026 · $49.00</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Cancel Subscription</Button>
            <Button size="sm">Manage Payment Method</Button>
          </div>
        </div>
      </Card>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Usage This Period</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usageStats.map((stat) => {
            const pct = (stat.used / stat.limit) * 100;
            return (
              <Card key={stat.label} className="p-4 bg-card border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                  <span className="text-xs text-muted-foreground">{typeof stat.used === "number" && stat.used % 1 !== 0 ? stat.used.toFixed(1) : stat.used.toLocaleString()} / {typeof stat.limit === "number" && stat.limit % 1 !== 0 ? stat.limit.toFixed(1) : stat.limit.toLocaleString()} {stat.unit}</span>
                </div>
                <Progress value={pct} className="h-2" />
                {pct > 80 && <p className="text-xs text-destructive mt-1.5">Approaching limit — consider upgrading</p>}
              </Card>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.name} className={`p-6 flex flex-col border-border/60 ${plan.accent ? "ring-2 ring-primary/40 bg-primary/[0.03]" : "bg-card"}`}>
              <div className="flex items-center gap-2 mb-1">
                {plan.name === "Operations Pro" && <Crown className="h-4 w-4 text-primary" />}
                {plan.name === "Full Management Suite" && <Building2 className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                {plan.current && <Badge className="ml-auto text-[10px]">Current</Badge>}
              </div>
              <div className="mt-2 mb-1"><span className="text-3xl font-bold text-foreground">{plan.price}</span><span className="text-sm text-muted-foreground">{plan.interval}</span></div>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-foreground"><Check className="h-3.5 w-3.5 text-primary shrink-0" />{f}</li>)}
              </ul>
              <Button variant={plan.current ? "secondary" : plan.accent ? "default" : "outline"} className="w-full" disabled={plan.current}>{plan.cta}</Button>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
        <Card className="bg-card border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Invoice</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Plan</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{inv.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.plan}</td>
                    <td className="px-4 py-3 text-foreground">{inv.amount}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs font-normal">{inv.status}</Badge></td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="h-7 text-xs"><ArrowUpRight className="h-3 w-3 mr-1" />View</Button></td>
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
