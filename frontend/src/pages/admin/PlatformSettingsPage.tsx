import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "ZeroWaste AI",
    supportEmail: "support@zerowaste.ai",
    maxRestaurants: 50,
    allowSignups: true,
    maintenanceMode: false,
    emailNotifications: true,
    slackAlerts: false,
    autoBackup: true,
    dataRetentionDays: 90,
  });

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">Admin</Badge>
        </div>
        <p className="text-muted-foreground">Configure global platform settings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/60 premium-shadow space-y-4">
          <h3 className="text-base font-semibold text-foreground">General</h3>
          <div className="space-y-2">
            <Label>Platform Name</Label>
            <Input value={settings.platformName} onChange={e => update("platformName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input value={settings.supportEmail} onChange={e => update("supportEmail", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max Restaurants</Label>
            <Input type="number" value={settings.maxRestaurants} onChange={e => update("maxRestaurants", +e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Retention (days)</Label>
            <Input type="number" value={settings.dataRetentionDays} onChange={e => update("dataRetentionDays", +e.target.value)} />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/60 premium-shadow space-y-5">
          <h3 className="text-base font-semibold text-foreground">Toggles</h3>
          {[
            { key: "allowSignups", label: "Allow New Signups", desc: "Let new restaurants register on the platform" },
            { key: "maintenanceMode", label: "Maintenance Mode", desc: "Show maintenance page to all users" },
            { key: "emailNotifications", label: "Email Notifications", desc: "Send email alerts for critical events" },
            { key: "slackAlerts", label: "Slack Alerts", desc: "Push critical alerts to Slack channel" },
            { key: "autoBackup", label: "Auto Backup", desc: "Nightly automatic database backups" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={(settings as any)[key]} onCheckedChange={v => update(key, v)} />
            </div>
          ))}
        </Card>
      </div>

      <Button onClick={() => toast({ title: "Settings saved", description: "Platform settings updated successfully." })}>
        Save Changes
      </Button>
    </div>
  );
}
