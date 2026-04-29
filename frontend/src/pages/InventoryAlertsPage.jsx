import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { ViewToggler } from "@/components/shared/ViewToggler";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Bell,
  AlertTriangle,
  Clock,
  PackageX,
  CheckCircle2,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */

const ALERT_TYPE = {
  "Low Stock": {
    icon: PackageX,
    badgeClass: "bg-warning/15 text-warning",
    iconBg: "bg-warning/15",
    iconClass: "text-warning",
    label: "Low Stock",
  },
  Expired: {
    icon: AlertTriangle,
    badgeClass: "bg-destructive/15 text-destructive",
    iconBg: "bg-destructive/15",
    iconClass: "text-destructive",
    label: "Expired",
  },
  "Expiring Soon": {
    icon: Clock,
    badgeClass: "bg-orange-500/15 text-orange-600",
    iconBg: "bg-orange-500/15",
    iconClass: "text-orange-600",
    label: "Expiring Soon",
  },
};

const EXPIRY_TYPES = new Set(["Expired", "Expiring Soon"]);

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AlertRowSkeleton() {
  return (
    <div className="p-4 flex items-center gap-4 border-b border-border/30 last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-7 w-24 rounded-full" />
    </div>
  );
}

/* ── Expiry batch sub-row ────────────────────────────── */
// grid cols: [batch-id] [qty] [expires] [badge]
/* ── Expiry batch sub-row ────────────────────────────── */
function ExpiryBatchRow({ alert }) {
  const days = daysUntil(alert.expiryDate);
  const meta = ALERT_TYPE[alert.alertType] ?? ALERT_TYPE["Expiring Soon"];

  const expiryColor =
    days !== null && days < 0
      ? "text-destructive font-semibold"
      : days !== null && days <= 3
      ? "text-orange-500 font-medium"
      : "text-foreground";

  return (
    <div
      className="grid text-sm py-2 items-center gap-4"
      style={{ gridTemplateColumns: "6rem 8rem 15rem 8rem" }}
    >
      {/* Batch ID - Centered */}
      <span className="text-center text-xs text-muted-foreground/60 font-mono">
        {alert.batchID ? `#${alert.batchID}` : "—"}
      </span>

      {/* Quantity - Centered */}
      <span className="text-center">
        {alert.quantity != null ? (
          <>
            <span className="text-foreground font-mono font-medium">
              {alert.quantity}
            </span>
            <span className="text-muted-foreground ml-1 text-xs">{alert.unit}</span>
          </>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </span>

      {/* Expiry date - Left aligned */}
      <span className={`${expiryColor} text-center`}>
        {alert.expiryDate ? (
          <>
            {fmtDate(alert.expiryDate)}
            {days !== null && (
              <span className="ml-1.5 text-xs opacity-70">
                ({days < 0
                  ? `${Math.abs(days)}d ago`
                  : days === 0
                  ? "today"
                  : `in ${days}d`})
              </span>
            )}
          </>
        ) : "—"}
      </span>

      {/* Badge - Centered using flex */}
      <div className="flex justify-center">
        <Badge className={`${meta.badgeClass} border-0 text-[11px]`}>
          {meta.label}
        </Badge>
      </div>
    </div>
  );
}
/* ── Grouped expiry item row ─────────────────────────── */
function GroupedExpiryRow({ itemName, batches }) {
  const dominantType =
    batches.find((b) => b.alertType === "Expired")?.alertType ??
    batches[0]?.alertType;
  const meta = ALERT_TYPE[dominantType] ?? ALERT_TYPE["Expiring Soon"];
  const AlertIcon = meta.icon;

  return (
    <div className="p-4 hover:bg-muted/20 transition-colors">
      {/* Item header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}
        >
          <AlertIcon className={`h-4 w-4 ${meta.iconClass}`} />
        </div>
        <span className="font-semibold text-foreground">{itemName}</span>
        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
          {batches.length} batch{batches.length > 1 ? "es" : ""}
        </span>
      </div>

      {/* Column headers + batch rows */}
      <div className="ml-10 overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div
            className="grid text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide pb-2 mb-1 border-b border-border/30 gap-4"
            style={{ gridTemplateColumns: "6rem 8rem 15rem 8rem" }}
          >
            <span className="text-center">Batch ID</span>
            <span className="text-center">Quantity</span>
            <span className="text-center">Expires</span>
            <span className="text-center">Status</span>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-border/20">
            {batches.map((batch, idx) => (
              <ExpiryBatchRow key={`${batch.batchID ?? idx}`} alert={batch} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ── Low-stock row (unchanged logic, no view button) ─── */
function LowStockRow({ alert }) {
  const meta = ALERT_TYPE["Low Stock"];
  const AlertIcon = meta.icon;
  const stockPct =
    alert.reorderLevel > 0
      ? Math.min(100, Math.round((alert.stock / alert.reorderLevel) * 100))
      : 100;

  return (
    <div className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}
        >
          <AlertIcon className={`h-4 w-4 ${meta.iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {alert.itemName}
            </span>
            <Badge className={`${meta.badgeClass} border-0 text-[11px]`}>
              {meta.label}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
            <span>
              Stock:{" "}
              <span className="text-foreground font-mono">
                {alert.stock} {alert.unit}
              </span>
            </span>
            {alert.reorderLevel > 0 && (
              <span>
                Reorder level:{" "}
                <span className="text-foreground font-mono">
                  {alert.reorderLevel} {alert.unit}
                </span>
              </span>
            )}
          </div>

          {alert.reorderLevel > 0 && (
            <div className="flex items-center gap-2 mt-2 max-w-xs">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-warning"
                  style={{ width: `${stockPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground mono w-10 text-right">
                {stockPct}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────── */

export default function InventoryAlertsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const {
    data: rawAlerts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventoryAlerts", user?.restId],
    queryFn: async () => {
      const res = await fetch(
        `https://resturantai.runasp.net/api/Inventory/restaurant/${user.restId}/alerts`,
      );
      if (!res.ok) throw new Error("Failed to fetch inventory alerts");
      return res.json();
    },
    enabled: !!user?.restId,
  });

  const filterOptions = ["all", "Low Stock", "Expired", "Expiring Soon"];
  const filterLabels = ["All", "Low Stock", "Expired", "Expiring Soon"];

  const filtered = useMemo(() => {
    let list = rawAlerts;

    if (filter !== "all") {
      list = list.filter((a) => a.alertType === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.itemName.toLowerCase().includes(q));
    }

    return list;
  }, [rawAlerts, filter, search]);

  /* Split into low-stock vs expiry groups */
  const { lowStockAlerts, expiryGroups } = useMemo(() => {
    const lowStock = filtered.filter((a) => a.alertType === "Low Stock");

    // Group expiry alerts by itemName
    const expiryMap = new Map();
    filtered
      .filter((a) => EXPIRY_TYPES.has(a.alertType))
      .forEach((a) => {
        const key = `${a.inventoryID}-${a.itemName}`;
        if (!expiryMap.has(key))
          expiryMap.set(key, { itemName: a.itemName, batches: [] });
        expiryMap.get(key).batches.push(a);
      });

    return { lowStockAlerts: lowStock, expiryGroups: [...expiryMap.values()] };
  }, [filtered]);

  /* summary counts */
  const lowStockCount = rawAlerts.filter(
    (a) => a.alertType === "Low Stock",
  ).length;
  const expiredCount = rawAlerts.filter(
    (a) => a.alertType === "Expired",
  ).length;
  const expiringSoonCount = rawAlerts.filter(
    (a) => a.alertType === "Expiring Soon",
  ).length;

  const totalRows = lowStockAlerts.length + expiryGroups.length;

  if (error) {
    return (
      <div className="space-y-5 py-5 animate-fade-in">
        <PageHeader
          icon={Bell}
          title="Inventory Alerts"
          description="Low stock, expiring, and expired item notifications"
        />
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 mt-5">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">Error Loading Alerts</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <PageHeader
        icon={Bell}
        title="Inventory Alerts"
        description="Low stock, expiring, and expired item notifications"
      />

      {/* ── Summary KPIs ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Low Stock"
          value={isLoading ? "-" : lowStockCount}
          icon={PackageX}
          iconColorClass="text-warning"
          valueColorClass="text-warning"
        />
        <SummaryCard
          title="Expired Batches"
          value={isLoading ? "-" : expiredCount}
          icon={AlertTriangle}
          iconColorClass="text-destructive"
          valueColorClass="text-destructive"
        />
        <SummaryCard
          title="Expiring Soon"
          value={isLoading ? "-" : expiringSoonCount}
          icon={Clock}
          iconColorClass="text-orange-600"
          valueColorClass="text-orange-600"
        />
      </div>

      {/* ── Banner when critical alerts exist ───────── */}
      {!isLoading && (expiredCount > 0 || lowStockCount > 0) && (
        <Card className="p-4 bg-destructive/10 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">
                Immediate action required
              </div>
              <div className="text-sm text-muted-foreground">
                {expiredCount > 0 &&
                  `${expiredCount} expired batch${expiredCount > 1 ? "es" : ""} must be removed. `}
                {lowStockCount > 0 &&
                  `${lowStockCount} item${lowStockCount > 1 ? "s are" : " is"} below the reorder level.`}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Search + Filter ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <ViewToggler
          viewMode={filter}
          setViewMode={setFilter}
          modes={filterOptions}
          labels={filterLabels}
        />
      </div>

      {/* ── Alert List ───────────────────────────────── */}
      {isLoading ? (
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
          <div className="divide-y divide-border/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <AlertRowSkeleton key={i} />
            ))}
          </div>
        </Card>
      ) : totalRows === 0 ? (
        <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
          <EmptyState
            searchQuery={search}
            searchItemName="alerts"
            onAction={() => setSearch("")}
            icon={CheckCircle2}
            title="No alerts found"
            description="Everything looks good — no alerts match your current filters."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Low-stock alerts */}
          {lowStockAlerts.map((alert) => (
            <Card
              key={`ls-${alert.inventoryID}`}
              className="bg-card border-border/60 premium-shadow overflow-hidden"
            >
              <LowStockRow alert={alert} />
            </Card>
          ))}

          {/* Expiry alerts grouped by item */}
          {expiryGroups.map((group) => (
            <Card
              key={`exp-${group.itemName}`}
              className="bg-card border-border/60 premium-shadow overflow-hidden"
            >
              <GroupedExpiryRow
                itemName={group.itemName}
                batches={group.batches}
              />
            </Card> // <--- Added the missing closing tag here
          ))}
        </div>
      )}
    </div> // <--- Replaced the stray </Card> with the correct closing div
  );
}
