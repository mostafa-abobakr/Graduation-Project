import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import api from "@/api/axios"
import { addReportToHistory } from "@/hooks/useReports"

const ANALYTICS_BASE = "https://youseef-awaad-zerobite-ai-engine.hf.space"

const toCurrency = (v) =>
  `$${Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`

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
  } catch (e) {
    return { ok: false, data: null, error: e?.message || "Error" }
  }
}

const addHeader = (doc, title, subtitle = "") => {
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(20)
  doc.text(title, 14, 18)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  if (subtitle) doc.text(subtitle, 14, 25)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 31 : 25)
}

// Strip any character outside Latin-1 range so jsPDF Helvetica doesn't garble it
const s = (str) => String(str ?? "-").replace(/[^\x00-\xFF]/g, "?")

const save = (doc, name, restId) => {
  const date = toIsoDate(new Date())
  const safe_name = name.toLowerCase().replace(/\s+/g, "-")
  doc.save(`${safe_name}-${date}.pdf`)
  addReportToHistory(name)
  toast.success(`"${name}" exported successfully`)
}

// ─── 1. Weekly Revenue Report ────────────────────────────────────────────────
export const exportWeeklyRevenueReport = async (user, setIsExporting) => {
  if (!user?.restId) { toast.error("Restaurant ID missing"); return }
  setIsExporting(true)
  try {
    const [dashboardRes, revenueRes] = await Promise.all([
      safe(api.get(`${ANALYTICS_BASE}/analytics/dashboard/${user.restId}`)),
      safe(api.get(`${ANALYTICS_BASE}/analytics/dashboard/revenue/${user.restId}`)),
    ])

    const dayDashboard = dashboardRes.data?.data?.day ?? {}
    const weekDashboard = dashboardRes.data?.data?.week ?? {}
    const dayRevenue = revenueRes.data?.data?.day ?? {}
    const weekRevenue = revenueRes.data?.data?.week ?? {}

    const revTrend = dayRevenue?.revenue_trend ?? weekRevenue?.revenue_trend ?? []
    const peakHours = dayDashboard?.peaks?.peak_hours ?? weekDashboard?.peaks?.peak_hours ?? []
    const revenueData = dayDashboard?.revenue ?? weekDashboard?.revenue ?? {}

    const doc = new jsPDF()
    addHeader(doc, "Weekly Revenue Report", `Week: Last 7 Days | ${start} to ${end}`)

    // Summary card
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 36, 180, 22, 3, 3, "FD")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text("Total Revenue", 18, 42)
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20)
    doc.text(toCurrency(revenueData.total_revenue), 18, 49)
    doc.line(74, 39, 74, 55)
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100)
    doc.text("Total Orders", 78, 42)
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20)
    doc.text(String(revenueData.total_orders ?? "N/A"), 78, 49)
    doc.line(134, 39, 134, 55)
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100)
    doc.text("Total Profit", 138, 42)
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20)
    doc.text(toCurrency(revenueData.total_profit), 138, 49)

    autoTable(doc, {
      startY: 64,
      head: [["Metric", "Value", "Change vs Prev"]],
      body: [
        ["Total Revenue", toCurrency(revenueData.total_revenue), s(revenueData.revenue_change_pct) ?? "-"],
        ["Total Orders", String(revenueData.total_orders ?? "-"), s(revenueData.orders_change_pct) ?? "-"],
        ["Avg Order Value", toCurrency(revenueData.avg_order_value), s(revenueData.avg_order_value_change_pct) ?? "-"],
        ["Total Profit", toCurrency(revenueData.total_profit), s(revenueData.profit_change_pct) ?? "-"],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    })

    if (revTrend.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Date / Hour", "Revenue"]],
        body: revTrend.map((t) => [t.timestamp ?? t.date ?? "N/A", toCurrency(t.revenue)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [33, 33, 33] },
      })
    }

    if (peakHours.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Peak Hour", "Orders", "Revenue"]],
        body: peakHours.map((h) => [String(h.hour), String(h.order_count ?? 0), toCurrency(h.revenue)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 33, 33] },
      })
    }

    save(doc, "Weekly Revenue Report", user.restId)
  } catch (e) {
    console.error(e); toast.error("Failed to export Weekly Revenue Report")
  } finally {
    setIsExporting(false)
  }
}

// ─── 2. Menu Analytics Summary ───────────────────────────────────────────────
export const exportMenuAnalyticsReport = async (user, setIsExporting) => {
  if (!user?.restId) { toast.error("Restaurant ID missing"); return }
  setIsExporting(true)
  try {
    const menuRes = await safe(api.get(`${ANALYTICS_BASE}/analytics/menu/performance/${user.restId}`))

    const menuDay = menuRes.data?.data?.day ?? []
    const menuWeek = menuRes.data?.data?.week ?? []
    const items = menuDay.length ? menuDay : menuWeek

    const doc = new jsPDF()
    addHeader(doc, "Menu Analytics Summary", "Period: Last 30 Days")

    autoTable(doc, {
      startY: 36,
      head: [["Item Name", "Orders", "Revenue", "Margin %"]],
      body: items.length
        ? items.slice(0, 20).map((i) => [
            s(i.item_name ?? "Unknown"),
            String(i.orders ?? 0),
            toCurrency(i.revenue),
            `${Number(i.margin_percentage ?? 0).toFixed(1)}%`,
          ])
        : [["No data available", "", "", ""]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    })

    // Top 5 by revenue
    const top5 = [...items].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0)).slice(0, 5)
    if (top5.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Top 5 by Revenue", "Revenue", "Margin %"]],
        body: top5.map((i) => [
          s(i.item_name ?? "Unknown"),
          toCurrency(i.revenue),
          `${Number(i.margin_percentage ?? 0).toFixed(1)}%`,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 163, 74] },
      })
    }

    // Bottom 5 by orders (potentially needs attention)
    const bottom5 = [...items].sort((a, b) => (a.orders ?? 0) - (b.orders ?? 0)).slice(0, 5)
    if (bottom5.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Least Ordered (Needs Attention)", "Orders", "Revenue"]],
        body: bottom5.map((i) => [
          s(i.item_name ?? "Unknown"),
          String(i.orders ?? 0),
          toCurrency(i.revenue),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 38, 38] },
      })
    }

    save(doc, "Menu Analytics Summary", user.restId)
  } catch (e) {
    console.error(e); toast.error("Failed to export Menu Analytics Report")
  } finally {
    setIsExporting(false)
  }
}

// ─── 3. Inventory Stock Level ─────────────────────────────────────────────────
export const exportInventoryReport = async (user, setIsExporting) => {
  if (!user?.restId) { toast.error("Restaurant ID missing"); return }
  setIsExporting(true)
  try {
    const inventoryRes = await safe(api.get(`/Inventory/restaurant/${user.restId}`))
    const items = Array.isArray(inventoryRes.data) ? inventoryRes.data : []

    const lowStock = items.filter(
      (i) => Number(i.stock ?? 0) <= Number(i.reorderLevel ?? i.reorder_level ?? 0)
    )
    const okStock = items.filter(
      (i) => Number(i.stock ?? 0) > Number(i.reorderLevel ?? i.reorder_level ?? 0)
    )

    const doc = new jsPDF()
    addHeader(doc, "Inventory Stock Level Report", `Total Items: ${items.length}`)

    // Summary stats
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 36, 180, 20, 3, 3, "FD")
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100)
    doc.text("Total Items", 18, 42); doc.text("Low Stock", 78, 42); doc.text("OK Stock", 138, 42)
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20)
    doc.text(String(items.length), 18, 51)
    doc.setTextColor(220, 38, 38)
    doc.text(String(lowStock.length), 78, 51)
    doc.setTextColor(22, 163, 74)
    doc.text(String(okStock.length), 138, 51)

    // All items
    autoTable(doc, {
      startY: 62,
      head: [["Item Name", "Category", "Stock", "Reorder Level", "Unit", "Status"]],
      body: items.length
        ? items.map((i) => {
            const stock = Number(i.stock ?? 0)
            const reorder = Number(i.reorderLevel ?? i.reorder_level ?? 0)
            return [
              s(i.itemName ?? i.item_name ?? "Unknown"),
              s(i.category ?? "-"),
              String(stock),
              String(reorder),
              s(i.unit ?? "-"),
              stock <= reorder ? "LOW STOCK" : "OK",
            ]
          })
        : [["No inventory data", "", "", "", "", ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 33, 33] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.cell.raw?.includes("Low")) {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = "bold"
        }
      },
    })

    if (lowStock.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Low Stock Items", "Stock", "Reorder Level", "Supplier"]],
        body: lowStock.map((i) => [
          s(i.itemName ?? i.item_name ?? "Unknown"),
          String(i.stock ?? 0),
          String(i.reorderLevel ?? i.reorder_level ?? 0),
          s(i.supplier ?? "Unknown"),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 38, 38] },
      })
    }

    save(doc, "Inventory Stock Level", user.restId)
  } catch (e) {
    console.error(e); toast.error("Failed to export Inventory Report")
  } finally {
    setIsExporting(false)
  }
}

// ─── 4. Staff Hours Summary ───────────────────────────────────────────────────
export const exportStaffHoursReport = async (user, setIsExporting) => {
  if (!user?.restId) { toast.error("Restaurant ID missing"); return }
  setIsExporting(true)
  try {
    const { start, end } = getWeekRange()
    const [employeesRes, scheduleRes] = await Promise.all([
      safe(api.get("/Employees")),
      safe(api.get(`/Schedule/range?start_date=${start}&end_date=${end}`)),
    ])

    const employees = Array.isArray(employeesRes.data) ? employeesRes.data : []
    const schedules = Array.isArray(scheduleRes.data) ? scheduleRes.data : []

    // Aggregate hours per employee from schedule
    const hoursMap = {}
    schedules.forEach((s) => {
      const empId = s.empID
      if (!hoursMap[empId]) hoursMap[empId] = { name: s.employeeName ?? "Unknown", shifts: 0, hours: 0 }
      hoursMap[empId].shifts += 1
      if (s.startTime && s.endTime) {
        const [sh, sm] = s.startTime.split(":").map(Number)
        const [eh, em] = s.endTime.split(":").map(Number)
        hoursMap[empId].hours += (eh + em / 60) - (sh + sm / 60)
      }
    })

    const activeEmployees = employees.filter((e) => String(e.status || "").toLowerCase() === "active")
    const doc = new jsPDF()
    addHeader(doc, "Staff Hours Summary", `Week: ${start} to ${end}`)

    // Summary
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 36, 180, 20, 3, 3, "FD")
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100)
    doc.text("Total Employees", 18, 42); doc.text("Active", 78, 42); doc.text("Scheduled Shifts", 138, 42)
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20)
    doc.text(String(employees.length), 18, 51)
    doc.text(String(activeEmployees.length), 78, 51)
    doc.text(String(schedules.length), 138, 51)

    autoTable(doc, {
      startY: 62,
      head: [["Employee Name", "Role", "Status", "Shifts This Week", "Est. Hours"]],
      body: employees.length
        ? employees.map((e) => {
            const empData = hoursMap[e.empID] ?? {}
            return [
              s(e.fullName ?? "Unknown"),
              s(e.role ?? "-"),
              s(e.status ?? "active"),
              String(empData.shifts ?? 0),
              empData.hours ? `${empData.hours.toFixed(1)}h` : "-",
            ]
          })
        : [["No employee data", "", "", "", ""]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    })

    save(doc, "Staff Hours Summary", user.restId)
  } catch (e) {
    console.error(e); toast.error("Failed to export Staff Hours Report")
  } finally {
    setIsExporting(false)
  }
}

// ─── 5. Weekly Schedule ──────────────────────────────────────────────────────
export const exportWeeklyScheduleReport = async (user, setIsExporting) => {
  if (!user?.restId) { toast.error("Restaurant ID missing"); return }
  setIsExporting(true)
  try {
    const { start, end } = getWeekRange()
    const scheduleRes = await safe(api.get(`/Schedule/range?start_date=${start}&end_date=${end}`))
    const schedules = Array.isArray(scheduleRes.data) ? scheduleRes.data : []

    // Group by day
    const byDay = {}
    schedules.forEach((s) => {
      const day = s.day ? s.day.split("T")[0] : "Unknown"
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(s)
    })

    const doc = new jsPDF()
    addHeader(doc, "Weekly Schedule Report", `Week: ${start} to ${end}`)

    if (schedules.length === 0) {
      doc.setFontSize(10); doc.setTextColor(100)
      doc.text("No scheduled shifts found for this week.", 14, 42)
    } else {
      autoTable(doc, {
        startY: 36,
        head: [["Date", "Employee", "Role", "Start", "End", "Shift Type"]],
        body: schedules.map((sc) => [
          sc.day ? sc.day.split("T")[0] : "-",
          s(sc.employeeName ?? "Unknown"),
          s(sc.role ?? "-"),
          sc.startTime ? sc.startTime.substring(0, 5) : "-",
          sc.endTime ? sc.endTime.substring(0, 5) : "-",
          s(sc.shiftType ?? "Morning"),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [33, 33, 33] },
      })

      // Per-day breakdown
      Object.entries(byDay).sort().forEach(([day, shifts]) => {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 6,
          head: [[`${day} - ${shifts.length} shift(s)`, "Employee", "Hours"]],
          body: shifts.map((sh) => [
            s(sh.shiftType ?? "Morning"),
            s(sh.employeeName ?? "Unknown"),
            sh.startTime && sh.endTime
              ? `${sh.startTime.substring(0, 5)} - ${sh.endTime.substring(0, 5)}`
              : "-",
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
        })
      })
    }

    save(doc, "Weekly Schedule", user.restId)
  } catch (e) {
    console.error(e); toast.error("Failed to export Weekly Schedule Report")
  } finally {
    setIsExporting(false)
  }
}


