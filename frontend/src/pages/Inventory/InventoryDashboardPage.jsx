import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useInventoryStore, computeStatus, statusMeta } from "@/lib/inventoryStore";
import { Package, AlertTriangle, Clock, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
} from "recharts";

export default function InventoryDashboardPage() {
  const { items, usageLog, settings, resolvedAlertKeys } = useInventoryStore();

  const enriched = useMemo(() => items.map((i) => ({ ...i, status: computeStatus(i, settings) })), [items, settings]);

  const stats = useMemo(() => {
    const lowStock = enriched.filter((i) => i.status === "low" || i.status === "critical" || i.status === "out").length;
    const expiring = enriched.filter((i) => i.status === "expiring").length;
    const totalQty = enriched.reduce((s, i) => s + i.quantity, 0);
    const totalValue = enriched.reduce((s, i) => s + i.quantity * (i.cost || 0), 0);
    return { totalItems: enriched.length, lowStock, expiring, totalQty, totalValue };
  }, [enriched]);

  // Stock usage over last 14 days
  const usageOverTime = useMemo(() => {
    const map = {};
    const days = 14;
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const iso = date.toISOString().split("T")[0];
      map[iso] = { date: iso, label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), used: 0 };
    }
    usageLog.filter((u) => u.type === "used" && map[u.date]).forEach((u) => { map[u.date].used += u.quantity; });
    return Object.values(map);
  }, [usageLog]);

  // Top consumed items (last 14 days)
  const topConsumed = useMemo(() => {
    const totals = {};
    usageLog.filter((u) => u.type === "used").forEach((u) => {
      totals[u.itemId] = (totals[u.itemId] || 0) + u.quantity;
    });
    return Object.entries(totals)
      .map(([id, used]) => {
        const item = items.find((i) => i.id === Number(id));
        return item ? { name: item.name, used: +used.toFixed(1) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.used - a.used)
      .slice(0, 6);
  }, [usageLog, items]);

  const activeAlerts = enriched
    .filter((i) => ["critical", "out", "expiring", "low"].includes(i.status))
    .filter((i) => !resolvedAlertKeys.includes(`${i.id}-${i.status}`))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Dashboard</h1>
        <p className="text-muted-foreground">Live snapshot of stock health, usage, and alerts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total items" value={stats.totalItems} sub={`${stats.totalQty.toFixed(0)} units in stock`} />
        <StatCard icon={AlertTriangle} label="Low / Critical" value={stats.lowStock} sub="Need attention" tone="destructive" />
        <StatCard icon={Clock} label="Expiring soon" value={stats.expiring} sub={`Within ${settings.expiryAlertDays} days`} tone="warning" />
        <StatCard icon={TrendingUp} label="Stock value" value={`$${stats.totalValue.toFixed(0)}`} sub="At current cost" tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-card border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Stock usage over time</h3>
              <p className="text-xs text-muted-foreground">Total units consumed per day (last 14 days)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={usageOverTime}>
              <defs>
                <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="used" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#usageFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 bg-card border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Top consumed</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topConsumed} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={90} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="used" radius={[0, 4, 4, 0]}>
                {topConsumed.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5 bg-card border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Quick alerts</h3>
            <p className="text-xs text-muted-foreground">Items needing immediate attention</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/inventory/alerts">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-primary opacity-60" />
            All good — no active alerts.
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((i) => (
              <div key={`${i.id}-${i.status}`} className={`flex items-center justify-between p-3 rounded-lg border ${i.status === "critical" || i.status === "out" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-4 w-4 ${i.status === "critical" || i.status === "out" ? "text-destructive" : "text-warning"}`} />
                  <div>
                    <div className="font-medium text-sm text-foreground">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.quantity} {i.unit} • {i.category}</div>
                  </div>
                </div>
                <Badge className={statusMeta[i.status].class + " border-0"}>{statusMeta[i.status].label}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  const toneClass = tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card className="p-5 bg-card border-border/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <div className={`text-3xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}
