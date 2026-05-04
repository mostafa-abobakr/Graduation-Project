import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/AuthContainer";

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
    const userId = user?.userID || 30;

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
        <AuthContainer title={`${plan} Plan - Secure Payment`} description="Enter your card details below" >
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                {/* Card Number */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Card Number</label>
                    <div className="border border-input bg-background rounded-md p-3 shadow-sm">
                        <CardNumberElement options={elementStyle} />
                    </div>
                </div>

                {/* Expiry + CVC */}
                <div className="flex gap-4">
                    <div className="w-1/2 space-y-1">
                        <label className="text-sm font-medium text-foreground">Expiry Date</label>
                        <div className="border border-input bg-background rounded-md p-3 shadow-sm">
                            <CardExpiryElement options={elementStyle} />
                        </div>
                    </div>

                    <div className="w-1/2 space-y-1">
                        <label className="text-sm font-medium text-foreground">CVC</label>
                        <div className="border border-input bg-background rounded-md p-3 shadow-sm">
                            <CardCvcElement options={elementStyle} />
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button
                    className="w-full py-2.5 mt-4 rounded-md font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                    disabled={!stripe || loading}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                        </>
                    ) : (
                        "Pay Now"
                    )}
                </button>

                {/* Messages */}
                {error && (
                    <div className="text-destructive font-medium text-sm text-center bg-destructive/10 p-3 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="text-green-600 dark:text-green-400 font-medium text-sm text-center bg-green-500/10 p-3 rounded-md">
                        {success}
                    </div>
                )}
            </form>
        </AuthContainer>
    );
}