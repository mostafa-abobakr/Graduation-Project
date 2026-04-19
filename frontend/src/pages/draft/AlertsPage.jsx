import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { mockAlerts } from "../../services/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(mockAlerts);

  const handleResolve = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
    toast.success("Alert marked as resolved");
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  const getAlertIcon = (type) => {
    switch(type) {
      case 'low_stock': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'expiring': return <Clock className="h-5 w-5 text-destructive" />;
      case 'out_of_stock': return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'low_stock': return "border-warning/30 bg-warning/5";
      case 'expiring': return "border-destructive/30 bg-destructive/5";
      case 'out_of_stock': return "border-border bg-muted/20";
      default: return "border-border";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Actionable Alerts</h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
          {activeAlerts.length} Active
        </Badge>
      </div>

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border/50">
            <CheckCircle2 className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
            <p className="text-muted-foreground mt-1 text-sm">There are no active inventory alerts right now.</p>
          </div>
        ) : (
          activeAlerts.map(alert => (
            <Card key={alert.id} className={`shadow-sm border transition-all ${getAlertColor(alert.type)}`}>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border/50">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{alert.item}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-border">
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.message} • Current: <span className="font-mono font-medium text-foreground">{alert.currentQuantity}</span>
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>Dismiss</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {alert.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {resolvedAlerts.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Recently Resolved</h3>
          <div className="space-y-3 opacity-60">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm line-through text-muted-foreground">{alert.item} - {alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
