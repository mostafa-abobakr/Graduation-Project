import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { useFormik } from "formik"
import { loginValidationSchema } from "@/schemas/auth/validations"
import { useNavigate, useSearchParams } from "react-router-dom"
import SquareAuthPage from "@/pages/pos/SquareAuthPage"
import ToastAuthPage from "@/pages/pos/ToastAuthPage"
import GeideaAuthPage from "@/pages/pos/GeideaAuthPage"
import { cn } from "@/lib/utils"

const POS_FOOTER_LINKS = {
  Square: [
    { label: "Privacy Policy", href: "https://squareup.com/us/en/legal/general/privacy-no-account" },
    { label: "Terms of Service", href: "https://squareup.com/us/en/legal/general/ua" },
    { label: "Help", href: "https://squareup.com/help/us/en" }
  ],
  Toast: [
    { label: "Privacy Policy", href: "https://pos.toasttab.com/privacy" },
    { label: "Terms of Service", href: "https://pos.toasttab.com/terms-of-service" },
    { label: "Help", href: "https://central.toasttab.com/" }
  ],
  geidea: [
    { label: "Privacy Policy", href: "https://www.geidea.net/egy/en/privacy-policy" },
    { label: "Terms of Service", href: "https://d23r9m22xg868b.cloudfront.net/public/files/KSA-Terms-and-Conditions-CP-CNP-English-Version-(17-08-2025).pdf" },
    { label: "Help", href: "https://www.geidea.net/egy/en/resources" }
  ]
}

const SIGNUP_URL = [
  { title: "Toast", url: "https://pos.toasttab.com/request-demo-intl" },
  { title: "geidea", url: "https://app.squareup.com/signup/en-US" },
  { title: "Square", url: "https://squareup.com/us/en/signup" }
]

const PosForm = ({ title, bgClass, textClass, icon }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signinHandler = (values) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSearchParams((prev) => {
        prev.set("auth", title)
        return prev
      })
    }, 1000)
  }

  const formik = useFormik({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema: loginValidationSchema,
    onSubmit: (values) => {
      signinHandler(values)
    }
  })

  const auth = searchParams.get("auth")
  if (auth) {
    if (auth === "Square") {
      return <SquareAuthPage />
    } else if (auth === "Toast") {
      return <ToastAuthPage />
    } else if (auth === "geidea") {
      return <GeideaAuthPage />
    }
  }

  const footerLinks = POS_FOOTER_LINKS[title] || POS_FOOTER_LINKS.geidea

  return (
    <div className="flex flex-col items-center justify-center bg-background text-foreground min-h-screen py-12 px-4">
      <div className="text-center">
        {icon}
        <h1 className="font-bold text-2xl mb-6 text-foreground tracking-tight">{title}</h1>
      </div>
      <form onSubmit={formik.handleSubmit} className="border border-border/60 bg-card text-card-foreground shadow-lg rounded-2xl p-6 w-full max-w-md">
        <h1 className="mb-1 font-semibold text-lg text-foreground">Sign in to {title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your credentials to authorize the application
        </p>
        
        <h4 className="text-foreground text-sm font-semibold mb-1">Email address</h4>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@restaurant.com"
          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-[3rem]"
          {...formik.getFieldProps("email")}
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-sm font-medium text-destructive mt-1">{formik.errors.email}</p>
        )}

        <h4 className="mt-4 text-foreground text-sm font-semibold mb-1">Password</h4>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-[3rem]"
          {...formik.getFieldProps("password")}
        />
        {formik.touched.password && formik.errors.password && (
          <p className="text-sm font-medium text-destructive mt-1">{formik.errors.password}</p>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className={cn("mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md", bgClass)}
        > 
          Sign in
        </button>
        <hr className="border-border/60 my-4" />
        <h2 className="text-center text-foreground text-sm">
          Don't have an account?{" "}
          <a 
            href={SIGNUP_URL.find(url => url.title === title)?.url} 
            target="_blank" 
            rel="noreferrer" 
            className={`${textClass} font-semibold hover:underline`}
          >
            Sign up
          </a>
        </h2>
      </form>
      <h4 className="text-center text-muted-foreground mt-6 text-xs space-x-2">
        {footerLinks.map((link, index) => (
          <React.Fragment key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
            {index < footerLinks.length - 1 ? " · " : ""}
          </React.Fragment>
        ))}
      </h4>
    </div>
  )
}

export default PosForm
