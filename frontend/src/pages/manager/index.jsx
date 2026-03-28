import React, { useState } from "react";
import Header from "./Header";
import Statistics from "./Statistics";
import SalesProfitChart from "./SalesProfitChart";
import Alerts from "./Alerts";
import PeakTimes from "./PeakTimes";
import CostReduction from "./CostReduction";
import { useQuery } from "@tanstack/react-query";

const ManagerDashboard = () => {
  const [viewMode, setViewMode] = useState("today");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/2",
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
      }
      return res.json();
    },
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading dashboard...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-destructive">
        Error: {error.message}
      </div>
    );

  // The API returns nested data: { data: { day: {...}, week: {...}, month: {...}, all: {...} } }
  const getViewKey = () => {
    if (viewMode === "today") return "day";
    if (viewMode === "week") return "week";
    if (viewMode === "month") return "month";
    return "day";
  };
  const dashboardData = data?.data?.[getViewKey()];

  const statistics = dashboardData?.revenue;
  const costReduction = dashboardData?.cost_reduction;
  const salesProfit = dashboardData?.sales_profit_chart;

  const peakTimes = dashboardData?.peaks;

// const mockAlertData = {
//   alerts: [
//     // --- Business Rule-Based Alerts ---
//     {
//       type: "revenue_drop",
//       severity: "warning",
//       message:
//         "Daily overall revenue dropped by 22% compared to yesterday. Review daily expenses.",
//       link: "alert-1",
//     },
//     {
//       type: "revenue_spike",
//       severity: "info",
//       message:
//         "Great job! Daily overall revenue surged by 24% compared to yesterday.",
//       link: "alert-2",
//     },
//     {
//       type: "cold_item_underperformance",
//       severity: "info",
//       message:
//         "It was 30°C today, but Mango Smoothies only sold 4 units. Check front-of-house visibility.",
//       link: "alert-3",
//     },
//     {
//       type: "hot_item_underperformance",
//       severity: "info",
//       message:
//         "It was 12°C today, but Hot Lattes sold poorly. Consider running a warm drink promotion.",
//       link: "alert-4",
//     },
//     {
//       type: "low_margin_high_volume",
//       severity: "warning",
//       message:
//         "Classic Cheeseburger is highly popular but has a dangerous 8% profit margin. Consider repricing.",
//       link: "alert-5",
//     },
//     {
//       type: "high_margin_low_volume",
//       severity: "info",
//       message:
//         "Truffle Pasta has a 65% profit margin but below-average sales. Feature this hidden gem!",
//       link: "alert-6",
//     },

//     // --- Predictive Forecast Alerts ---
//     {
//       type: "item_decrease",
//       severity: "warning",
//       message:
//         "Forecast: French Fries orders expected to drop by 20% tomorrow. Reduce prep to avoid waste.",
//       link: "alert-7",
//     },
//     {
//       type: "item_surge",
//       severity: "info",
//       message:
//         "Forecast: Pepperoni Pizza orders expected to surge by 30% tomorrow. Prep extra ingredients.",
//       link: "alert-8",
//     },
//     {
//       type: "low_margin_surge",
//       severity: "warning",
//       message:
//         "Forecast: Massive surge expected for Chicken Wings, but the profit margin is only 12%.",
//       link: "alert-9",
//     },
//     {
//       type: "high_margin_surge",
//       severity: "info",
//       message:
//         "Forecast: Massive surge for Ribeye Steak (55% margin). Prioritize prep for high profits tomorrow!",
//       link: "alert-10",
//     },
//     {
//       type: "forecast_revenue_drop",
//       severity: "warning",
//       message:
//         "Forecast: Total revenue tomorrow is expected to drop by 15% compared to the baseline.",
//       link: "alert-11",
//     },
//     {
//       type: "forecast_revenue_spike",
//       severity: "info",
//       message:
//         "Forecast: Total revenue tomorrow is expected to surge by 20% compared to the baseline.",
//       link: "alert-12",
//     },

//     // --- Fallback Tests (Unknown Types) ---
//     {
//       type: "some_unknown_warning",
//       severity: "warning",
//       message: "System API rate limit approaching.",
//       link: "alert-13",
//     },
//     {
//       type: "some_unknown_info",
//       severity: "info",
//       message: "Menu synchronization completed successfully.",
//       link: "alert-14",
//     },
//   ],
// };

  return (
    <div className="flex flex-col py-5">
      {/* Header */}
      <Header viewMode={viewMode} setViewMode={setViewMode} />

      {/* Main Dashboard Container */}
      <main className="flex-1 pt-5 space-y-4 md:space-y-5">
        {/* Row 1: Stats & Cost Reduction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          <Statistics data={statistics} />
          <CostReduction data={costReduction} />
        </div>

        {/* Row 2: Layout block - Alerts (left), PeakTimes (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
          {/* Left Column */}
          <Alerts data={dashboardData} />
          {/* <Alerts data={mockAlertData} /> */}

          {/* Right Column */}
          <PeakTimes data={peakTimes} viewMode={viewMode} />
        </div>

        <div className="grid grid-cols-1 items-stretch">
          <SalesProfitChart data={salesProfit} viewMode={viewMode} />
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
