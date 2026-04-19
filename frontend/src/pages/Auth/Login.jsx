import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginValidationSchema } from "@/schemas/auth/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import {ThemeToggle} from "@/components/shared/ThemeToggle";

import { useAuth } from "@/contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { login } = useAuth();
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setSubmitError("");

        const success = await login(values.email, values.password);
        if (success) {
          navigate("/dashboard");
        }
      } catch (error) {
        setSubmitError(error.response?.data?.message || "Login failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm  mx-auto py-16 ">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Leaf className="h-4.5 w-4.5 text-primary" /></div>
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>ZeroWaste</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Log in to your dashboard</p>
        </div>
        <Card className="p-7 bg-card border-border/60 premium-shadow-md">
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
              <Input id="email" type="email" placeholder="you@restaurant.com" className="mt-1.5 bg-muted/30 border-border/60" {...formik.getFieldProps("email")} required />
              {formik.touched.email && formik.errors.email && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 bg-muted/30 border-border/60" {...formik.getFieldProps("password")} required />
              {formik.touched.password && formik.errors.password && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>}
            </div>

            {submitError && <div className="text-destructive text-[14px] font-medium bg-destructive/10 p-3 rounded-md">{submitError}</div>}
            
            <div className="flex justify-end mt-2">
              <Link to="/login/forgot-password" className="text-[0.875rem] font-bold text-primary hover:text-primary/80 transition-colors">forgot password?</Link>
            </div>

            <Button type="submit" className="w-full h-10" disabled={isSubmitting || !formik.isValid}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log In
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </>
  );
}

export default Login;
