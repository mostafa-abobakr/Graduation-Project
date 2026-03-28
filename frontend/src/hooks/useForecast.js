import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
  const {user}= useAuth();
  return useQuery({
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
        `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/${alignment}/${user.restID}`,
        payload,
        { headers: { Accept: "application/json" } },
      );     
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  
  });
}
// for something in my mind 

// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import { useEffect } from "react";

// export function useForecast({ alignment, dailyData, weeklyTemperatures, weeklyEvents }) {
//   const queryClient = useQueryClient();

//   const query = useQuery({
//     queryKey: ["hourlyForecast", alignment],
//     queryFn: async () => {
//       const payload =
//         alignment === "week"
//           ? {
//               weekly_temperatures: weeklyTemperatures,
//               weekly_events: weeklyEvents,
//             }
//           : { temperature_celsius: dailyData[0], event_day: dailyData[1] };

//       const response = await axios.post(
//         `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/${alignment}/2`,
//         payload,
//         { headers: { Accept: "application/json" } },
//       );
      
//       return response.data;
//     },
//     staleTime: 5 * 60 * 1000,
//   });

//   // Prefetch the Week data in the background immediately after Day data loads
//   useEffect(() => {
//     if (alignment === "day" && query.isSuccess) {
//       queryClient.prefetchQuery({
//         queryKey: ["hourlyForecast", "week"],
//         queryFn: async () => {
//           const weekPayload = {
//             weekly_temperatures: weeklyTemperatures,
//             weekly_events: weeklyEvents,
//           };
//           const response = await axios.post(
//             `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/week/2`,
//             weekPayload,
//             { headers: { Accept: "application/json" } }
//           );
//           return response.data;
//         },
//         staleTime: 5 * 60 * 1000, // Keeps it fresh in the cache to avoid re-fetching when toggled
//       });
//     }
//   }, [alignment, query.isSuccess, queryClient, weeklyTemperatures, weeklyEvents]);

//   return query;
// }
