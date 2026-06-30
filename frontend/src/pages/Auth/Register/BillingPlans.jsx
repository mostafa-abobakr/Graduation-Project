import { Check, ArrowRight, Leaf } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
export default function BillingPlans() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selectedPlan, setSelectedPlan] = useState("Operations Pro")

  const plans = [
    {
      name: "Operations Pro",
      price: "49",
      description: t("Ideal for growing restaurants focusing on core operations."),
      features: [
        t("Dashboard & POS System"),
        t("AI Insights & Demand Forecasting"),
        t("Inventory Alerts & Forecasting"),
        t("Menu Management & Analytics"),
        t("Revenue Tracking & Reports")
      ],
      badge: t("Most Popular")
    },
    {
      name: "Full Management Suite",
      price: "129",
      description: t("For premium restaurants that need full staff and operations management."),
      features: [
        t("All Operations Pro Features"),
        t("Staff Management"),
        t("Smart Staff Scheduling"),
        t("Advanced Priority Support")
      ]
    }
  ]

  const handleContinue = (planName) => {
    navigate(`/register/payment?plan=${planName}`)
  }

  return (
    <div className="min-h-0 bg-transparent flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 w-full">
       {/* Header: Logo and ThemeToggle */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 rtl:left-auto rtl:right-4 sm:rtl:right-6">
                <Link to="/" className="inline-flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Leaf className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        ZeroBite
                    </span>
                </Link>
            </div>

            <div className="absolute top-4 sm:top-6 right-4 rtl:right-auto rtl:left-4 z-10">
                <ThemeToggle />
            </div>

      <div className="text-center max-w-3xl mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">
          {t("Choose the right plan for your restaurant")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t("Upgrade your restaurant's efficiency with our powerful features. Select a plan to continue your setup.")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl shadow-md flex flex-col p-8 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                isSelected
                  ? "bg-primary/5 border-2 border-primary shadow-xl scale-[1.02]"
                  : "bg-card border border-border/60 hover:border-primary/40 text-card-foreground"
              }`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.badge && (
                <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {plan.badge}
                </span>
              )}
              <h2 className={`text-2xl font-bold mb-2 ${isSelected ? "text-primary" : "text-foreground"}`}>
                {plan.name}
              </h2>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">/{t("mo")}</span>
              </div>
              <p className="text-muted-foreground mb-6 flex-grow text-sm">{plan.description}</p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="text-primary" size={18} />
                    <span className="text-muted-foreground text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlan(plan.name)
                  handleContinue(plan.name)
                }}
              >
                {t("Select")} {plan.name} <ArrowRight size={18} className="rtl:rotate-180" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
