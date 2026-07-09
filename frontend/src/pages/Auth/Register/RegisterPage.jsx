import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthContainer from "@/components/AuthContainer";

import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const validationSchema = signupValidationSchema.pick({
  fullName: true,
  email: true,
  userPhone: true,
  password: true,
});

const RegisterPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { formData, updateFromData } = useRegisterContext()


  const { register, handleSubmit, formState: { errors, touchedFields } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      userPhone: formData.userPhone || "",
      password: formData.password || "",
    },
    mode: "all",
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    setSubmitError("")
    try {
      updateFromData(values)
      navigate("/register/restaurant-details")
    } catch (error) {
      setSubmitError(error.message || t("Registration failed. Please try again."))
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <AuthContainer
      title={t("Create your account")}
      description={t("Start your 30-day free trial")}
      footerText={t("Already have an account?")}
      footerLinkText={t("Log in")}
      footerLinkTo="/login"
      className="min-h-0 py-6 bg-transparent"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full flex flex-col gap-5" >
        <div className="space-y-2 relative">
          <Label htmlFor="fullName" className="font-semibold">{t("Full Name")}</Label>
          <div className="relative">
            <svg className="absolute left-3 rtl:right-3 rtl:left-auto top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder={t("username")}
              className="pl-[2.5rem] rtl:pr-[2.5rem] rtl:pl-3 bg-muted/20 border-border/80 h-[3rem]"
              {...register("fullName")}
            />
          </div>
          {touchedFields.fullName && errors.fullName && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="email" className="font-semibold">{t("Email")}</Label>
          <div className="relative">
            <svg className="absolute left-3 rtl:right-3 rtl:left-auto top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("you@restaurant.com")}
              className="pl-[2.5rem] rtl:pr-[2.5rem] rtl:pl-3 bg-muted/20 border-border/80 h-[3rem]"
              {...register("email")}
            />
          </div>
          {touchedFields.email && errors.email && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>


        <div className="space-y-2 relative">
          <Label htmlFor="userPhone" className="font-semibold">{t("Phone")}</Label>
          <div className="relative">
            <svg className="absolute left-3 rtl:right-3 rtl:left-auto top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <Input
              id="userPhone"
              name="userPhone"
              type="tel"
              autoComplete="tel"
              placeholder={t("01xxxxxxxxx")}
              className="pl-[2.5rem] rtl:pr-[2.5rem] rtl:pl-3 bg-muted/20 border-border/80 h-[3rem]"
              {...register("userPhone")}
            />
          </div>
          {touchedFields.userPhone && errors.userPhone && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.userPhone.message}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="font-semibold">{t("Password")}</Label>
          <div className="relative">
            <svg className="absolute left-3 rtl:right-3 rtl:left-auto top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-[2.5rem] rtl:pr-[2.5rem] rtl:pl-3 bg-muted/20 border-border/80 h-[3rem]"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 rtl:left-3 rtl:right-auto top-3 text-muted-foreground hover:text-foreground z-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touchedFields.password && errors.password && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-6 h-12 text-[1rem] shadow-md" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : t("Next: Restaurant Details")}
        </Button>
      </form>
    </AuthContainer>
  )
}

export default RegisterPage
