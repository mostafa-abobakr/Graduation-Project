import { Card } from "@/components/ui/card";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  DollarSign, 
  Package, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

// Map string icon names from the backend to Lucide components
const ICON_MAP = {
  DollarSign: DollarSign,
  BarChart3: BarChart3,
  Calendar: Calendar,
  FileText: FileText,
  Package: Package,
  Clock: Clock,
};

export default function ReportsPage() {
  const { data: reportsData, isLoading, isError } = useReports();

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Reports & Export"
        description="Generate and download reports"
        actions={
          <Button disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Reports Generated"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : (reportsData?.stats?.generatedThisMonth || 0)}
          sub="This month"
          icon={FileText}
        />
        <SummaryCard
          title="Scheduled Reports"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : (reportsData?.stats?.scheduled || 0)}
          sub="Active schedules"
          icon={Calendar}
        />
        <SummaryCard
          title="Last Export"
          value={isLoading ? <Skeleton className="h-8 w-24" /> : (reportsData?.stats?.lastExport || "-")}
          sub={isLoading ? <Skeleton className="h-3 w-32" /> : (reportsData?.stats?.lastExportName || "N/A")}
          icon={Download}
        />
      </div>

      {/* Reports List */}
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <h3 className="text-base font-semibold text-foreground">Recent Reports</h3>
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
            {[1, 2, 3, 4].map((i) => (
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
              const IconComponent = ICON_MAP[report.icon] || FileText;
              return (
                <div key={report.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{report.name}</div>
                      <div className="text-xs text-muted-foreground">{report.type} · {report.date}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled={report.status === "generating"}>
                    {report.status === "generating" ? (
                      <span className="text-xs text-muted-foreground">Generating...</span>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              );
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
  );
}
