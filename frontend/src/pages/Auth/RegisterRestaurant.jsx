import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

import AuthContainer from "./AuthContainer";
import img from "@/assets/Auth/SignUp.png";

const validationSchema = Yup.object({
  restaurantName: Yup.string().required("Restaurant Name is required"),
  address: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  restaurantPhone: Yup.string().required("Restaurant Phone is required"),
});

function getPersonalInfoFromStorage() {
  const storedPersonal = localStorage.getItem("registerPersonal");
  if (!storedPersonal) return null;
  try {
    return JSON.parse(storedPersonal);
  } catch {
    return null;
  }
}

function getPreviousRegisterFromStorage() {
  const storedFull = localStorage.getItem("registerFull");
  if (!storedFull) return null;
  try {
    return JSON.parse(storedFull);
  } catch {
    return null;
  }
}

const RegisterRestaurant = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const personalInfo = getPersonalInfoFromStorage();
  const previousRegister = getPreviousRegisterFromStorage();

  const formik = useFormik({
    initialValues: {
      restaurantName: previousRegister?.restaurantName || "",
      address: previousRegister?.address || "",
      city: previousRegister?.city || "",
      restaurantPhone: previousRegister?.restaurantPhone || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const finalData = { ...(personalInfo || {}), ...values };
      localStorage.setItem("registerFull", JSON.stringify(finalData));
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const response = await axios.post(
          "http://resturantai.runasp.net/api/Auth/register",
          finalData,
        );
        toast.success("Registration successful!");
        navigate("/login");
        localStorage.removeItem("registerFull");
        localStorage.removeItem("registerPersonal");
      } catch (error) {
        const serverMessage =
          error.response?.data ||
          error.response?.request?.responseText ||
          "Cannot connect to server. Please try again.";
        toast.error(serverMessage);
        setSubmitError(serverMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <AuthContainer img={img}>
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full max-w-[500px] flex flex-col gap-5 bg-card text-card-foreground p-2 md:p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Step 2: Restaurant Information</h2>

        <div className="space-y-2 relative">
          <Label htmlFor="restaurantName" className="font-semibold">Restaurant Name</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <Input
              id="restaurantName"
              name="restaurantName"
              placeholder="Restaurant Name"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("restaurantName")}
            />
          </div>
          {formik.touched.restaurantName && formik.errors.restaurantName && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantName}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="address" className="font-semibold">Address</Label>
          <div className="relative">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Input
              id="address"
              name="address"
              placeholder="Address"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("address")}
            />
          </div>
          {formik.touched.address && formik.errors.address && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.address}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="city" className="font-semibold">City</Label>
          <div className="relative">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <Input
              id="city"
              name="city"
              placeholder="City"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("city")}
            />
          </div>
          {formik.touched.city && formik.errors.city && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.city}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="restaurantPhone" className="font-semibold">Restaurant Phone</Label>
          <div className="relative">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <Input
              id="restaurantPhone"
              name="restaurantPhone"
              type="tel"
              autoComplete="tel"
              placeholder="Restaurant Phone"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("restaurantPhone")}
            />
          </div>
          {formik.touched.restaurantPhone && formik.errors.restaurantPhone && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantPhone}</p>}
        </div>

        {submitError && (
          <p className="text-destructive font-medium bg-destructive/10 p-3 rounded-md mt-2">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full mt-6 h-12 text-[1rem] shadow-md" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Complete Registration"}
        </Button>
      </form>
    </AuthContainer>
  );
};

export default RegisterRestaurant;
