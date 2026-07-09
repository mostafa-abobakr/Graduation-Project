import React, { useState } from "react";
import Header from "./Header";
import Statistics from "./Statistics";
import SalesProfitChart from "./SalesProfitChart";
import Alerts from "./Alerts";
import PeakTimes from "./PeakTimes";
import CostReduction from "./CostReduction";
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const ManagerDashboard = () => {
  const [viewMode, setViewMode] = useState("today")
  const { user } = useAuth()
  const { t } = useLanguage()
  // console.log(user);


  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["dashboardData"],
  //   queryFn: async () => {
  //     const token = localStorage.getItem("authToken");

  //     const res = await fetch(
  //       `https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/${user.restId}`,
  //       { method: "GET", headers: { accept: "application/json", }, },
  //     );
  //     if (!res.ok) {
  //       throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
  //     }
  //     return res.json();
  //   },
  // });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardData", user?.restId],
    queryFn: async () => {
      const res = await fetch(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/dashboard/${user?.restId}`
      )

      if (!res.ok) throw new Error("Not ready yet")

      return res.json()
    },
    staleTime: 30 * 1000,
    retry: false,
    enabled: !!user?.restId,
  })
  if (isLoading)
    return (
      <div className="flex flex-col py-5 " dir="ltr">
        <Header viewMode={viewMode} setViewMode={setViewMode} />

        <div className="flex-1 pt-5 space-y-4 md:space-y-5">
          {/* Row 1: Stats & Cost Reduction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
            ))}
          </div>

          {/* Row 2: Alerts (left), PeakTimes (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>

          {/* Row 3: SalesProfitChart */}
          <div className="grid grid-cols-1 items-stretch">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )

  if (error) {
    const isInitializing = error.message === "Not ready yet"

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 w-full animate-in fade-in duration-300">
        <div className="bg-card text-card-foreground border border-border/60 rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
        
            <div className="animate-in fade-in duration-300">
              <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-destructive w-12 h-12" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-3">
                {t("Failed to Load Dashboard")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {t("We encountered an error while fetching your analytics data. Please try again.")}
              </p>
              <Button onClick={() => refetch()} className="w-full py-6 rounded-xl font-semibold gap-2">
                <RefreshCw className="w-4 h-4" />
                {t("Retry Connection")}
              </Button>
            </div>
          
        </div>
      </div>
    )
  }

  // The API returns nested data: { data: { day: {...}, week: {...}, month: {...}, all: {...} } }
  const getViewKey = () => {
    if (viewMode === "today") return "day";
    if (viewMode === "week") return "week";
    if (viewMode === "month") return "month";
    return "day";
  };
  const dashboardData = data?.data?.[getViewKey()];
  // console.log("dashboardData", dashboardData)

  const statistics = dashboardData?.revenue;
  const costReduction = dashboardData?.cost_reduction;
  const salesProfit = dashboardData?.sales_profit_chart;

  const peakTimes = dashboardData?.peaks;


  return (
    <div className="flex flex-col py-5 " dir="ltr">
      {/* Header */}
      <Header viewMode={viewMode} setViewMode={setViewMode} />

      {/* Main Dashboard Container */}
      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 pt-5 space-y-4 md:space-y-5"
      >
        {/* Row 1: Stats & Cost Reduction */}
        <motion.div variants={fadeUpVariant} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          <Statistics data={statistics} />
          <CostReduction data={costReduction} />
        </motion.div>

        {/* Row 2: Layout block - Alerts (left), PeakTimes (right) */}
        <motion.div variants={fadeUpVariant} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
          {/* Left Column */}
          <Alerts data={dashboardData} />
          {/* <Alerts data={mockAlertData} /> */}

          {/* Right Column */}
          <PeakTimes data={peakTimes} viewMode={viewMode} />
        </motion.div>

        <motion.div variants={fadeUpVariant} className="grid grid-cols-1 items-stretch">
          <SalesProfitChart data={salesProfit} viewMode={viewMode} />
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ManagerDashboard;
