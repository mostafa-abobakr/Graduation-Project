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

            // console.log("Stripe result:", result);

            if (result.error) { setError(result.error.message); }
            else if (result.paymentIntent?.status === "succeeded") {
                toast({
                    title: "Payment Successful 🎉",
                    description: `Payment successful for ${plan}`,
                });

                
                axios.post(`https://youseef-awaad-zerobite-ai-engine.hf.space/seed/${resId}`)
                    .then(res => console.log("Seed done:", res.data))
                    .catch(err => console.log("Seed error:", err.response?.data));

                
                navigate("/dashboard");
            }
            else {
                setError("Payment failed or incomplete");
            }

        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Server error");
        }

        setLoading(false);
    };

    return { createPayment, loading, error, success};
}