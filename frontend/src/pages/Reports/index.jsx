import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { SummaryCard } from "@/components/shared/SummaryCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useReports, addReportToHistory } from "@/hooks/useReports"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { exportDailyReportPdf } from "./exportDailyReportPdf"
import {
  exportWeeklyRevenueReport,
  exportMenuAnalyticsReport,
  exportInventoryReport,
  exportStaffHoursReport,
  exportWeeklyScheduleReport,
} from "./exportReports"

const ICON_MAP = {
  DollarSign,
  BarChart3,
  Calendar,
  FileText,
  Package,
  Clock,
}

// Maps each report name to its dedicated export function
const EXPORT_FN_MAP = {
  "Weekly Revenue Report": exportWeeklyRevenueReport,
  "Menu Analytics Summary": exportMenuAnalyticsReport,
  "Inventory Stock Level": exportInventoryReport,
  "Staff Hours Summary": exportStaffHoursReport,
  "Weekly Schedule": exportWeeklyScheduleReport,
}

// Reports hidden from the UI (not ready yet)
const HIDDEN_REPORTS = new Set(["Staff Hours Summary", "Weekly Schedule"])

export default function ReportsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: reportsData, isLoading, isError } = useReports(user?.restId)
  const [exportingId, setExportingId] = useState(null)
  const [, setTick] = useState(0)

  const lastExportAt = reportsData?.stats?.lastExportAt

  // Re-render every 30s so the relative time stays fresh
  useEffect(() => {
    if (!lastExportAt) return
    const timer = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(timer)
  }, [lastExportAt])

  const formatRelativeTime = (iso) => {
    if (!iso) return "-"
    const diff = Math.floor((Date.now() - new Date(iso)) / 60_000)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  // Per-report loading state — tracks which report is currently exporting
  const handleExport = useCallback(
    async (report) => {
      if (exportingId) return
      setExportingId(report.id)

      const setIsExporting = () => {} // dummy — we manage state here

      const exportFn = EXPORT_FN_MAP[report.name]
      if (exportFn) {
        await exportFn(user, (v) => !v && setExportingId(null))
      } else {
        // Fallback: full daily report
        await exportDailyReportPdf(user, (v) => !v && setExportingId(null), report.name)
      }

      await queryClient.invalidateQueries({ queryKey: ["reportsList", user?.restId] })
      addReportToHistory(report.name || "Daily Report")
      toast.success("Reports generated successfully")

      setExportingId(null)
    },
    [user, exportingId, queryClient]
  )



  const isAnyExporting = exportingId !== null

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Reports & Export"
        description="Generate and download reports"
      />

      {/* Stat Cards */}
     {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Reports Generated"
          value={
            isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              reportsData?.stats?.generatedThisMonth ?? 0
            )
          }
          sub="This month"
          icon={FileText}
        />
        <SummaryCard
          title="Scheduled Reports"
          value={
            isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              reportsData?.stats?.scheduled ?? 0
            )
          }
          sub="Active schedules"
          icon={Calendar}
        />
        <SummaryCard
          title="Last Export"
          value={
            isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              formatRelativeTime(lastExportAt)
            )
          }
          sub={
            isLoading ? (
              <Skeleton className="h-3 w-32" />
            ) : (
              reportsData?.stats?.lastExportName ?? "N/A"
            )
          }
          icon={Download}
        />
      </div> */}

      {/* Reports List */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Available Reports</h3>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["reportsList", user?.restId] })
            }
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {isError && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-foreground font-medium">Failed to load reports</p>
            <p className="text-muted-foreground text-sm">Please try again later.</p>
          </div>
        )}

        {isLoading && !isError && (
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="divide-y divide-border/30">
            {reportsData?.data?.map((report) => {
              const IconComponent = ICON_MAP[report.icon] || FileText
              const isThisExporting = exportingId === report.id
              const isError = report.status === "error"

              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isError ? "bg-destructive/10" : "bg-primary/10"
                      }`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${isError ? "text-destructive" : "text-primary"}`}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm flex items-center gap-2">
                        {report.name}
                        {report.badge && (
                          <Badge
                            variant={report.badge.includes("low") ? "destructive" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {report.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.type} · {report.date}
                        {isError && (
                          <span className="text-destructive ml-2">· Data unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isAnyExporting || isError}
                    onClick={() => handleExport(report)}
                    title={isError ? "Data unavailable for this report" : `Export ${report.name}`}
                  >
                    {isThisExporting ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Exporting...
                      </span>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              )
            })}

            {reportsData?.data?.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No reports found"
                description="Try generating a new report."
              />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
