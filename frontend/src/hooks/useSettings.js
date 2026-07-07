import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

export function useSettings(restId) {
  return useQuery({
    queryKey: ["Settings", restId],
    queryFn: async ({ signal }) => {
      const response = await api.get(`/Settings/all/${restId}`, { signal });
      return response.data;
    },
    enabled: !!restId,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restId, payload }) => {
      return await api.put(`/Settings/all/${restId}`, payload);
    },
    onSuccess: (_, { restId }) => {
      queryClient.invalidateQueries({ queryKey: ["Settings", restId] });
      toast.success("Settings saved successfully!");
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ file, isUpdate }) => {
      const formData = new FormData();
      formData.append("file", file);
      const method = isUpdate ? "put" : "post";
      const response = await api[method]("/Settings/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { response, file };
    },
    onSuccess: () => {
      toast.success("Photo updated successfully!");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload) => {
      return await api.post("/Settings/change-password", payload);
    },
    onSuccess: () => {
      toast.success("Password updated successfully!");
    },
  });
}
