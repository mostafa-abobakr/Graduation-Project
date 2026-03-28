
import axios from "axios";
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
    const response = await axios.post(
      "http://resturantai.runasp.net/api/Auth/register",
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
      if (data.message === "Email already exists") {
       
        console.log("Email already exists");
          const result = await signIn(email, password)
          if(result.success){
            return { success: true, data: response.data };
          }
        
      }
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


const signIn = async (email, password) => {
  try {
    const response = await axios.post("http://resturantai.runasp.net/api/Auth/login", 
      { email, password }, 
      {
      headers: {
        "Content-Type": "application/json",
      },
    })
    const id = response.data.restId;
    console.log(response.data);
    
    console.log(id);
    if (!id) {
      return { success: false, error: "Registration succeeded, but restaurant ID is missing" };
    }
    const seedResult = await seedRestaurantInfo(id);
    if (!seedResult.success) {
      return { success: false, error: "Registration succeeded, but data seeding failed: " + seedResult.error };
    }
    toast.success("Registration successful!");
    return { success: true, data: response.data };
  }
  catch (error) {
    const data = error.response?.data;
    console.log(data);
    let serverMessage = "Cannot connect to server. Please try again.";
    toast.error(serverMessage);
    return { success: false, error: serverMessage };
  }
}

export const seedRestaurantInfo = async (id) => {
  try {
    const seedResp = await axios.post(
      `https://youseef-awaad-zerobite-ai-engine.hf.space/seed/${id}`,
      "",
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    return { success: true, data: seedResp.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.response?.data || error.message;
    return { success: false, error: errorMessage };
  }
};

