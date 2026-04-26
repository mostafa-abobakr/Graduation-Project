import React, { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthContainer from "@/components/AuthContainer";
import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";
import { Loader2 } from "lucide-react";

const validationSchema = signupValidationSchema.pick([
  "fullName",
  "email",
  "userPhone",
  "password",
  "restaurantName",
  "restaurantPhone",
]);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { formData, updateFromData } = useRegisterContext();

  const formik = useFormik({
    initialValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      userPhone: formData.userPhone || "",
      password: formData.password || "",
      restaurantName: formData.restaurantName || "",
      restaurantPhone: formData.restaurantPhone || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        updateFromData(values);
        navigate("/register/restaurant-location");
      } catch (error) {
        setSubmitError(error.message || "Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <AuthContainer
      title="Create your account"
      description="Start your 14-day free trial"
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full flex flex-col gap-5"
      >
        <div className="space-y-2 relative">
          <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <Input
              id="fullName"
              name="fullName"
              placeholder="username"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("fullName")}
            />
          </div>
          {formik.touched.fullName && formik.errors.fullName && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="email" className="font-semibold">Email</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@restaurant.com"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("email")}
            />
          </div>
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="userPhone" className="font-semibold">Phone</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <Input
              id="userPhone"
              name="userPhone"
              type="tel"
              placeholder="01xxxxxxxxx"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("userPhone")}
            />
          </div>
          {formik.touched.userPhone && formik.errors.userPhone && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.userPhone}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="font-semibold">Password</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("password")}
            />
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>
          )}
        </div>

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
          {formik.touched.restaurantName && formik.errors.restaurantName && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantName}</p>
          )}
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
              placeholder="Restaurant Phone"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("restaurantPhone")}
            />
          </div>
          {formik.touched.restaurantPhone && formik.errors.restaurantPhone && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantPhone}</p>
          )}
        </div>

        {submitError && (
          <p className="text-destructive font-medium bg-destructive/10 p-3 rounded-md mt-2">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full mt-6 h-12 text-[1rem] shadow-md" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Continue"}
        </Button>
      </form>
    </AuthContainer>
  );
};

export default RegisterPage;
