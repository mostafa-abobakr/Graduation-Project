import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { useSearchParams } from "react-router-dom";

// 👇 بره الكومبوننت
const stripePromise = loadStripe("pk_test_51TQ5BORysuYlhEbW9YiG0hjXd4OA7rtsX3ZJ53xuLqCMUNmftLpkbV5xzuwS86ARzgHArYFu0uTZLVTP5cCM9MSJ00a3YwnRjo");

export default function PaymentStripe() {
    const [searchParams] = useSearchParams();
    const plan = searchParams.get("plan") ;
    console.log("Received plan in PaymentStripe:", plan);
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm plan={plan} />
        </Elements>
    );
}