import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

export const useMenuQuery = () => {
  return useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const response = await api.get("/Menu");
      return response.data;
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/Menu/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Menu item updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
    onError: (error) => {
      console.error("Error updating menu item:", error);
      toast.error(error.message || "Failed to update menu item.");
    },
  });
};

export const useUpdateMenuRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, recipe }) => {
      const response = await api.put(`/Menu/${id}/recipe`, recipe);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
};
