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
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (empId) => {
      const response = await api.delete(`/Employees/${empId}`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Employee deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
    onError: (error) => {
      console.error("Error deleting employee:", error)
      toast.error(error.response?.data?.message || error.message || "Failed to delete employee.")
    },
  })
}
