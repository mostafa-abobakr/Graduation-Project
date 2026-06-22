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
      return response.data.map((emp) => ({
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
      const startFormatted = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`
      const endFormatted = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`

      const response = await api.get(`/Schedule/range?start_date=${startFormatted}&end_date=${endFormatted}`, {
        headers: getAuthHeaders(),
      })
      console.log(response.data);
      console.log(startFormatted,endFormatted);
      
      return response.data.map(item => ({
        id: `shift-${item.scheduleID}`,
        staffId: item.empID || item.empId || item.employeeId || item.staffId || item.id,
        staffName: item.employeeName,
        avatar: item.employeeName ? item.employeeName.split(" ").map(n => n[0]).join("") : "",
        date: item.day ? item.day.split("T")[0] : "",
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
    },
    onError: () => {
      toast.error("Failed to delete shift.");
    },
  });
};
