import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthContainer from "@/components/AuthContainer";
import img from "@/assets/Auth/SignUp.png";
import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";

// import {validationSchema} from "@/schemas/auth/register.schema";

// function getPreviousRegister() {
//   const storedFull = localStorage.getItem("registerFull");
//   if (!storedFull) return null;
//   try {
//     return JSON.parse(storedFull);
//   } catch {
//     return null;
//   }
// }
const validationSchema = signupValidationSchema.pick(["fullName","email","userPhone","password"])
const RegisterPersonal = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {formData,updateFromData,resetFormData} = useRegisterContext();
  const formik = useFormik({
    initialValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      userPhone: formData.userPhone || "",
      password: formData.password || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setIsSubmitting(true);
      updateFromData(values);
      navigate("/register/restaurant");
      setIsSubmitting(false);
    },
  });

  return (
    <AuthContainer img={img}>
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full max-w-[500px] flex flex-col gap-5 bg-card text-card-foreground p-2 md:p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Step 1: Personal Information</h2>

        <div className="space-y-2 relative">
          <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Full Name"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("fullName")}
            />
          </div>
          {formik.touched.fullName && formik.errors.fullName && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.fullName}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="email" className="font-semibold">Email</Label>
          <div className="relative">
            <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("email")}
            />
          </div>
          {formik.touched.email && formik.errors.email && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="userPhone" className="font-semibold">Phone Number</Label>
          <div className="relative">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <Input
              id="userPhone"
              name="userPhone"
              type="tel"
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("userPhone")}
            />
          </div>
          {formik.touched.userPhone && formik.errors.userPhone && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.userPhone}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="font-semibold">Password</Label>
          <div className="relative">
            <svg className="absolute left-3 top-[0.75rem] w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
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
          {formik.touched.password && formik.errors.password && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>}
        </div>

        <Button type="submit" className="w-full mt-6 h-12 text-[1rem] shadow-md" disabled={isSubmitting}>
          {isSubmitting ? "Submitting ..." : "Next Step"}
        </Button>
      </form>
    </AuthContainer>
  );
};

export default RegisterPersonal;
