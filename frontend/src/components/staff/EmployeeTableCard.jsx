import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search, Users, Trash2 } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { useLanguage } from "@/contexts/LanguageContext"

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

export function EmployeeTableCard({ filtered, isLoading, search, setSearch, onEdit, onDelete }) {
  const { t } = useLanguage()

  if (filtered.length === 0 && !isLoading && !search) {
    return (
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden p-8">
         <EmptyState
            searchQuery={search}
            searchItemName="employees"
            onAction={() => setSearch("")}
            icon={Users}
            title={t("No employees found")}
            description={t("You don't have any employees yet.")}
          />
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
      <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground flex items-center">
          {t("Staff")}
          {!isLoading && (
            <Badge
              variant="secondary"
              className="ms-2 bg-primary/10 text-primary border-0 text-xs font-semibold"
            >
              {filtered.length}
            </Badge>
          )}
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Search by name or role…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9 bg-card border-border/60"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="text-start py-3 px-5 text-muted-foreground font-semibold">
                {t("Employee")}
              </th>
              <th className="text-start py-3 px-5 text-muted-foreground font-semibold">
                {t("Role")}
              </th>
              <th className="text-start py-3 px-5 text-muted-foreground font-semibold">
                {t("Contact")}
              </th>
              <th className="text-start py-3 px-5 text-muted-foreground font-semibold">
                {t("Hire Date")}
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                {t("Schedule")}
              </th>
              <th className="text-end py-3 px-5 text-muted-foreground font-semibold">
                {t("Salary")}
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                {t("Status")}
              </th>
              <th className="text-end py-3 px-5 text-muted-foreground font-semibold">
                {t("Actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-16 ms-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <EmptyState
                    searchQuery={search}
                    searchItemName="employees"
                    onAction={() => setSearch("")}
                    icon={Users}
                    title={t("No employees found")}
                    description={t("You don't have any employees yet.")}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((e, index) => (
                 <tr
                  key={e.id || e.empId || e.empID || index}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onEdit && onEdit(e)}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {initials(e.fullName)}
                      </div>
                      <span className="text-foreground font-semibold">
                        {e.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">
                    {t(e.role)}
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-sm text-foreground">{e.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.phone}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">
                    {e.hireDate
                      ? new Date(e.hireDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "—"}
                  </td>
                  <td className="py-4 px-5 text-center text-muted-foreground">
                    <div className="text-xs">{e.shift}</div>
                    <div className="text-xs opacity-70">
                      {e.workingDaysPerWeek}d × {e.workingHoursPerDay}h
                    </div>
                  </td>
                  <td className="py-4 px-5 text-end font-mono font-medium text-foreground">
                    ${e.salary?.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Badge
                      variant={
                        e.status?.startsWith("Active") ? "default" : "secondary"
                      }
                      className={
                        e.status?.startsWith("Active")
                          ? "bg-primary/15 text-primary border-0"
                          : ""
                      }
                    >
                      {t(e.status)}
                    </Badge>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={(evt) => {
                          evt.stopPropagation()
                          onDelete && onDelete(e.id || e.empID || e.empId)
                        }}
                        className="text-destructive hover:text-destructive/80 transition-colors p-1"
                        title={t("Delete Employee")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
