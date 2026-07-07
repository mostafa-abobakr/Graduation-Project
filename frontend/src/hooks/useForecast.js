import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";


const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";

export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const {user} = useAuth()

  const isDayEnabled = dailyData && dailyData[0] !== null && dailyData[0] !== undefined;
  const isWeekEnabled = weeklyTemperatures && weeklyTemperatures.length > 0;

  const dayQuery = useQuery({
    queryKey: ["hourlyForecast", "day", dailyData, weeklyTemperatures, weeklyEvents],
    queryFn: async ({ signal }) => {
      const payload = { temperature_celsius: dailyData[0], event_day: dailyData[1] };
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/day/${user.restId}`,
        payload,
        { signal, headers: { Accept: "application/json" } }
      );
      return response.data;
    },
    enabled: isDayEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const weekQuery = useQuery({
    queryKey: ["hourlyForecast", "week", dailyData, weeklyTemperatures, weeklyEvents],
    queryFn: async ({ signal }) => {
      const payload = {
        weekly_temperatures: weeklyTemperatures,
        weekly_events: weeklyEvents,
      };
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/week/${user.restId}`,
        payload,
        { signal, headers: { Accept: "application/json" } }
      );
      return response.data;
    },
    enabled: isWeekEnabled,
    staleTime: 5 * 60 * 1000,
  });

  return alignment === "day" ? dayQuery : weekQuery;
}

export function useGeocodeCity(city) {
  return useQuery({
    queryKey: ["geocodeCity", city],
    queryFn: async ({ signal }) => {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=5`,
        { signal }
      );
      return res.data;
    },
    enabled: !!city,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useFetchCityWeather(lat, lon) {
  return useQuery({
    queryKey: ["cityWeather", lat, lon],
    queryFn: async ({ signal }) => {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`,
        { signal }
      );
      return res.data;
    },
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
