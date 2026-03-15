import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { menuAnalytics } from "@/lib/mockData";
import { useState } from "react";
import { ArrowUp, ArrowDown, Search } from "lucide-react";

export default function MenuAnalyticsPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("ordersToday");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = menuAnalytics
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === "name") return mult * a.name.localeCompare(b.name);
      return mult * (a[sortKey] - b[sortKey]);
    });

  const SortIcon = ({ col }) => sortKey === col ? (sortAsc ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-foreground">Menu Analytics</h1><p className="text-muted-foreground">Performance metrics for each menu item</p></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border/60" /></div>
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                {[["name", "Menu Item"], ["cost", "Cost"], ["price", "Price"], ["ordersToday", "Orders Today"], ["predictedDemand", "Predicted Demand"], ["wastePercent", "Waste %"]].map(([key, label]) => (
                  <th key={key} className="text-left py-3 px-4 text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(key)}>{label}<SortIcon col={key} /></th>
                ))}
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{item.image} {item.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">${item.cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-foreground">${item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-foreground mono">{item.ordersToday}</td>
                  <td className="py-3 px-4 text-primary font-semibold mono">{item.predictedDemand}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${item.wastePercent > 8 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{item.wastePercent}%</span></td>
                  <td className="py-3 px-4"><span className={`flex items-center gap-1 text-xs ${item.trend === "up" ? "text-primary" : "text-destructive"}`}>{item.trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{item.trendValue}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
