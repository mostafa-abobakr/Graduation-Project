export const fetchMenuItems = async () => {
    const token = localStorage.getItem("authToken");

    const response = await fetch(
        "/api/MenuItems",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch menu items");
    }

    return response.json();
};