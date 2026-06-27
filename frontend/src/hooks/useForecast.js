import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const queryClient = useQueryClient()
  const {user} = useAuth()

  const isEnabled = alignment === "week"
    ? (weeklyTemperatures && weeklyTemperatures.length > 0)
    : (dailyData && dailyData[0] !== null && dailyData[0] !== undefined)

  const query = useQuery({
    queryKey: ["hourlyForecast", alignment, dailyData, weeklyTemperatures, weeklyEvents],
    queryFn: async () => {
      const payload =
        alignment === "week"
          ? {
              weekly_temperatures: weeklyTemperatures,
              weekly_events: weeklyEvents,
            }
          : { temperature_celsius: dailyData[0], event_day: dailyData[1] }

      const response = await axios.post(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/${alignment}/${user.restId}`,
        payload,
        { headers: { Accept: "application/json" } },
      )
      
      return response.data
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })

  
  useEffect(() => {
    if (alignment === "day" && query.isSuccess) {
      queryClient.prefetchQuery({
        queryKey: ["hourlyForecast", "week", dailyData, weeklyTemperatures, weeklyEvents],
        queryFn: async () => {
          const weekPayload = {
            weekly_temperatures: weeklyTemperatures,
            weekly_events: weeklyEvents,
          };
          const response = await axios.post(
            `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/week/${user.restId}`,
            weekPayload,
            { headers: { Accept: "application/json" } }
          );
          return response.data;
        },
        staleTime: 5 * 60 * 1000, 
      });
    }
  }, [alignment, query.isSuccess, queryClient, weeklyTemperatures, weeklyEvents]);

  return query;
}


// Using the free Open-Meteo API (requires latitude and longitude)
export function useWeatherForecast(lat = 30.0444, lon = 31.2357) { // Defaults to Cairo coords
  return useQuery({
    queryKey: ["weatherForecast", lat, lon],
    queryFn: async () => {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`
      );
      
      // Open-Meteo returns daily max temperatures in an array
      // response.data.daily.temperature_2m_max is e.g. [35.2, 34.8, 35.0, 30.1, 39.4, 36.0, 37.2]
      // We round them to integers to match your model's input
      return response.data.daily.temperature_2m_max.map(temp => Math.round(temp));
    },
    staleTime: 60 * 60 * 1000, // Weather changes slowly, cache for 1 hour
  });
}
