import React, { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useRegisterContext } from "@/contexts/Valdation"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "Personal Info", paths: ["/register", "/register/"] },
  { id: 2, label: "Restaurant Details", paths: ["/register/restaurant-details"] },
  { id: 3, label: "Restaurant Location", paths: ["/register/restaurant-location"] },
  { id: 4, label: "Connect POS", paths: ["/register/connect-pos"] },
  { id: 5, label: "Billing Plan", paths: ["/register/plans", "/register/stripe", "/register/payment"] }
]

const Register = () => {
  const { formData } = useRegisterContext()
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname

  // Guard: redirect to the correct step based on filled data
  useEffect(() => {
    const hasPersonal = formData.fullName && formData.email && formData.userPhone && formData.password
    const hasRestaurant = formData.restaurantName && formData.restaurantPhone

    // If on restaurant details step but personal info is missing → go back
    if (currentPath.includes("restaurant-details") && !hasPersonal) {
      navigate("/register", { replace: true })
    }
    // If on restaurant location step but restaurant details or personal info is missing → go back
    if (currentPath.includes("restaurant-location") && (!hasPersonal || !hasRestaurant)) {
      navigate(hasPersonal ? "/register/restaurant-details" : "/register", { replace: true })
    }
    // If on connect-pos step but restaurant info is missing → go back
    if (currentPath.includes("connect-pos") && (!hasPersonal || !hasRestaurant)) {
      navigate(hasPersonal ? "/register/restaurant-details" : "/register", { replace: true })
    }
  }, [formData, currentPath, navigate])

  const normalizedPath = currentPath.endsWith("/") && currentPath.length > 1
    ? currentPath.slice(0, -1)
    : currentPath

  const matchedStep = STEPS.find(step => step.paths.includes(normalizedPath))
  const currentStepId = matchedStep ? matchedStep.id : 1
  
  const searchParams = new URLSearchParams(location.search)
  const isExternalPosFlow = currentPath.includes("connect-pos") && (searchParams.has("pos") || searchParams.has("auth"))
  
  const showProgress = !!matchedStep && !isExternalPosFlow

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showProgress && (
        <div className="w-full max-w-xl mx-auto pt-8 px-6 animate-fade-in">
          {/* Stepper Grid/Flex */}
          <div className="flex items-start justify-between relative">
            {/* Connecting lines background */}
            <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
            {/* Active/Completed line */}
            <div
              className="absolute top-[18px] left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500 z-0"
              style={{ width: `${((Math.max(1, currentStepId) - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step) => {
              const isCompleted = currentStepId > step.id
              const isActive = currentStepId === step.id
              return (
                <div key={step.id} className="flex flex-col items-center z-10 relative">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                      isCompleted
                        ? "bg-primary text-primary-foreground scale-100 shadow-sm"
                        : isActive
                          ? "bg-background border-2 border-primary text-primary ring-4 ring-primary/20 scale-110"
                          : "bg-muted border border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : step.id}
                  </div>
                  {/* Label */}
                  <span
                    className={cn(
                      "mt-2.5 text-xs font-semibold whitespace-nowrap transition-colors duration-300",
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground/80 font-medium"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex-1 flex  items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}

export default Register
