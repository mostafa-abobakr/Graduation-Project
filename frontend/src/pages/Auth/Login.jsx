import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import AuthFooter from "./AuthFooter";
import AuthForm from "./AuthForm";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import LoginImg from "@/assets/Auth/Login.json";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  });

  const { login } = useAuth();
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setSubmitError("");

        const success = await login(values.email, values.password);
        if (success) {
          navigate("/dashboard");
        }
      } catch (error) {
        // the error messages are already handled and toasted by the AuthContext 
        // we can still set local submit error if desired
        setSubmitError(error.response?.data?.message || "Login failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <AuthContainer img={LoginImg} isLottie={true}>
      <AuthForm header="Welcome Back!" onSubmit={formik.handleSubmit}>
        <div className="space-y-5 w-full">
          <div className="space-y-2 relative">
            <Label htmlFor="email" className="font-semibold text-foreground">Email Address</Label>
            <div className="relative">
              <span className="absolute left-3 top-[0.6rem] text-primary font-bold z-10">@</span>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="username@gmail.com"
                className="pl-8 bg-muted/20 border-border/80 h-[3rem]"
                {...formik.getFieldProps("email")}
              />
            </div>
            {formik.touched.email && formik.errors.email && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>}
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password" className="font-semibold text-foreground">Password</Label>
            <div className="relative">
              <svg className="absolute left-3 top-[0.7rem] w-[1.1rem] h-[1.1rem] text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-[2.2rem] bg-muted/20 border-border/80 h-[3rem]"
                autoComplete="current-password"
                {...formik.getFieldProps("password")}
              />
            </div>
            {formik.touched.password && formik.errors.password && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>}
          </div>

          {submitError && <div className="text-destructive text-[14px] font-medium bg-destructive/10 p-3 rounded-md">{submitError}</div>}

          <Button type="submit" className="w-full h-12 mt-6 text-[1rem] shadow-md hover:shadow-lg transition-all" disabled={isSubmitting || !formik.isValid}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          <div className="flex justify-end mt-2">
            <Link to="/login/forgot-password" className="text-[0.875rem] font-bold text-primary hover:text-primary/80 transition-colors">forgot password?</Link>
          </div>

          <AuthFooter text="Don't have an account?" linkText="Sign up" onLinkClick={() => navigate("/register")} />
        </div>
      </AuthForm>
    </AuthContainer>
  );
}

export default Login;
