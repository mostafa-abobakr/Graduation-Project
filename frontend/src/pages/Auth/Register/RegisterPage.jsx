import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import AuthContainer from "@/components/AuthContainer";
import { useAuth } from "@/contexts/AuthContext";

const validationSchema = Yup.object({
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  regPhone: Yup.string()
    .matches(/^[0-9]+$/, "Phone must contain only numbers")
    .min(11, "Phone Number must be at least 11 digits")
    .required("Phone is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  restaurantName: Yup.string().required("Restaurant Name is required"),
  restaurantPhone: Yup.string().required("Restaurant Phone is required"),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register } = useAuth();

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      regPhone: "",
      password: "",
      restaurantName: "",
      restaurantPhone: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        // await register(values);
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
        className="space-y-4"
      >
        <div>
          <Label htmlFor="fullName" className="text-foreground text-sm">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="username"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
          />
          {formik.touched.fullName && formik.errors.fullName && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.fullName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@restaurant.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="regPhone" className="text-foreground text-sm">Phone</Label>
          <Input
             id="regPhone"
              name="regPhone"
            type="tel"
            placeholder="01xxxxxxxxx"
            value={formik.values.regPhone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
            autoComplete="tel"
          />
          {/* <Input
              id="regPhone"
              name="regPhone"
              type="tel"
              placeholder="01xxxxxxxxx"
              className=" bg-muted/20 border-border/80 "
              value={formik.values.regPhone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              autoComplete="tel"
            /> */}
          {formik.touched.regPhone && formik.errors.regPhone && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.regPhone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>
          )}
        </div>

        <div>
          <Label htmlFor="restaurantName" className="text-foreground text-sm">Restaurant Name</Label>
          <Input
            id="restaurantName"
            name="restaurantName"
            placeholder="My Restaurant"
            value={formik.values.restaurantName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
          />
          {formik.touched.restaurantName && formik.errors.restaurantName && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantName}</p>
          )}
        </div>

        {/* <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city" className="text-foreground text-sm">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="City"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1.5 bg-muted/30 border-border/60"
            />
            {formik.touched.city && formik.errors.city && (
              <p className="text-sm font-medium text-destructive mt-1">{formik.errors.city}</p>
            )}
          </div> */}
          <div>
            <Label htmlFor="restaurantPhone" className="text-foreground text-sm">Restaurant Phone</Label>
            <Input
              id="restaurantPhone"
              name="restaurantPhone"
              type="tel"
              placeholder="Restaurant Phone"
              value={formik.values.restaurantPhone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1.5 bg-muted/30 border-border/60"
            />
            {formik.touched.restaurantPhone && formik.errors.restaurantPhone && (
              <p className="text-sm font-medium text-destructive mt-1">{formik.errors.restaurantPhone}</p>
            )}
          </div>
        {/* </div> */}

        {/* <div>
          <Label htmlFor="address" className="text-foreground text-sm">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="123 Main St"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="mt-1.5 bg-muted/30 border-border/60"
          />
          {formik.touched.address && formik.errors.address && (
            <p className="text-sm font-medium text-destructive mt-1">{formik.errors.address}</p>
          )}
        </div> */}

        {submitError && (
          <p className="text-destructive font-medium bg-destructive/10 p-3 rounded-md">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </AuthContainer>
  );
};

export default RegisterPage;
