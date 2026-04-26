import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggler } from "@/components/shared/ViewToggler";
import { Link } from "react-router-dom";
import {
  useInventoryStore,
  computeStatus,
  statusMeta,
} from "@/lib/inventoryStore";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  RotateCcw,
  ArrowRight,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";

export default function InventoryAlertsPage() {
  const { items, settings, resolvedAlertKeys, resolveAlert, unresolveAll } =
    useInventoryStore();
  const [filter, setFilter] = useState("active");

  const alerts = useMemo(() => {
    return items
      .map((i) => ({ ...i, status: computeStatus(i, settings) }))
      .filter((i) => ["critical", "out", "expiring", "low"].includes(i.status))
      .map((i) => {
        const key = `${i.id}-${i.status}`;
        const exp = i.expiryDate ? new Date(i.expiryDate) : null;
        const daysToExpiry = exp
          ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24))
          : null;
        let suggestion = "";
        if (i.status === "out")
          suggestion = `Restock immediately — ${Math.max(i.reorderLevel * 2, 10)} ${i.unit} recommended`;
        else if (i.status === "critical")
          suggestion = `Order ${Math.ceil(i.reorderLevel * 2 - i.quantity)} ${i.unit} now`;
        else if (i.status === "low")
          suggestion = `Reorder ${Math.ceil(i.reorderLevel - i.quantity + i.reorderLevel * 0.5)} ${i.unit} soon`;
        else if (i.status === "expiring")
          suggestion = `Use within ${daysToExpiry} day(s) or run a promo`;
        return {
          ...i,
          key,
          daysToExpiry,
          suggestion,
          resolved: resolvedAlertKeys.includes(key),
        };
      });
  }, [items, settings, resolvedAlertKeys]);

  const active = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);
  const list =
    filter === "active" ? active : filter === "resolved" ? resolved : alerts;

  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <PageHeader
        icon={Bell}
        title="Alerts"
        description="Low stock and expiring-soon notifications"
        actions={
          resolvedAlertKeys.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                unresolveAll();
                toast.success("All alerts restored");
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore resolved
            </Button>
          )
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          title="Active"
          value={active.length}
          icon={AlertTriangle}
          iconColorClass="text-destructive"
          valueColorClass="text-destructive"
        />
        <SummaryCard
          title="Resolved"
          value={resolved.length}
          icon={CheckCircle}
          iconColorClass="text-primary"
          valueColorClass="text-primary"
        />
        <SummaryCard
          title="Expiry window"
          value={`${settings.expiryAlertDays}d`}
          icon={Clock}
          iconColorClass="text-warning"
          valueColorClass="text-warning"
        />
      </div>

      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <ViewToggler
            viewMode={filter}
            setViewMode={setFilter}
            modes={["all","active", "resolved"]}
            labels={["All","Active", "Resolved"]}
          />
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-primary opacity-60" />
            <p className="font-medium text-foreground">No {filter} alerts</p>
            <p className="text-sm">You're all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {list.map((a) => {
              const isCritical = a.status === "critical" || a.status === "out";
              return (
                <div
                  key={a.key}
                  className={`p-4 flex flex-wrap items-center justify-between gap-4 ${a.resolved ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-destructive/15" : "bg-warning/15"}`}
                    >
                      {a.status === "expiring" ? (
                        <Clock
                          className={`h-4 w-4 ${isCritical ? "text-destructive" : "text-warning"}`}
                        />
                      ) : (
                        <AlertTriangle
                          className={`h-4 w-4 ${isCritical ? "text-destructive" : "text-warning"}`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {a.name}
                        </span>
                        <Badge
                          className={statusMeta[a.status].class + " border-0"}
                        >
                          {statusMeta[a.status].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Current:{" "}
                        <span className="font-mono text-foreground">
                          {a.quantity} {a.unit}
                        </span>
                        {a.expiryDate && (
                          <>
                            {" "}
                            • Expires:{" "}
                            <span className="text-foreground">
                              {a.expiryDate}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-foreground/80 mt-1">
                        → {a.suggestion}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm" className="gap-1">
                      <Link to={`/dashboard/inventory/${a.id}`}>
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {!a.resolved && (
                      <Button
                        size="sm"
                        onClick={() => {
                          resolveAlert(a.key);
                          toast.success("Alert resolved");
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
