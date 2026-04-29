import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckoutForm({ plan }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    console.log("Selected Plan:", plan);


    const prices = { Basic: 0, Pro: 49, Enterprise: 199 };

    const amount = prices[plan];
    console.log("amount", amount);

    const stripe = useStripe();
    const elements = useElements();

    const { createPayment, loading, error, success } = usePayment();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id || 30;

    // useEffect(() => { if (success) { handleLoginAfterPayment(); } }, [success]);

    // const handleLoginAfterPayment = async () => {
    //     try {
    //         const stored = localStorage.getItem("register");

    //         if (stored) {
    //             const parsed = JSON.parse(stored);
    //             const { email, password } = parsed;

    //             if (email && password) {
    //                 const res = await login(email, password);
    //                 if (!res) return;
    //             }
    //         }

    //         navigate("/dashboard");

    //     } catch (err) {
    //         console.error("Login after payment failed", err);
    //     }
    // };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        createPayment({ amount, userId, stripe, elements, plan });
    };

    const elementStyle = {
        style: {
            base: { fontSize: "16px", color: "#fff", "::placeholder": { color: "#9ca3af" }, },
            invalid: { color: "#ef4444" },
        },
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black px-4">

            <form
                className="w-full max-w-md p-8 rounded-3xl 
        bg-white/5 backdrop-blur-2xl border border-white/10 
        shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6"
                onSubmit={handleSubmit}
            >


                {/* Title */}
                <div className="text-center space-y-1">
                    <h2 className="text-white text-xl font-semibold text-center"> Plan {plan} </h2>
                    <h3 className="text-white text-2xl font-semibold"> Secure Payment </h3>
                    <p className="text-gray-400 text-sm"> Enter your card details below </p>
                </div>

                {/* Card Number */}
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-blue-600/40 to-indigo-600/40">
                    <div className="bg-gray-900/80 rounded-2xl p-4">
                        <CardNumberElement options={elementStyle} />
                    </div>
                </div>

                {/* Expiry + CVC */}
                <div className="flex gap-4">

                    <div className="relative w-1/2 p-[1px] rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30">
                        <div className="bg-gray-900/80 rounded-2xl p-4">
                            <CardExpiryElement options={elementStyle} />
                        </div>
                    </div>

                    <div className="relative w-1/2 p-[1px] rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30">
                        <div className="bg-gray-900/80 rounded-2xl p-4">
                            <CardCvcElement options={elementStyle} />
                        </div>
                    </div>

                </div>

                {/* Button */}
                <button
                    className="w-full py-3 rounded-2xl font-semibold text-white
            bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600
            shadow-lg shadow-blue-500/20
            hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!stripe || loading}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                        </span>
                    ) : (
                        "Pay Now"
                    )}
                </button>

                {/* Messages */}
                {error && (
                    <p className="text-red-400 text-sm text-center animate-pulse">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="text-green-400 text-sm text-center animate-fade-in">
                        {success}
                    </p>
                )}

            </form>
        </div>
    );
}