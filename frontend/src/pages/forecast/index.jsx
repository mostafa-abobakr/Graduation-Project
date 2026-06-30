import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import axios from "axios"

import { useForecast } from "../../hooks/useForecast"
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
  const [weeklyEvents, setWeeklyEvents] = useState([1, 0, 1, 0, 0, 0, 0])

  useEffect(() => {
    const fetchDefaultWeather = async () => {
      const city = user?.city || user?.address || "mansoura university"
      try {
        const geoRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
        )
        if (geoRes.data && geoRes.data.length > 0) {
          const lat = parseFloat(geoRes.data[0].lat)
          const lon = parseFloat(geoRes.data[0].lon)
          
          const weatherRes = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`
          )
          const maxTemps = weatherRes.data.daily.temperature_2m_max
          const times = weatherRes.data.daily.time
          if (maxTemps && maxTemps.length >= 7 && times) {
            const alignedTemps = [0, 0, 0, 0, 0, 0, 0]
            times.slice(0, 7).forEach((timeStr, idx) => {
              const [year, month, day] = timeStr.split("-").map(Number)
              const date = new Date(year, month - 1, day)
              const dayOfWeek = date.getDay()
              const uiIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
              alignedTemps[uiIdx] = Math.round(maxTemps[idx])
            })
            setWeeklyTemperatures(alignedTemps)
            setDailyData([Math.round(maxTemps[0]), 0])
          }
        }
      } catch (error) {
        console.error("Failed to load initial city weather:", error)
      }
    }
    
    fetchDefaultWeather()
  }, [user?.city, user?.address])

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

      <ForecastSummaryCards data={data} alignment={alignment} isLoading={isFetching || isLoading || !data} />

      <ForecastTable items={data?.items || []} alignment={alignment} isLoading={isFetching || isLoading || !data} />

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
