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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import AuthContainer from "@/components/AuthContainer";

function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { login } = useAuth();
  
  const trainMutation = useMutation({
    mutationFn: async (restId) => {
      const response = await fetch(`https://youseef-awaad-zerobite-ai-engine.hf.space/train/${restId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Training request failed");
      return response.json();
    },
    onSuccess: (data) => console.log("Training response:", data),
    onError: (err) => console.error("Training failed:", err)
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setSubmitError("");

        const success = await login(values.email, values.password);
        
  
        if (success) {
          // 1. Get the user object that was just saved by the login function
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          
          // 2. Trigger the training API using TanStack Query useMutation
          if (storedUser?.restId) {
            trainMutation.mutate(storedUser.restId);
          }

          // 3. Navigate to dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        setSubmitError(error.response?.data?.message || t("Login failed."));
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <AuthContainer
      title={t("Welcome back")}
      description={t("Log in to your dashboard")}
      footerText={t("Don't have an account?")}
      footerLinkText={t("Sign up")}
      footerLinkTo="/register"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-foreground text-sm">{t("Email")}</Label>
          <Input id="email" type="email" placeholder={t("you@restaurant.com")} className="mt-1.5 bg-muted/30 border-border/60" {...formik.getFieldProps("email")} required />
          {formik.touched.email && formik.errors.email && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="password" className="text-foreground text-sm">{t("Password")}</Label>
          <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 bg-muted/30 border-border/60" {...formik.getFieldProps("password")} required />
          {formik.touched.password && formik.errors.password && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>}
        </div>

        {submitError && <div className="text-destructive text-[14px] font-medium bg-destructive/10 p-3 rounded-md">{submitError}</div>}
        
        <div className="flex justify-end mt-2">
          <Link to="/login/forgot-password" className="text-[0.875rem] font-bold text-primary hover:text-primary/80 transition-colors">{t("forgot password?")}</Link>
        </div>

        <Button type="submit" className="w-full h-10" disabled={isSubmitting || !formik.isValid}>
          {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {t("Log In")}
        </Button>
      </form>
    </AuthContainer>
  );
}

export default Login;
