import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

export const useStaffQuery = () => {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await api.get("/Employees")
      const data = response.data

      return {
        totalStaff: data.totalStaff ?? 0,
        totalActive: data.totalActive ?? 0,
        weeklyHrs: data.weeklyHrs ?? 0,
        monthlySalary: data.monthlySalary ?? 0,
        employees: data.employees ?? [],
      }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

const parse24HourToMinutes = (timeStr) => {
  if (!timeStr) return null
  try {
    const [hours, minutes] = timeStr.substring(0, 5).split(":")
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10)
  } catch {
    return null
  }
}

export const useActiveStaffCount = () => {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const formatDate = (d) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`

  return useQuery({
    queryKey: ["activeStaffCount"],
    queryFn: async () => {
      const response = await api.get(
        `/Schedule/range?startDate=${formatDate(today)}&endDate=${formatDate(tomorrow)}`
      )

      const shifts = response.data ?? []
      const currentNow = new Date()
      const currentMinutes = currentNow.getHours() * 60 + currentNow.getMinutes()
      const todayStr = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, "0")}-${String(currentNow.getDate()).padStart(2, "0")}`

      const activeStaffIds = new Set()

      shifts.forEach((item) => {
        const shiftDate = item.day ? item.day.split("T")[0] : ""
        if (shiftDate !== todayStr) return
        if (!item.startTime || !item.endTime) return

        const start = parse24HourToMinutes(item.startTime)
        const end = parse24HourToMinutes(item.endTime)
        if (start === null || end === null) return

        const isActive = end > start
          ? currentMinutes >= start && currentMinutes < end
          : currentMinutes >= start || currentMinutes < end

        if (isActive) {
          const empId = item.empID || item.empId || item.employeeId || item.staffId || item.id
          activeStaffIds.add(empId)
        }
      })

      return activeStaffIds.size
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  })
}

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData) => {
      const response = await api.post("/Employees", employeeData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Employee added successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      console.error("Error adding employee:", error);
      toast.error(error.message || "Failed to add employee.");
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ empId, data }) => {
      const response = await api.put(`/Employees/${empId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Employee updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      console.error("Error updating employee:", error);
      toast.error(error.message || "Failed to update employee.");
    },
  });
};
