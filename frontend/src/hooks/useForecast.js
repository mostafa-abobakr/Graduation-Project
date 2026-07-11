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
    queryFn: async () => {
      const payload = {
        temperature_celsius: dailyData[0],
        event_day: dailyData[1],
      };
      
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/day/${user?.restId}`,
        payload,
        { headers: { Accept: "application/json" } },
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
    queryFn: async () => {
      const payload = {
        weekly_temperatures: weeklyTemperatures,
        weekly_events: weeklyEvents,
      };
      
      const response = await axios.post(
        `${AI_ENGINE_URL}/forecast/dashboard/week/${user?.restId}`,
        payload,
        { headers: { Accept: "application/json" } },
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
    queryFn: async () => {
      const cacheKey = `geocode_${city}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        // Cache hit
        return JSON.parse(cachedData);
      }

      // Cache miss
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=5`);
      
      if (res.data && res.data.length > 0) {
        // Fetched successfully
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
    queryFn: async () => {
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`);
      return res.data;
    },
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 60 * 24, // 24 hour
  });
}

export function useFetchHolidays(country, year) {
  return useQuery({
    queryKey: ["holidays", country, year],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_CALENDARIFIC_API_KEY;
      if (!apiKey) {
        console.warn("[Holidays] API Key missing");
        return [];
      }

      const fetchYear = async (y) => {
        const cacheKey = `holidays_${country}_${y}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          // Cache hit
          return JSON.parse(cachedData);
        }

        // Cache miss
        try {
          const res = await axios.get(
            `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${country}&year=${y}`
          );
          if (res.data?.response?.holidays) {
            localStorage.setItem(cacheKey, JSON.stringify(res.data.response.holidays));
            return res.data.response.holidays;
          }
          return [];
        } catch (error) {
          console.error(`[Holidays] Fetch failed for ${country} ${y}`, error);
          return [];
        }
      };

      const currentMonth = new Date().getMonth();
      if (currentMonth === 11) {
        const [currentYearData, nextYearData] = await Promise.all([
          fetchYear(year),
          fetchYear(year + 1)
        ]);
        return [...currentYearData, ...nextYearData];
      }

      return await fetchYear(year);
    },
    enabled: !!country && !!year,
    staleTime: Infinity,
  });
}

