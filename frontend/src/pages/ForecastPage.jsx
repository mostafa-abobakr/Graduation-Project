import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

import { useForecast } from "../hooks/useForecast";
import ForecastHeader from "./forecast/ForecastHeader";
import ForecastSummaryCards from "./forecast/ForecastSummaryCards";
import ForecastTable from "./forecast/ForecastTable";
import ForecastSettingsModal from "./forecast/ForecastSettingsModal";

export default function ForecastPage() {
  const { user } = useAuth();
  const [alignment, setAlignment] = useState("day");
  const [modalOpen, setModalOpen] = useState(false);
  
  const [dailyData, setDailyData] = useState([30, 0]);
  const [weeklyTemperatures, setWeeklyTemperatures] = useState([35, 35, 35, 30, 39, 36, 37]);
  const [weeklyEvents, setWeeklyEvents] = useState([1, 0, 1, 0, 0, 0, 0]);

  const { data, isLoading, isError, error, refetch, isFetching } = useForecast({
    alignment,
    dailyData,
    weeklyTemperatures,
    weeklyEvents,
  });

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            Loading forecast data...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 bg-card border-border/60 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">Failed to load forecast</p>
          <p className="text-muted-foreground text-sm">
            {error?.message || "Something went wrong"}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in py-5">
      <ForecastHeader 
        alignment={alignment} 
        setAlignment={setAlignment} 
        setModalOpen={setModalOpen} 
      />

      <ForecastSummaryCards data={data} alignment={alignment} />

      <ForecastTable items={data?.items || []} alignment={alignment} />

      <ForecastSettingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dailyData={dailyData}
        setDailyData={setDailyData}
        weeklyTemperatures={weeklyTemperatures}
        setWeeklyTemperatures={setWeeklyTemperatures}
        weeklyEvents={weeklyEvents}
        setWeeklyEvents={setWeeklyEvents}
        onApply={refetch}
      />
    </div>
  );
}
