import * as Yup from "yup";

export const loginValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export const signupValidationSchema = Yup.object({
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  userPhone: Yup.number()
    .typeError("Phone must be a number")
    .required("Phone is required")
    .min(11, "Phone Number must be at least 11 number"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  restaurantName: Yup.string()
    .required("Restaurant Name is required"),
  address: Yup.string()
    .required("Address is required"),
  city: Yup.string()
    .required("City is required"),
  restaurantPhone: Yup.string()
    .required("Restaurant Phone is required"),
}); 