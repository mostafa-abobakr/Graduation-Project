import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

export const useStaffQuery = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await api.get("/Employees");
      return response.data;
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData) => {
      const response = await api.post("/Employees", employeeData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Employee added successfully!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      console.error("Error adding employee:", error);
      toast.error(error.message || "Failed to add employee.");
    },
  });
};
