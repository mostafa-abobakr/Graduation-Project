import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useMenuQuery = () => {
  const { user } = useAuth();
  const restId = user?.restId;

  return useQuery({
    queryKey: ["menuItems", restId],
    queryFn: async () => {
      const response = await api.get(`/MenuItems?restId=${restId}`);
      return response.data.map((item) => ({
        id: item.itemID ?? item.menuItemId,
        restId: item.restID ?? item.restaurantId,
        name: item.itemName,
        description: item.description || "",
        price: item.price || 0,
        category: item.category || "",
        image: item.imageURL || "",
        cost: item.cost || 0,
        ingredients: item.ingredients
          ? item.ingredients.map((ing) => ({
              inventoryId: ing.inventoryID ?? ing.inventoryId,
              quantityUsed: ing.quantityUsed,
            }))
          : [],
      }));
    },
    enabled: !!restId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const restId = user?.restId;

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(`/MenuItems`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Menu item updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["menuItems", restId] });
    },
    onError: (error) => {
      console.error("Error updating menu item:", error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to update menu item.",
      );
    },
  });
};
