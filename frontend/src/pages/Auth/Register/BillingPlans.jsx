import { Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const plans = [
  {
    name: "Basic",
    price: "0",
    description: "Perfect for small cafes and food trucks.",
    features: ["1 POS connection", "Basic Inventory", "Up to 5 staff members", "Community Support"],
    bg: "bg-card text-card-foreground",
    text: "text-card-foreground",
    button: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  },
  {
    name: "Pro",
    price: "49",
    description: "Ideal for growing restaurants.",
    features: ["Up to 3 POS connections", "Advanced Inventory & Forecasting", "Unlimited staff", "Priority Support", "AI Insights"],
    bg: "bg-primary/5",
    text: "text-primary",
    border: "border-2 border-primary shadow-lg",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
    badge: "Most Popular"
  },
  {
    name: "Enterprise",
    price: "199",
    description: "For large chains and franchises.",
    features: ["Unlimited POS connections", "Multi-location management", "Custom integrations", "24/7 Dedicated Support"],
    bg: "bg-card text-card-foreground",
    text: "text-card-foreground",
    button: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  }
]

export default function BillingPlans() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState("Pro")

  const handleContinue = (planName) => {
    navigate(`/register/stripe?plan=${planName}`)
  }

  return (
    <div className="min-h-0 bg-transparent flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Choose the right plan for your restaurant</h1>
        <p className="text-base text-muted-foreground">Upgrade your restaurant's efficiency with our powerful features. Select a plan to continue your setup.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl shadow-md flex flex-col p-8 cursor-pointer transition-transform transform hover:-translate-y-1 ${plan.bg} ${plan.border || 'border border-border/60'} ${selectedPlan === plan.name ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedPlan(plan.name)}
          >
            {plan.badge && (
              <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {plan.badge}
              </span>
            )}
            <h2 className={`text-2xl font-bold mb-2 ${plan.text}`} >{plan.name}</h2>
            <div className="mb-4">
              <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <p className="text-muted-foreground mb-6 flex-grow text-sm">{plan.description}</p>
            <ul className="space-y-4 mb-8">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="text-primary" size={18} />
                  <span className="text-muted-foreground text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${plan.button}`}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPlan(plan.name)
                handleContinue(plan.name)
              }}
            >
              Select {plan.name} <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
