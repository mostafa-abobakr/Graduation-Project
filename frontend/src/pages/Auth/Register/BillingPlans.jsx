import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const plans = [
    {
        name: "Basic",
        price: "0",
        description: "Perfect for small cafes and food trucks.",
        features: ["1 POS connection", "Basic Inventory", "Up to 5 staff members", "Community Support"],
        bg: "bg-white",
        text: "text-gray-900",
        button: "bg-gray-100 text-gray-900 hover:bg-gray-200"
    },
    {
        name: "Pro",
        price: "49",
        description: "Ideal for growing restaurants.",
        features: ["Up to 3 POS connections", "Advanced Inventory & Forecasting", "Unlimited staff", "Priority Support", "AI Insights"],
        bg: "bg-orange-50",
        text: "text-orange-900",
        border: "border-2 border-orange-500",
        button: "bg-orange-500 text-white hover:bg-orange-600",
        badge: "Most Popular"
    },
    {
        name: "Enterprise",
        price: "199",
        description: "For large chains and franchises.",
        features: ["Unlimited POS connections", "Multi-location management", "Custom integrations", "24/7 Dedicated Support"],
        bg: "bg-white",
        text: "text-gray-900",
        button: "bg-gray-900 text-white hover:bg-gray-800"
    }
];

export default function BillingPlans() {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState("Pro");

    const handleContinue = (planName) => {
        // navigate(`/register/payment?plan=${selectedPlan}`);
        navigate(`/register/stripe?plan=${planName}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Choose the right plan for your restaurant</h1>
                <p className="text-lg text-gray-500">Upgrade your restaurant's efficiency with our powerful features. Select a plan to continue your setup.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative rounded-2xl shadow-xl flex flex-col p-8 cursor-pointer transition-transform transform hover:-translate-y-2 ${plan.bg} ${plan.border || 'border border-gray-100'} ${selectedPlan === plan.name ? 'ring-2 ring-orange-500' : ''}`}
                        onClick={() => setSelectedPlan(plan.name)}
                    >
                        {plan.badge && (
                            <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                {plan.badge}
                            </span>
                        )}
                        <h2 className={`text-2xl font-bold mb-2 ${plan.text}`} >{plan.name}</h2>
                        <div className="mb-4">
                            <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                            <span className="text-gray-500">/mo</span>
                        </div>
                        <p className="text-gray-500 mb-6 flex-grow">{plan.description}</p>
                        <ul className="space-y-4 mb-8">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-center gap-3">
                                    <Check className="text-orange-500" size={20} />
                                    <span className="text-gray-600 font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 ${plan.button}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan(plan.name);
                                handleContinue(plan.name);
                            }}
                        >
                            Select {plan.name} <ArrowRight size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
