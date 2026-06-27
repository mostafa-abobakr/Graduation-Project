import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

export function EmployeeTableCard({ filtered, isLoading, search, setSearch }) {
  if (filtered.length === 0 && !isLoading && !search) {
    return (
      <Card className="bg-card border-border/60 premium-shadow overflow-hidden p-8">
         <EmptyState
            searchQuery={search}
            searchItemName="employees"
            onAction={() => setSearch("")}
            icon={Users}
            title="No employees found"
            description="You don't have any employees yet."
          />
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
      <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">
          Staff Directory
          {!isLoading && (
            <Badge
              variant="secondary"
              className="ml-2 bg-primary/10 text-primary border-0 text-xs font-semibold"
            >
              {filtered.length}
            </Badge>
          )}
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Employee
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Role
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Contact
              </th>
              <th className="text-left py-3 px-5 text-muted-foreground font-semibold">
                Hire Date
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                Schedule
              </th>
              <th className="text-right py-3 px-5 text-muted-foreground font-semibold">
                Salary
              </th>
              <th className="text-center py-3 px-5 text-muted-foreground font-semibold">
                Status
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
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    searchQuery={search}
                    searchItemName="employees"
                    onAction={() => setSearch("")}
                    icon={Users}
                    title="No employees found"
                    description="You don't have any employees yet."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((e, index) => (
                <tr
                  key={e.id || e.empId || e.empID || index}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
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
                    {e.role}
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
                  <td className="py-4 px-5 text-right font-mono font-medium text-foreground">
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
                      {e.status} 
                      
                    </Badge>
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
