import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const queryClient = useQueryClient();
  const {user}= useAuth();
  const query = useQuery({
    queryKey: ["hourlyForecast", alignment],
    queryFn: async () => {
      const payload =
        alignment === "week"
          ? {
              weekly_temperatures: weeklyTemperatures,
              weekly_events: weeklyEvents,
            }
          : { temperature_celsius: dailyData[0], event_day: dailyData[1] };

      const response = await axios.post(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/${alignment}/${user.restId}`,
        payload,
        { headers: { Accept: "application/json" } },
      );
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  
  useEffect(() => {
    if (alignment === "day" && query.isSuccess) {
      queryClient.prefetchQuery({
        queryKey: ["hourlyForecast", "week"],
        queryFn: async () => {
          const weekPayload = {
            weekly_temperatures: weeklyTemperatures,
            weekly_events: weeklyEvents,
          };
          const response = await axios.post(
            `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/week/2`,
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
