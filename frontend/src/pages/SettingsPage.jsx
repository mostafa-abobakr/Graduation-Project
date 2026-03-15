import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
export default function SettingsPage() {
  const [settings, setSettings] = useState({ name: "The Green Kitchen", capacity: "120", openTime: "09:00", closeTime: "23:00", emailNotifs: true, pushNotifs: true, wasteAlerts: true, weeklyReport: true });
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div><h1 className="text-2xl font-bold text-foreground">Settings</h1><p className="text-muted-foreground">Configure your restaurant profile</p></div>
      <Card className="p-6 bg-card border-border/60 premium-shadow"><h3 className="text-base font-semibold text-foreground mb-4">Restaurant Details</h3><div className="space-y-4"><div><Label className="text-foreground">Restaurant Name</Label><Input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div><div><Label className="text-foreground">Seating Capacity</Label><Input type="number" value={settings.capacity} onChange={e => setSettings({ ...settings, capacity: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div><div className="grid grid-cols-2 gap-4"><div><Label className="text-foreground">Opening Time</Label><Input type="time" value={settings.openTime} onChange={e => setSettings({ ...settings, openTime: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div><div><Label className="text-foreground">Closing Time</Label><Input type="time" value={settings.closeTime} onChange={e => setSettings({ ...settings, closeTime: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div></div></div></Card>
      <Card className="p-6 bg-card border-border/60 premium-shadow"><h3 className="text-base font-semibold text-foreground mb-4">Notifications</h3><div className="space-y-4">{[["emailNotifs", "Email Notifications", "Receive daily summary and alerts via email"],["pushNotifs", "Push Notifications", "Get real-time alerts on your browser"],["wasteAlerts", "Waste Alerts", "Alert when waste exceeds threshold"],["weeklyReport", "Weekly Report", "Automated weekly performance digest"]].map(([key, label, desc]) => (<div key={key} className="flex items-center justify-between"><div><div className="text-sm font-medium text-foreground">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div><Switch checked={settings[key]} onCheckedChange={v => setSettings({ ...settings, [key]: v })} /></div>))}</div></Card>
      <Button>Save Changes</Button>
    </div>
  );
}
