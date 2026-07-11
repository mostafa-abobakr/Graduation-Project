import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

// --- Queries ---

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["Admin_dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

// --- Mutations ---

export const useAddRestaurant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/Restaurant", payload);
      return response.data;
    },
    onMutate: async (newRest) => {
      await queryClient.cancelQueries({ queryKey: ["Admin_dashboard"] });
      
      const previousData = queryClient.getQueryData(["Admin_dashboard"]);
      
      if (previousData) {
        queryClient.setQueryData(["Admin_dashboard"], {
          ...previousData,
          restaurants: [
            ...previousData.restaurants,
            {
              restaurantId: `temp-${Date.now()}`,
              restaurantName: newRest.restaurantName,
              ownerEmail: newRest.ownerEmail,
              status: newRest.isActive ? "Active" : "Inactive",
              createdAt: new Date().toISOString()
            }
          ]
        });
      }
      
      return { previousData };
    },
    onError: (err, newRest, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["Admin_dashboard"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    },
  });
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/admin/restaurants/${id}`, payload);
      return response.data;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["Admin_dashboard"] });
      const previousData = queryClient.getQueryData(["Admin_dashboard"]);
      
      if (previousData) {
        queryClient.setQueryData(["Admin_dashboard"], {
          ...previousData,
          restaurants: previousData.restaurants.map((rest) => 
            rest.restaurantId === id
              ? {
                  ...rest,
                  restaurantName: payload.restaurantName,
                  status: payload.isActive ? "Active" : "Inactive"
                }
              : rest
          )
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["Admin_dashboard"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    },
  });
};

export const useUpdateRestaurantStatusBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targets, isActive, restaurantsData }) => {
      await Promise.all(
        targets.map(async (id) => {
          const restaurant = restaurantsData?.find((r) => r.restaurantId === id);
          if (restaurant) {
            await api.put(`/admin/restaurants/${id}`, {
              restaurantName: restaurant.restaurantName,
              isActive,
            });
          }
        })
      );
    },
    onMutate: async ({ targets, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ["Admin_dashboard"] });
      const previousData = queryClient.getQueryData(["Admin_dashboard"]);
      
      if (previousData) {
        queryClient.setQueryData(["Admin_dashboard"], {
          ...previousData,
          restaurants: previousData.restaurants.map((rest) => 
            targets.includes(rest.restaurantId)
              ? { ...rest, status: isActive ? "Active" : "Inactive" }
              : rest
          )
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["Admin_dashboard"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    },
  });
};
