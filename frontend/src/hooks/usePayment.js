import { CardNumberElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export function usePayment() {
    const [loading, setLoading] = useState(false);
    const [loadingSData, setLoadingSData] = useState(false);
    console.log("Loading state in usePayment:", loadingSData);
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
                // setSuccess(`Payment successful for ${plan} 🎉`);
                toast({ title: "Payment Successful 🎉", description: `Payment successful for ${plan}`, variant: "default", });
                try {
                    setLoadingSData(true);
                    const res = await axios.post(`https://youseef-awaad-zerobite-ai-engine.hf.space/seed/${resId}`);
                    console.log("Restaurant seed response:", res.data);
                    navigate("/dashboard");

                } catch (apiError) {
                    console.log("Seed API error:", apiError);

                    setError(
                        apiError.response?.data?.detail ||
                        apiError.response?.data?.message ||
                        "Failed to load restaurant data"
                    );
                } finally {
                    setLoadingSData(false);
                }
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

    return { createPayment, loading, error, success, loadingSData };
}