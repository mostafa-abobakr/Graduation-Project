import { CardNumberElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { useState } from "react";

export function usePayment() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const createPayment = async ({ amount, userId, stripe, elements, plan }) => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // 1️⃣ create intent
            const { data } = await axios.post(
                "http://localhost:5000/create-payment-intent", { amount, userId, plan }
            );

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

            if (result.error) {
                setError(result.error.message);
            }
            else if (result.paymentIntent?.status === "succeeded") {
                setSuccess(`Payment successful for ${plan} 🎉`);
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

    return { createPayment, loading, error, success };
}