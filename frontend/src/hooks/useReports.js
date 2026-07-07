import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/api/axios"

const ANALYTICS_BASE = "https://youseef-awaad-zerobite-ai-engine.hf.space"

const toIsoDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const getWeekRange = () => {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: toIsoDate(monday), end: toIsoDate(sunday) }
}

const safe = async (promise) => {
  try {
    const res = await promise
    return { ok: true, data: res.data }
  } catch {
    return { ok: false, data: null }
  }
}

// Persist generated report history in localStorage
const STORAGE_KEY = "reports_history"

export const getReportHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

export const addReportToHistory = (reportName) => {
  const history = getReportHistory()
  const entry = {
    id: Date.now(),
    name: reportName,
    exportedAt: new Date().toISOString(),
  }
  history.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)))
  return entry
}

const fetchReportsData = async (restId) => {
  const { start, end } = getWeekRange()

  const startSched = start.replace(/-/g, "/")
  const endSched = end.replace(/-/g, "/")

  const [inventoryRes, employeesRes, scheduleRes] = await Promise.all([
    safe(api.get(`/Inventory/restaurant/${restId}`)),
    safe(api.get("/Employees")),
    safe(api.get(`/Schedule/range?startDate=${startSched}&endDate=${endSched}`)),
  ])

  const inventoryItems = Array.isArray(inventoryRes.data) ? inventoryRes.data : []
  const employeesData = employeesRes.data?.employees ?? employeesRes.data ?? []
  const employees = Array.isArray(employeesData) ? employeesData : []
  const schedules = Array.isArray(scheduleRes.data) ? scheduleRes.data : []

  const lowStockCount = inventoryItems.filter(
    (item) => Number(item.stock ?? 0) <= Number(item.reorderLevel ?? item.reorder_level ?? 0)
  ).length

  const activeEmployees = employees.filter(
    (e) => String(e.status || "").toLowerCase() === "active"
  ).length

  // Stats from localStorage history
  const history = getReportHistory()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const generatedThisMonth = history.filter(
    (h) => new Date(h.exportedAt) >= monthStart
  ).length

  const lastEntry = history[0]
  const lastExportName = lastEntry?.name || "N/A"
  const lastExportAt = lastEntry?.exportedAt || null

  return {
    stats: {
      generatedThisMonth,
      scheduled: 2,
      lastExportAt,
      lastExportName,
    },
    meta: {
      inventoryCount: inventoryItems.length,
      lowStockCount,
      activeEmployees,
      totalEmployees: employees.length,
      weeklyShifts: schedules.length,
    },
    data: [
      {
        id: 1,
        name: "Weekly Revenue Report",
        type: "Revenue",
        date: "Last 7 Days",
        icon: "DollarSign",
        status: "ready",
      },
      {
        id: 2,
        name: "Menu Analytics Summary",
        type: "Menu",
        date: "Last 30 Days",
        icon: "BarChart3",
        status: "ready",
      },
      {
        id: 3,
        name: "Inventory Stock Level",
        type: "Inventory",
        date: "Current",
        icon: "Package",
        status: inventoryRes.ok ? "ready" : "error",
        badge: lowStockCount > 0 ? `${lowStockCount} low stock` : null,
      },
      {
        id: 4,
        name: "Staff Hours Summary",
        type: "Staff",
        date: "Current Week",
        icon: "Calendar",
        status: employeesRes.ok ? "ready" : "error",
        badge: `${activeEmployees}/${employees.length} active`,
      },
      {
        id: 5,
        name: "Weekly Schedule",
        type: "Schedule",
        date: `${start} → ${end}`,
        icon: "Clock",
        status: scheduleRes.ok ? "ready" : "error",
        badge: `${schedules.length} shifts`,
      },
    ],
  }
}

export function useReports(restId) {
  return useQuery({
    queryKey: ["reportsList", restId],
    queryFn: () => fetchReportsData(restId),
    enabled: !!restId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
