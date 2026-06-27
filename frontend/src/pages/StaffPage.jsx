import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useStaffQuery } from "@/hooks/useStaff"
import { Users, Clock, UserCheck, DollarSign, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"
import { SummaryCard } from "@/components/shared/SummaryCard"
import { AddEmployeeDialog } from "@/components/staff/AddEmployeeDialog"
import { EmployeeTableCard } from "@/components/staff/EmployeeTableCard"

export default function StaffPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data, isLoading, error, isError } = useStaffQuery()

  const employees = data?.employees ?? []
  const totalStaff = data?.totalStaff ?? 0
  const totalActive = data?.totalActive ?? 0
  const weeklyHrs = data?.weeklyHrs ?? 0
  const monthlySalary = data?.monthlySalary ?? 0

  const filtered = employees.filter((employee) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const name = (employee.fullName || "").toLowerCase()
    const role = (employee.role || "").toLowerCase()
    return name.includes(q) || role.includes(q)
  })

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* ── Error State ──────────────────────────────────────────── */}
      {isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">
            Failed to load employees
          </p>
          <p className="text-destructive/70 text-sm mt-1">
            {error?.message || "Please try refreshing the page"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["staff"] })
            }
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        icon={Users}
        title={isAdmin ? "Staff Management Dashboard" : "Staff Management"}
        description={
          isAdmin
            ? "Global employee overview and directories"
            : "Manage your employees and schedules"
        }
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      >
        {isAdmin && (
          <Badge
            variant="outline"
            className="border-primary/30 text-primary text-xs"
          >
            Admin
          </Badge>
        )}
      </PageHeader>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Staff"
          value={
            isLoading ? <Skeleton className="h-8 w-20" /> : totalStaff
          }
          icon={Users}
          iconWrapper
        />
        <SummaryCard
          title="Active Members"
          value={isLoading ? <Skeleton className="h-8 w-20" /> : totalActive}
          icon={UserCheck}
          iconWrapper
          valueColorClass="text-primary"
        />
        <SummaryCard
          title="Weekly Hrs"
          value={
            isLoading ? <Skeleton className="h-8 w-20" /> : `${weeklyHrs}h`
          }
          icon={Clock}
          iconWrapper
        />
        <SummaryCard
          title="Monthly Salary Bill"
          value={
            isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              `$${monthlySalary.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            )
          }
          icon={DollarSign}
          iconWrapper
        />
      </div>

      <EmployeeTableCard 
        filtered={filtered} 
        isLoading={isLoading} 
        search={search} 
        setSearch={setSearch} 
      />

      <AddEmployeeDialog 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </div>
  )
}
