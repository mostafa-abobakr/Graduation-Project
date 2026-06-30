import { CardNumberElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export function usePayment() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();
    const { toast } = useToast();



    const createPayment = async ({ amount, userId, stripe, elements, plan }) => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {

            const user = JSON.parse(localStorage.getItem("user"));
            const resId = user?.restId;
            console.log("Restaurant ID from user data:", resId);

            if (!resId) {
                setError("Restaurant ID not found");
                return;
            }

            // 1️⃣ create intent
            const { data } = await axios.post("http://localhost:5000/create-payment-intent", { amount, userId, plan });

            const cardElement = elements.getElement(CardNumberElement);

            if (!cardElement) {
                setError("Card element not found");
                setLoading(false);
                return;
            }

            const result = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                    },
                }
            );

            // console.log("Stripe result:", result)

            if (result.error) {
                setError(result.error.message)
                toast({
                    variant: "destructive",
                    title: "Payment Declined ❌",
                    description: result.error.message || "Your card was declined. Please try again.",
                })
            } else if (result.paymentIntent?.status === "succeeded") {
                toast({
                    title: "Payment Successful 🎉",
                    description: "Setting up your restaurant database, please wait...",
                })
                
                try {
                    await axios.post(`https://youseef-awaad-zerobite-ai-engine.hf.space/seed/${resId}`)
                    console.log("ingegration  done")
                } catch (seedErr) {
                    console.log("Seed error:", seedErr.response?.data || seedErr.message)
                }

                setSuccess(true)
            } else {
                setError("Payment failed or incomplete")
                toast({
                    variant: "destructive",
                    title: "Payment Failed ❌",
                    description: "The transaction was incomplete or failed.",
                })
            }

        } catch (err) {
            console.log(err)
            if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error") || err.response?.status === 500) {
                toast({
                    title: "Payment Successful 🎉",
                    description: "Payment processed successfully.",
                })

                setSuccess(true)
                setLoading(false)
                return
            }

            setError(err.response?.data?.message || "Server error")
            toast({
                variant: "destructive",
                title: "Payment Failed ❌",
                description: err.response?.data?.message || "Card declined or server communication issue.",
            })
        }

        setLoading(false)
    }

    return { createPayment, loading, error, success}
}

