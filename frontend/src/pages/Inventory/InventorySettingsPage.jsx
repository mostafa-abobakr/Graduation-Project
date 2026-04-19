import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventoryStore } from "@/lib/inventoryStore";
import { Settings as SettingsIcon, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

export default function InventorySettingsPage() {
  const { items, settings, updateSettings, updateItem, predictRunouts } = useInventoryStore();
  const [draft, setDraft] = useState(settings);
  const [thresholds, setThresholds] = useState(() => Object.fromEntries(items.map((i) => [i.id, i.reorderLevel])));

  const saveGlobal = () => {
    updateSettings({
      expiryAlertDays: Math.max(1, parseInt(draft.expiryAlertDays) || 5),
      defaultReorderLevel: Math.max(1, parseInt(draft.defaultReorderLevel) || 10),
    });
    toast.success("Global settings saved");
  };

  const savePerItem = () => {
    Object.entries(thresholds).forEach(([id, val]) => {
      const v = parseFloat(val);
      if (!isNaN(v) && v >= 0) updateItem(Number(id), { reorderLevel: v });
    });
    toast.success("Per-item thresholds updated");
  };

  const predictions = predictRunouts().slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><SettingsIcon className="h-6 w-6" />Inventory Settings</h1>
        <p className="text-muted-foreground">Tune alert thresholds and AI recommendations</p>
      </div>

      <Card className="p-5 bg-card border-border/60">
        <h3 className="font-semibold text-foreground mb-4">Global thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Expiry alert window (days)</Label>
            <Input type="number" min={1} value={draft.expiryAlertDays} onChange={(e) => setDraft({ ...draft, expiryAlertDays: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Items expiring within this many days trigger an alert.</p>
          </div>
          <div>
            <Label>Default reorder level (new items)</Label>
            <Input type="number" min={1} value={draft.defaultReorderLevel} onChange={(e) => setDraft({ ...draft, defaultReorderLevel: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Used when a new item is added without a custom value.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={saveGlobal} className="gap-2"><Save className="h-4 w-4" />Save global</Button></div>
      </Card>

      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Per-item low-stock thresholds</h3>
            <p className="text-xs text-muted-foreground">Override the reorder level for each item.</p>
          </div>
          <Button onClick={savePerItem} className="gap-2"><Save className="h-4 w-4" />Save thresholds</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/60 bg-muted/40">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Item</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stock</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Reorder ≤</th>
            </tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-2 px-4 font-medium">{i.name}</td>
                  <td className="py-2 px-4 text-muted-foreground">{i.category}</td>
                  <td className="py-2 px-4 text-right font-mono">{i.quantity} {i.unit}</td>
                  <td className="py-2 px-4 text-right">
                    <Input type="number" className="w-24 ml-auto text-right font-mono"
                      value={thresholds[i.id] ?? i.reorderLevel}
                      onChange={(e) => setThresholds({ ...thresholds, [i.id]: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 bg-card border-border/60">
        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI predictions</h3>
        <p className="text-xs text-muted-foreground mb-4">Based on average daily consumption from the past 14 days.</p>
        <div className="space-y-2">
          {predictions.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
              <div>
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">Avg {p.avgDaily} {p.unit}/day</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${p.daysLeft <= 3 ? "text-destructive" : p.daysLeft <= 7 ? "text-warning" : "text-foreground"}`}>
                  {p.daysLeft >= 999 ? "—" : `${p.daysLeft}d left`}
                </div>
                <div className="text-xs text-muted-foreground">Reorder ~{p.recommendedReorder} {p.unit}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
