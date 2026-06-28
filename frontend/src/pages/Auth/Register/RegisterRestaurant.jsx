import React, { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthContainer from "@/components/AuthContainer";
import img from "@/assets/Auth/SignUp.png";
import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";
import { Loader2 } from "lucide-react";

const validationSchema = signupValidationSchema.pick(["restaurantName", "restaurantPhone"])

const RegisterRestaurant = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const { formData, updateFromData } = useRegisterContext()

  const formik = useFormik({
    initialValues: {
      restaurantName: formData.restaurantName || "",
      restaurantPhone: formData.restaurantPhone || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true)
      updateFromData(values)
      // Changed to navigate to the new location page
      navigate("/register/restaurant-location")
      setIsSubmitting(false)
    },
  })

  return (
    <AuthContainer
      title="Restaurant Details"
      description="Tell us about your business"
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
      className="min-h-0 py-6 bg-transparent "
    >
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full flex flex-col gap-5 "
      >

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
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Next: Set Location"}
        </Button>
      </form>
    </AuthContainer>
  )
}

export default RegisterRestaurant
