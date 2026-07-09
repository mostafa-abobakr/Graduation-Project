import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";


const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";

export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const {user} = useAuth()

  const isDayEnabled = dailyData && dailyData[0] !== null && dailyData[0] !== undefined;
  const isWeekEnabled = weeklyTemperatures && weeklyTemperatures.length > 0;

  const dayQuery = useQuery({
    queryKey: [
      "hourlyForecast",
      "day",
      dailyData,
      weeklyTemperatures,
      weeklyEvents,
      user?.restId,
    ],
    queryFn: async ({ signal }) => {
      const payload = {
        temperature_celsius: dailyData[0],
        event_day: dailyData[1],
      };
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/day/${user?.restId}`,
        payload,
        { signal, headers: { Accept: "application/json" } },
      );
      return response.data;
    },
    enabled: isDayEnabled && !!user?.restId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const weekQuery = useQuery({
    queryKey: [
      "hourlyForecast",
      "week",
      dailyData,
      weeklyTemperatures,
      weeklyEvents,
      user?.restId,
    ],
    queryFn: async ({ signal }) => {
      const payload = {
        weekly_temperatures: weeklyTemperatures,
        weekly_events: weeklyEvents,
      };
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/week/${user?.restId}`,
        payload,
        { signal, headers: { Accept: "application/json" } },
      );
      return response.data;
    },
    enabled: isWeekEnabled && !!user?.restId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return alignment === "day" ? dayQuery : weekQuery;
}

export function useGeocodeCity(city) {
  return useQuery({
    queryKey: ["geocodeCity", city],
    queryFn: async ({ signal }) => {
      const cacheKey = `geocode_${city}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        console.log(`[Geocoding] Cache HIT for "${city}". Loaded from localStorage.`);
        return JSON.parse(cachedData);
      }

      console.log(`[Geocoding] Cache MISS for "${city}". Fetching from Nominatim API...`);
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=5`,
        { signal }
      );
      
      if (res.data && res.data.length > 0) {
        console.log(`[Geocoding] Fetched successfully. Saving to localStorage.`);
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
      } else {
        console.warn(`[Geocoding] API returned empty results for "${city}".`);
      }
      
      return res.data;
    },
    enabled: !!city,
    staleTime: Infinity, // Never refetch in the background during the session
  });
}

export function useFetchCityWeather(lat, lon) {
  return useQuery({
    queryKey: ["cityWeather", lat, lon],
    queryFn: async ({ signal }) => {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`,
        { signal },
      );
      return res.data;
    },
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 60 * 24, // 24 hour
  });
}
