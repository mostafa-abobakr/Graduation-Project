import React, { useState } from "react";
import Header from "./Header";
import Statistics from "./Statistics";
import SalesProfitChart from "./SalesProfitChart";
import Alerts from "./Alerts";
import PeakTimes from "./PeakTimes";
import CostReduction from "./CostReduction";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const ManagerDashboard = () => {
  const [viewMode, setViewMode] = useState("today");
  const {user} = useAuth();
  console.log(user);
  

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      
      const res = await fetch(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/${user.restId}`,
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
