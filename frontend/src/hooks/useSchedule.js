import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await api.get("/Employees", {
        headers: getAuthHeaders(),
      });
      const list = response.data.employees ?? response.data ?? []
      return list.map((emp) => ({
        id: emp.empID || emp.empId || emp.id || emp.employeeId,
        name: emp.fullName,
        role: emp.role,
        avatar: emp.fullName ? emp.fullName.split(" ").map(n => n[0]).join("") : "",
        status: emp.status ? emp.status.toLowerCase() : "active",
        workingHoursPerDay: emp.workingHoursPerDay || 8,
        workingDaysPerWeek: emp.workingDaysPerWeek || 5,
      }));
    },
  });
};

const convert24to12 = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const useShifts = (startDate, endDate) => {
  return useQuery({
    queryKey: ["shifts", startDate, endDate],
    queryFn: async () => {
      const startFormatted = `${startDate.getFullYear()}/${String(startDate.getMonth() + 1).padStart(2, "0")}/${String(startDate.getDate()).padStart(2, "0")}`
      const endFormatted = `${endDate.getFullYear()}/${String(endDate.getMonth() + 1).padStart(2, "0")}/${String(endDate.getDate()).padStart(2, "0")}`

      const response = await api.get(`/Schedule/range?startDate=${startFormatted}&endDate=${endFormatted}`, {
        headers: getAuthHeaders(),
      })
      

      return response.data.map(item => ({
        id: `shift-${item.scheduleID}`,
        staffId: item.empID || item.empId || item.employeeId || item.staffId || item.id,
        staffName: item.employeeName,
        avatar: item.employeeName ? item.employeeName.split(" ").map(n => n[0]).join("") : "",
        date: item.day ? item.day.split("T")[0] : "",
        rawStartTime: item.startTime,
        rawEndTime: item.endTime,
        startTime: item.startTime ? convert24to12(item.startTime.substring(0, 5)) : "",
        endTime: item.endTime ? convert24to12(item.endTime.substring(0, 5)) : "",
        shiftType: item.shiftType || "Morning",
        source: item.source || item.Source || "Manual",
        isOverridden: item.isOverridden !== undefined ? item.isOverridden : (item.IsOverridden !== undefined ? item.IsOverridden : false),
        updatedAt: item.updatedAt || item.UpdatedAt || null,
        confirmed: true
      }))
    },
    enabled: !!startDate && !!endDate,
  })
}

export const useAddShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      
      
      return await api.post("/Schedule", payload, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      toast.success("Shift added successfully!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to add shift.");
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      return await api.put("/Schedule", payload, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      toast.success("Shift updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to update shift.");
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shiftId) => {
      return await api.delete(`/Schedule/${shiftId}`, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      toast.success("Shift deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to delete shift.");
    },
  });
};

export const useDeleteScheduleRange = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ startDate, endDate }) => {
      const startFormatted = `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`
      const endFormatted = `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()}`
      return await api.delete(`/Schedule/range?startDate=${startFormatted}&endDate=${endFormatted}`, {
        headers: getAuthHeaders(),
      })
    },
    onSuccess: () => {
      toast.success("Schedule cleared successfully!", {
        description: "All shifts for the selected week have been removed.",
      })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => {
      toast.error("Failed to clear schedule.", {
        description: "Something went wrong while deleting shifts.",
      })
    },
  })
}

export const useCopyLastWeekSchedule = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ prevStartDate, prevEndDate, currentStartDate }) => {
      const sourceStart = `${prevStartDate.getFullYear()}/${String(prevStartDate.getMonth() + 1).padStart(2, "0")}/${String(prevStartDate.getDate()).padStart(2, "0")}`
      const sourceEnd = `${prevEndDate.getFullYear()}/${String(prevEndDate.getMonth() + 1).padStart(2, "0")}/${String(prevEndDate.getDate()).padStart(2, "0")}`
      const newWeekStart = `${currentStartDate.getFullYear()}/${String(currentStartDate.getMonth() + 1).padStart(2, "0")}/${String(currentStartDate.getDate()).padStart(2, "0")}`

      const response = await api.post(
        `/Schedule/copy-week?sourceStart=${sourceStart}&sourceEnd=${sourceEnd}&newWeekStart=${newWeekStart}`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )

      return response.data
    },
    onSuccess: (data) => {
      // Check if backend returned a success message but with 0 shifts copied
      if (data && (data.count === 0 || data.copiedShiftsCount === 0 || data.message?.toLowerCase().includes("no shifts") || data.message?.toLowerCase().includes("no data"))) {
        toast.error("No shifts found to copy", {
          description: data.message || "No shifts were found in the previous week to copy.",
        })
        return
      }

      // Check if backend returned an explicit logical failure
      if (data && (data.success === false || data.status === "fail" || data.status === "error")) {
        toast.error("Failed to copy schedule", {
          description: data.message || "Something went wrong on the server.",
        })
        return
      }

      toast.success("Previous week schedule copied!", {
        description: data?.message || "All shifts have been copied to the current week.",
      })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error) => {
      const errMsg = error.response?.data?.message || 
                     error.response?.data?.error ||
                     (typeof error.response?.data === "string" ? error.response.data : null) ||
                     error.message || 
                     "Something went wrong."
      
      toast.error("Failed to copy schedule.", {
        description: errMsg,
      })
    },
  })
}

