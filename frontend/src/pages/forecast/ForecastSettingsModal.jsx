import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, MapPin, Loader2, CloudSun } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

export default function ForecastSettingsModal({
  open,
  onOpenChange,
  dailyData,
  setDailyData,
  weeklyTemperatures,
  setWeeklyTemperatures,
  weeklyEvents,
  setWeeklyEvents,
  onApply
}) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState(user?.address || "")
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (open && user?.address) {
      setSearchQuery(user.address)
    }
  }, [open, user?.address])
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingWeather, setIsFetchingWeather] = useState(false)

  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      )
      setSuggestions(response.data)
      if (response.data.length === 0) {
        toast.error("No cities found. Try another search.")
      }
    } catch (error) {
      console.error("Geocoding failed:", error)
      toast.error("Failed to fetch city details. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleCitySelect = async (city) => {
    setIsFetchingWeather(true)
    const lat = parseFloat(city.lat)
    const lon = parseFloat(city.lon)
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`
      )
      const maxTemps = response.data.daily.temperature_2m_max
      const times = response.data.daily.time
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
        setDailyData([Math.round(maxTemps[0]), dailyData[1]])
        toast.success(`Loaded weather forecast for ${city.display_name.split(",")[0]}`)
        setSuggestions([])
        setSearchQuery("")
      } else {
        toast.error("Failed to retrieve 7-day forecast from weather service.")
      }
    } catch (error) {
      console.error("Weather fetch failed:", error)
      toast.error("Failed to load weather data.")
    } finally {
      setIsFetchingWeather(false)
    }
  }

  const handleTemperatureChange = (index, value) => {
    const newTemps = [...weeklyTemperatures]
    newTemps[index] = parseInt(value) || 0
    setWeeklyTemperatures(newTemps)
  }

  const handleEventChange = (index, value) => {
    const newEvents = [...weeklyEvents]
    newEvents[index] = parseInt(value) || 0
    setWeeklyEvents(newEvents)
  }

  const SHIFT_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Forecast Settings</DialogTitle>
          <DialogDescription>
            Configure temperatures and events for forecasting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* City Weather Loader Section */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/40">
            <div className="flex items-center gap-2">
              <CloudSun className="h-4.5 w-4.5 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Fetch Local Weather via City Name
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your city name to locate it via OpenStreetMap and pull current forecast temperatures.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter city (e.g. London, Cairo)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card border-border/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearchClick()
                    }
                  }}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleSearchClick} 
                disabled={isSearching || isFetchingWeather}
                className="gap-2 shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Locate
              </Button>
            </div>

            {/* Suggestions list */}
            {suggestions.length > 0 && (
              <div className="border border-border/60 rounded-md bg-card overflow-hidden divide-y divide-border/40 max-h-40 overflow-y-auto">
                {suggestions.map((city) => (
                  <button
                    key={city.place_id}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{city.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {isFetchingWeather && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Pulling latest forecast temperatures from Open-Meteo...</span>
              </div>
            )}
          </div>

          {/* Daily Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Daily Forecast
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Temperature (°C)
                </label>
                <Input
                  type="number"
                  value={dailyData[0]}
                  onChange={(e) =>
                    setDailyData([parseInt(e.target.value) || 0, dailyData[1]])
                  }
                  min={0}
                  max={50}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Event Day (0 or 1)
                </label>
                <Input
                  type="number"
                  value={dailyData[1]}
                  onChange={(e) =>
                    setDailyData([dailyData[0], parseInt(e.target.value) || 0])
                  }
                  min={0}
                  max={1}
                />
              </div>
            </div>
          </div>

          {/* Weekly Temperatures */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Weekly Temperatures (°C)
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {SHIFT_OPTIONS.map((day, i) => (
                <div key={day} className="space-y-1.5 text-center">
                  <label className="text-xs text-muted-foreground">{day}</label>
                  <Input
                    type="number"
                    value={weeklyTemperatures[i]}
                    onChange={(e) => handleTemperatureChange(i, e.target.value)}
                    min={0}
                    max={50}
                    className="text-center px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Events */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Weekly Events (0 or 1)
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {SHIFT_OPTIONS.map((day, i) => (
                <div key={day} className="space-y-1.5 text-center">
                  <label className="text-xs text-muted-foreground">{day}</label>
                  <Input
                    type="number"
                    value={weeklyEvents[i]}
                    onChange={(e) => handleEventChange(i, e.target.value)}
                    min={0}
                    max={1}
                    className="text-center px-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onApply()
            }}
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
