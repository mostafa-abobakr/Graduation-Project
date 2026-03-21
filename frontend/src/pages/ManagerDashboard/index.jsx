import React from "react";
import Header from "./Header";
import Statistics from "./Statistics";
import SalesProfitChart from "./SalesProfitChart";
import Alerts from "./Alerts";
import PeakTimesCard from "./PeakTimesCard";
import CoastAndWasteCard from "./CoastAndWasteCard";
import { useQueries } from "@tanstack/react-query";
import {
  CostReduction,
  fetchStatistics,
  fetchSalesProfit,
  fetchAlerts,
  fetchPeakTimes,
} from "../../services/aiFunctions";

const ManagerDashboard = () => {
  const results = useQueries({
    queries: [
      { queryKey: ["costReduction"], queryFn: CostReduction },
      { queryKey: ["dashboardStatistics"], queryFn: fetchStatistics },
      { queryKey: ["salesProfit"], queryFn: fetchSalesProfit },
      { queryKey: ["alerts"], queryFn: fetchAlerts },
      { queryKey: ["peakTimes"], queryFn: fetchPeakTimes },
    ],
  });

  const data = {
    costReduction: results[0].data,
    statistics: results[1].data,
    salesProfit: results[2].data,
    alerts: results[3].data,
    peakTimes: results[4].data,
  };

  return (
    <div className="min-h-screen bg-muted/10 overflow-hidden flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Dashboard Container */}
      <main className="flex-1 p-2 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Row 1: Stats & Cost */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          <Statistics data={data.statistics} />
          <CoastAndWasteCard data={data.costReduction} />
        </div>

        {/* Row 2: Sales Chart & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          <SalesProfitChart data={data.salesProfit} />
          <Alerts data={data.alerts} />
        </div>

        {/* Row 3: Peak Times */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          {/* Leaving the remaining 2 columns empty so the PeakTimes card maintains its proper width */}
          <PeakTimesCard data={data.peakTimes} />
          <div className="hidden lg:block lg:col-span-2" />
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
