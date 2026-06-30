import { Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"

export default function BillingPlans() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selectedPlan, setSelectedPlan] = useState("Pro")

  const plans = [
    {
      name: "Pro",
      price: "49",
      description: t("Ideal for growing restaurants."),
      features: [
        t("Up to 3 POS connections"),
        t("Advanced Inventory & Forecasting"),
        t("Unlimited staff"),
        t("Priority Support"),
        t("AI Insights")
      ],
      badge: t("Most Popular")
    },
    {
      name: "Enterprise",
      price: "199",
      description: t("For large chains and franchises."),
      features: [
        t("Unlimited POS connections"),
        t("Multi-location management"),
        t("Custom integrations"),
        t("24/7 Dedicated Support")
      ]
    }
  ]

  const handleContinue = (planName) => {
    navigate(`/register/payment?plan=${planName}`)
  }

  return (
    <div className="min-h-0 bg-transparent flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 w-full">
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
