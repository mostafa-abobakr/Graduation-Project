import { useQuery } from "@tanstack/react-query";

// Mock backend fetch function
const fetchReportsMock = async () => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    stats: {
      generatedThisMonth: 18,
      scheduled: 4,
      lastExport: "1h ago",
      lastExportName: "Weekly Revenue Report",
    },
    data: [
      { id: 1, name: "Weekly Revenue Report", type: "Revenue", date: "Last 7 Days", icon: "DollarSign", status: "ready" },
      { id: 2, name: "Menu Analytics Summary", type: "Menu", date: "Last 30 Days", icon: "BarChart3", status: "ready" },
      { id: 3, name: "Inventory Stock Level", type: "Inventory", date: "Current", icon: "Package", status: "ready" },
      { id: 4, name: "Staff Hours Summary", type: "Staff", date: "Current Week", icon: "Calendar", status: "ready" },
      { id: 5, name: "Weekly Schedule", type: "Schedule", date: "Upcoming Week", icon: "Clock", status: "generating" },
    ],
  };
};

export function useReports() {
  return useQuery({
    queryKey: ["reportsList"],
    queryFn: fetchReportsMock,
    // When the real endpoint is ready, uncomment below and remove fetchReportsMock
    // queryFn: async () => {
    //   const response = await axios.get('/api/Reports');
    //   return response.data;
    // },
    staleTime: 5 * 60 * 1000,
  });
}
