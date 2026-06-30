import api from "@/api/axios";

export const fetchMenuItems = async () => {
    try {
        const response = await api.get("/MenuItems");
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Failed to fetch menu items");
    }
};