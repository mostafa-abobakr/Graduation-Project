import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginValidationSchema } from "@/schemas/auth/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  const { login, isSeeding } = useAuth();

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

  if (isSeeding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 w-full bg-background animate-in fade-in duration-300">
        <div className="bg-card text-card-foreground border border-border/60 rounded-3xl shadow-2xl p-10 max-w-xl w-full text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-2">
            {t("Setting Up Your Restaurant...")}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            {t("Creating default menus, staff schedule templates, and AI forecasting models. This may take up to a minute on your first launch. Please do not refresh or close this page.")}
          </p>
          <div className="flex items-center justify-center text-sm text-primary font-semibold gap-2">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            {t("Initializing database structures...")}
          </div>
        </div>
      </div>
    )
  }

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
          <div className="relative mt-1.5">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-10 rtl:pl-10 rtl:pr-3 bg-muted/30 border-border/60" {...formik.getFieldProps("password")} required />
            <button
              type="button"
              className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 flex items-center justify-center transition-all"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
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
