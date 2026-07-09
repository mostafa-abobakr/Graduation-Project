import * as z from "zod";

export const loginValidationSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export const signupValidationSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  userPhone: z.string()
    .min(1, "Phone is required")
    .regex(/^\d+$/, "Phone must be a number")
    .min(11, "Phone Number must be at least 11 number"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  restaurantName: z.string().min(1, "Restaurant Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  restaurantPhone: z.string().min(1, "Restaurant Phone is required"),
});