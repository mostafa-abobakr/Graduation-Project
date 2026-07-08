import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { useForecast, useGeocodeCity, useFetchCityWeather } from "../../hooks/useForecast"
import { useLanguage } from "@/contexts/LanguageContext"
import ForecastHeader from "./ForecastHeader"
import ForecastSummaryCards from "./ForecastSummaryCards"
import ForecastTable from "./ForecastTable"
import ForecastSettingsModal from "./ForecastSettingsModal"

export default function ForecastPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [alignment, setAlignment] = useState("day")
  const [modalOpen, setModalOpen] = useState(false)
  
  const [dailyData, setDailyData] = useState([null, 0])
  const [weeklyTemperatures, setWeeklyTemperatures] = useState([0, 0, 0, 0, 0, 0, 0])
  const [weeklyEvents, setWeeklyEvents] = useState([0, 0, 0, 0, 0, 0, 0])

  const cityToSearch = user?.city || user?.address || "mansoura university";
  const { data: geoData } = useGeocodeCity(cityToSearch);
  const lat = geoData && geoData.length > 0 ? parseFloat(geoData[0].lat) : null;
  const lon = geoData && geoData.length > 0 ? parseFloat(geoData[0].lon) : null;
  const { data: weatherData } = useFetchCityWeather(lat, lon);

  useEffect(() => {
    if (weatherData && weatherData.daily?.time && weatherData.daily?.temperature_2m_max) {
      const maxTemps = weatherData.daily.temperature_2m_max;
      const times = weatherData.daily.time;
      if (maxTemps.length >= 7) {
        const alignedTemps = [0, 0, 0, 0, 0, 0, 0];
        times.slice(0, 7).forEach((timeStr, idx) => {
          const [year, month, day] = timeStr.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay();
          const uiIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          alignedTemps[uiIdx] = Math.round(maxTemps[idx]);
        });
        
        // Prevent infinite re-renders by checking if it actually changed?
        // Actually, weatherData only changes when the query resolves.
        setWeeklyTemperatures(alignedTemps);
        setDailyData(prev => prev[0] !== Math.round(maxTemps[0]) ? [Math.round(maxTemps[0]), prev[1]] : prev);
      }
    }
  }, [weatherData]);

  const { data, isLoading, isError, error, refetch, isFetching } = useForecast({
    alignment,
    dailyData,
    weeklyTemperatures,
    weeklyEvents,
  })

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 bg-card border-border/60 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">{t("Failed to load forecast")}</p>
          <p className="text-muted-foreground text-sm">
            {error?.message || t("Something went wrong")}
          </p>
          <Button onClick={() => refetch()}>{t("Retry")}</Button>
        </Card>
      </div>
    )
  }
  console.log(dailyData);
  
  return (
    <div className="space-y-5 animate-fade-in py-5" dir="ltr">
      <ForecastHeader 
        alignment={alignment} 
        setAlignment={setAlignment} 
        setModalOpen={setModalOpen} 
      />

      <ForecastSummaryCards data={data} alignment={alignment} isLoading={isLoading} />

      <ForecastTable items={data?.items || []} alignment={alignment} isLoading={isLoading} />

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
  )
}
