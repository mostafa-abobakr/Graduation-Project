
import api from "@/api/axios";
import { toast } from "sonner";



export const registerUser = async () => {
  const stored = localStorage.getItem("register");
  const data = JSON.parse(stored)
  const { email, password } = data;

  if (!stored) {
    toast.error("Registration data is missing. Please fill in the form.");
    return { success: false, error: "No registration data found" };
  }
  let formData;
  try {
    formData = JSON.parse(stored);
  } catch {
    toast.error("Invalid registration data.");
    return { success: false, error: "Invalid data" };
  }

  try {
    const response = await api.post(
      "/Auth/register",
      formData,
    )
    const id = response.data.restId;
    console.log(id);

    if (!id) {
      return { success: false, error: "Registration succeeded, but restaurant ID is missing" };
    }

    const seedResult = await seedRestaurantInfo(id);
    if (!seedResult.success) {
      return { success: false, error: "Registration succeeded, but data seeding failed: " + seedResult.error };
    }

    // console.log("Seeding triggered during registration:", seedResult);

    toast.success("Registration successful!");

    // localStorage.removeItem("register");

    return { success: true, data: response.data };
  }
  catch (error) {
    const data = error.response?.data;
    console.log(data);
    let serverMessage = "Cannot connect to server. Please try again.";

    if (typeof data === "string") {
      serverMessage = data;

    }
    else if (data && typeof data === "object") {
      // ASP.NET validation format: { errors: { FieldName: ["msg1", ...] } }

      if (data.errors && typeof data.errors === "object") {
        serverMessage = Object.values(data.errors).flat().join(", ");
      } else if (data.title) {
        serverMessage = data.title;
      } else if (data.message) {
        serverMessage = data.message;
      } else {
        serverMessage = JSON.stringify(data);
      }
    } else if (error.response?.request?.responseText) {
      serverMessage = error.response.request.responseText;
    }

    toast.error(serverMessage);
    return { success: false, error: serverMessage };
  }

};




export const seedRestaurantInfo = async (id) => {
  const seedKey = `hasSeeded_${id}`;
  const untilTodayKey = `lastSeededDate_${id}`;
  const today = new Date().toISOString().split('T')[0];

  let initialSeedSuccess = false;

  if (localStorage.getItem(seedKey)) {
    initialSeedSuccess = true;
  } else {
    try {
      const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";
      await api.post(
        `${AI_ENGINE_URL}/seed/${id}`,
        "",
        { headers: { accept: "application/json" } }
      );
      localStorage.setItem(seedKey, "true");
      initialSeedSuccess = true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      const errorDetail = error.response?.data?.detail || errorMessage || "";
      if (typeof errorDetail === 'string' && (errorDetail.includes("already has menu items") || errorDetail.includes("Cannot re-seed"))) {
        localStorage.setItem(seedKey, "true");
        initialSeedSuccess = true;
      } else {
        return { success: false, error: errorMessage };
      }
    }
  }

  if (initialSeedSuccess && localStorage.getItem(untilTodayKey) !== today) {
    try {
      const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || "https://youseef-awaad-zerobite-ai-engine.hf.space";
      const untilTodayResp = await api.post(
        `${AI_ENGINE_URL}/seed/untilToday/${id}`,
        "",
        { headers: { accept: "application/json" } }
      );
      localStorage.setItem(untilTodayKey, today);
      return { success: true, data: untilTodayResp.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      return { success: false, error: "Initial seed succeeded, but untilToday failed: " + errorMessage };
    }
  }

  return { success: true, data: "Already up to date locally." };
};

