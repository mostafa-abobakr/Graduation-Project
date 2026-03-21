import React from "react";
import Header from "./Header";
import Statistics from "./Statistics";
import SalesProfitChart from "./SalesProfitChart";
import Alerts from "./Alerts";
import PeakTimesCard from "./PeakTimesCard";
import CoastAndWasteCard from "./CoastAndWasteCard";
import { useQuery } from "@tanstack/react-query";


const ManagerDashboard = () => {
 
    const {data, isLoading, error} = useQuery({
        queryKey: ["dashboardData"],
        queryFn: async () => {
            const token = localStorage.getItem("authToken");
            const res = await fetch("https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/2", {
                method: "GET",
                headers: {
                    "accept": "application/json",
                },
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
            }
            return res.json();
        },
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Error: {error.message}</div>;

    // The API returns nested data: { data: { day: {...}, week: {...}, month: {...}, all: {...} } }
    const dashboardData = data?.data?.day;

    const statistics = dashboardData?.revenue;
    const costReduction = dashboardData?.cost_reduction;
    const salesProfit = dashboardData?.sales_profit_chart;
 
    const peakTimes = dashboardData?.peaks;
    

  return (
    <div className="h-screen  flex flex-col ">
      {/* Header */}
      <Header />

      {/* Main Dashboard Container */}
      <main className="flex-1  py-4 md:py-6 lg:py-8 space-y-4 md:space-y-8">
        {/* Row 1: Stats & Cost */}
          <Statistics data={statistics} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-stretch">
          <CoastAndWasteCard data={costReduction} />
          <PeakTimesCard data={peakTimes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 md:gap-6 items-stretch">
          <SalesProfitChart data={salesProfit} />
         
        </div>

      
       
      </main>
    </div>
  );
};

export default ManagerDashboard;
