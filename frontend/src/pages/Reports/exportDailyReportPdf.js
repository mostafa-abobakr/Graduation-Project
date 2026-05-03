import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import api from "@/api/axios";

const ANALYTICS_BASE = "https://youseef-awaad-zerobite-ai-engine.hf.space";

const toCurrency = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const toIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toIsoDate(monday), end: toIsoDate(sunday) };
};

const safeApiCall = async (promise) => {
  try {
    const response = await promise;
    return {
      ok: true,
      status: response.status,
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || null,
      data: null,
      error: error.message || "Network error",
    };
  }
};

export const exportDailyReportPdf = async (user, setIsExporting, reportName = "Daily Report") => {
  if (!user?.restId) {
    toast.error("Restaurant ID is missing. Please re-login.");
    return;
  }

  setIsExporting(true);
  try {
    const { start, end } = getWeekRange();

    const [
      dashboardRes,
      revenueRes,
      menuRes,
      inventoryRes,
      forecastAlertsRes,
      employeesRes,
      scheduleRes,
    ] = await Promise.all([
      safeApiCall(api.get(`${ANALYTICS_BASE}/analytics/dashboard/${user.restId}`)),
      safeApiCall(api.get(`${ANALYTICS_BASE}/analytics/dashboard/revenue/${user.restId}`)),
      safeApiCall(api.get(`${ANALYTICS_BASE}/analytics/menu/performance/${user.restId}`)),
      safeApiCall(api.get(`${ANALYTICS_BASE}/inventory/items/${user.restId}`)),
      safeApiCall(api.post(`${ANALYTICS_BASE}/analytics/alerts/forecast/${user.restId}`, {})),
      safeApiCall(api.get(`/Employees`)),
      safeApiCall(api.get(`/Schedule/range?start_date=${start}&end_date=${end}`)),
    ]);

    const dayDashboard = dashboardRes.data?.data?.day ?? null;
    const dayRevenue = revenueRes.data?.data?.day ?? null;
    const menuDay = menuRes.data?.data?.day ?? [];
    const inventoryItems = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];
    const forecastDay = forecastAlertsRes.data?.day ?? null;
    const employees = Array.isArray(employeesRes.data) ? employeesRes.data : [];
    const schedules = Array.isArray(scheduleRes.data) ? scheduleRes.data : [];

    const revenueData = dayDashboard?.revenue ?? {};
    const peakHours = dayDashboard?.peaks?.peak_hours ?? [];
    const dashboardAlerts = dayDashboard?.alerts ?? [];
    const yesterdayRevenue = dayRevenue?.revenue_trend?.at(-2)?.revenue ?? null;
    const todayRevenueFromTrend = dayRevenue?.revenue_trend?.at(-1)?.revenue ?? revenueData.total_revenue ?? 0;

    const lowStockItems = inventoryItems.filter(
      (item) => Number(item.stock ?? 0) <= Number(item.reorder_level ?? 0),
    );
    const activeEmployees = employees.filter(
      (emp) => String(emp.status || "").toLowerCase() === "active",
    ).length;

    const keyMetrics = [
      ["Total Orders", String(revenueData.total_orders ?? "N/A"), String(revenueData.orders_change_pct ?? "N/A"), "From analytics dashboard"],
      ["Completed Orders", "N/A", "N/A", "No direct endpoint for completed"],
      ["Cancelled Orders", "N/A", "N/A", "No direct endpoint for cancelled"],
      ["Today's Revenue", toCurrency(revenueData.total_revenue), String(revenueData.revenue_change_pct ?? "N/A"), "Daily range"],
      ["Yesterday's Revenue", yesterdayRevenue != null ? toCurrency(yesterdayRevenue) : "N/A", "N/A", "Inferred from trend"],
      ["Avg Order Value", toCurrency(revenueData.avg_order_value), String(revenueData.avg_order_value_change_pct ?? "N/A"), "Daily range"],
      ["Total Profit", toCurrency(revenueData.total_profit), String(revenueData.profit_change_pct ?? "N/A"), "Daily range"],
    ];

    const peakRows = peakHours.length
      ? peakHours.map((h) => [String(h.hour), String(h.order_count ?? 0), toCurrency(h.revenue ?? 0)])
      : [["N/A", "N/A", "No peak data available"]];

    const topItemRows = (menuDay.length ? menuDay : []).slice(0, 10).map((item) => [
      String(item.item_name ?? "Unknown"),
      String(item.orders ?? 0),
      toCurrency(item.revenue ?? 0),
      `${Number(item.margin_percentage ?? 0).toFixed(2)}%`,
    ]);

    const inventoryRows = [
      ["Current Inventory Items", String(inventoryItems.length), inventoryRes.ok ? "Direct data" : `Unavailable (${inventoryRes.error})`],
      ["Low Stock Items", String(lowStockItems.length), inventoryRes.ok ? "stock <= reorder level" : "Unavailable"],
      ["Expiring Items", "N/A", "Expiry dates not provided"],
      ["Items Added Today", "N/A", "Added dates not provided"],
    ];

    const staffRows = [
      ["Active Employees Today", String(activeEmployees), employeesRes.ok ? "From Employees endpoint" : `Unavailable (${employeesRes.error})`],
      ["Attendance / Absence", "N/A", "No direct endpoint for attendance"],
      ["Performance Metrics", "N/A", "Not available in current response"],
    ];

    const reservationsRows = [
      ["Total Reservations", String(schedules.length), scheduleRes.ok ? `${start} -> ${end}` : `Unavailable (${scheduleRes.error})`],
      ["No-shows", "N/A", "No no-show flag in response"],
      ["Peak Reservation Times", "N/A", "No dedicated endpoint for peak times"],
    ];

    const allAlerts = [...dashboardAlerts, ...(forecastDay?.alerts ?? [])];
    const criticalAlerts = allAlerts.filter((a) => String(a.severity).toLowerCase() === "critical");
    const warningAlerts = allAlerts.filter((a) => String(a.severity).toLowerCase() === "warning");
    const alertRows = [
      ["Critical Alerts", String(criticalAlerts.length), criticalAlerts[0]?.message || "No Critical alerts"],
      ["Warnings", String(warningAlerts.length), warningAlerts[0]?.message || "No Warnings"],
      ["Forecast Alerts", String(forecastDay?.alerts?.length ?? 0), forecastAlertsRes.ok ? "AI forecast endpoint" : `Unavailable (${forecastAlertsRes.error})`],
    ];

    const operationalRows = [
      [
        "What Went Well",
        revenueData.revenue_change_pct?.startsWith("+")
          ? `Revenue is up ${revenueData.revenue_change_pct} compared to yesterday`
          : "No clear growth in revenue",
      ],
      [
        "Needs Attention",
        revenueData.profit_change_pct?.startsWith("-")
          ? `Profitability is down ${revenueData.profit_change_pct}, monitor margins closely`
          : "Profitability is relatively stable",
      ],
    ];

    const issuesRows = [
      [
        "Profitability",
        revenueData.profit_change_pct?.startsWith("-") ? "Medium" : "Low",
        revenueData.profit_change_pct?.startsWith("-")
          ? `Profit is down ${revenueData.profit_change_pct} despite sales volume`
          : "No significant drop in profit",
      ],
      [
        "Inventory Data",
        inventoryRes.ok ? "Low" : "High",
        inventoryRes.ok
          ? "Inventory data available"
          : `Issue with inventory endpoint: ${inventoryRes.error}`,
      ],
      [
        "Employee Data",
        employeesRes.ok ? "Low" : "High",
        employeesRes.ok
          ? "Employee data available"
          : `Employee data missing: ${employeesRes.error}`,
      ],
    ];

    const recommendations = [
      peakHours.length ? `Increase staff coverage during peak hours (${peakHours[0].hour} and ${peakHours[1]?.hour || "N/A"}).` : "Gather more data to accurately determine peak hours.",
      lowStockItems.length ? `Restock ${lowStockItems.length} low-stock items before the next shift.` : "Inventory appears stable based on available data.",
      revenueData.total_profit && revenueData.total_revenue ? "Review costs of low-margin items to boost profitability." : "Review profitability data feeds as some indicators are missing.",
      employeesRes.ok ? "Implement clear attendance tracking for more accurate performance reports." : "Fix Authorization for the Employees API before tomorrow's report.",
    ];

    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString();
    const businessDate = dayRevenue?.revenue_trend?.at(-1)?.timestamp?.split(" ")?.[0] || toIsoDate(new Date());

    doc.setFontSize(16);
    doc.text("Daily Restaurant Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Name: ${reportName}`, 14, 25);
    doc.text(`Business Date: ${businessDate}`, 14, 31);
    doc.text(`Generated At: ${generatedAt}`, 14, 37);

    // Summary Card Layout
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text("1) Summary (Executive Overview):", 14, 46);

    // Card Background
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, 50, 180, 24, 3, 3, "FD");

    const getTrendColor = (pctStr) => (pctStr || "").startsWith("-") ? [220, 38, 38] : [22, 163, 74];

    // Col 1: Revenue
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Today's Revenue", 18, 57);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(String(toCurrency(todayRevenueFromTrend)), 18, 63);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const c1 = getTrendColor(revenueData.revenue_change_pct);
    doc.setTextColor(c1[0], c1[1], c1[2]);
    doc.text(`${revenueData.revenue_change_pct || "N/A"} vs yesterday`, 18, 69);

    // Divider 1
    doc.setDrawColor(226, 232, 240);
    doc.line(74, 54, 74, 70);

    // Col 2: Orders
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Today's Orders", 78, 57);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(String(revenueData.total_orders ?? "N/A"), 78, 63);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const c2 = getTrendColor(revenueData.orders_change_pct);
    doc.setTextColor(c2[0], c2[1], c2[2]);
    doc.text(`${revenueData.orders_change_pct || "N/A"} vs yesterday`, 78, 69);

    // Divider 2
    doc.line(134, 54, 134, 70);

    // Col 3: Profit
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Today's Profit", 138, 57);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(String(toCurrency(revenueData.total_profit)), 138, 63);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const c3 = getTrendColor(revenueData.profit_change_pct);
    doc.setTextColor(c3[0], c3[1], c3[2]);
    doc.text(`${revenueData.profit_change_pct || "N/A"} vs yesterday`, 138, 69);

    // Reset colors for tables
    doc.setTextColor(20);

    autoTable(doc, {
      startY: 82,
      head: [["2) Key Metrics", "Today", "Vs Yesterday", "Note"]],
      body: keyMetrics,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Peak Hour", "Orders", "Revenue"]],
      body: peakRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["Most Ordered Items", "Orders", "Revenue", "Margin"]],
      body: topItemRows.length ? topItemRows : [["N/A", "N/A", "N/A", "N/A"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["3) Operational Insights", "Details"]],
      body: operationalRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["4) Inventory Status", "Value", "Note"]],
      body: inventoryRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["5) Staff Performance", "Value", "Note"]],
      body: staffRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["Reservation Metric", "Value", "Note"]],
      body: reservationsRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["6) Issues & Alerts", "Count", "Details"]],
      body: alertRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["Issue", "Severity", "Details"]],
      body: issuesRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 56) + 8,
      head: [["7) Recommendations"]],
      body: recommendations.map((item) => [item]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 33, 33] },
    });

    const fileSafeName = reportName.toLowerCase().replace(/\s+/g, "-");
    doc.save(`${fileSafeName || "daily-report"}-${businessDate}.pdf`);
    toast.success("PDF exported successfully");
  } catch (error) {
    console.error("Failed to export report PDF:", error);
    toast.error("Failed to export PDF");
  } finally {
    setIsExporting(false);
  }
};
