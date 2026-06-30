import { useAuth } from "@/contexts/AuthContext"
import { Loader2, CreditCard, Lock, CheckCircle, Leaf } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { toast } from "sonner"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

const validateLuhn = (cardNumber) => {
  const digits = cardNumber.replace(/\s+/g, "").split("").map(Number)
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i]
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

const validateExpiry = (expiry) => {
  const parts = expiry.split("/")
  if (parts.length !== 2) return false
  const month = parseInt(parts[0], 10)
  const year = parseInt("20" + parts[1], 10)
  if (isNaN(month) || isNaN(year)) return false
  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  return true
}

const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv)
}



export default function PaymentGateway() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get("plan") || "Pro";

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    });

    const prices = { Basic: 0, Pro: 49, Enterprise: 199 };
    const price = prices[plan] || 49;

    const handlePayment = async (e) => {
        e.preventDefault()

        if (price > 0) {
            const rawCard = formData.cardNumber.replace(/\s+/g, "")

            if (rawCard.length < 15 || rawCard.length > 16) {
                toast.error("Invalid card number length. Must be 15 or 16 digits.")
                return
            }

            if (!validateLuhn(rawCard)) {
                toast.error("Invalid card number. Please check the digits.")
                return
            }

            if (!validateExpiry(formData.expiry)) {
                toast.error("Invalid expiration date. Use MM/YY format (and ensure not expired).")
                return
            }

            if (!validateCVV(formData.cvv)) {
                toast.error("Invalid CVV. Must be 3 or 4 digits.")
                return
            }
        }

        setLoading(true)

        // Simulating Payment Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        setSuccess(true)
        setLoading(false)

        // Simulating login and redirect
        setTimeout(async () => {
            try {
                const stored = localStorage.getItem("register")
                if (stored) {
                    const parsed = JSON.parse(stored)
                    const { email, password } = parsed
                    if (login && email && password) {
                        const res = await login(email, password)
                        const resId = res?.user?.restId || res?.restId || parsed?.restId
                        if (resId) {
                            try {
                                await axios.post(`https://youseef-awaad-zerobite-ai-engine.hf.space/seed/${resId}`)
                                console.log("Seeding complete")
                            } catch (seedErr) {
                                console.error("Seeding error:", seedErr)
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Login after payment failed", err)
            }
            navigate("/dashboard")
        }, 1500)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 relative w-full">
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 rtl:left-auto rtl:right-4 sm:rtl:right-6">
                    <Link to="/" className="inline-flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Leaf className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            ZeroBite
                        </span>
                    </Link>
                </div>

                <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
                    <ThemeToggle />
                </div>

                <Card className="p-10 max-w-md w-full text-center animate-in zoom-in-95 duration-500 fade-in bg-card border-border/60 premium-shadow-md">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="text-primary w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-foreground mb-2">Payment Successful!</h2>
                    <p className="text-muted-foreground mb-6">Your subscription to the {plan} plan is confirmed. Welcome aboard!</p>
                    <div className="flex items-center justify-center text-sm text-muted-foreground gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        Redirecting to dashboard...
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full bg-background flex items-center justify-center pb-12 px-4 sm:px-6 lg:px-8">
            {/* Header: Logo and ThemeToggle */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 rtl:left-auto rtl:right-4 sm:rtl:right-6">
                <Link to="/" className="inline-flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Leaf className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        ZeroBite
                    </span>
                </Link>
            </div>

            <div className="absolute top-4 sm:top-6 right-4 rtl:right-auto rtl:left-4 z-10">
                <ThemeToggle />
            </div>

            <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-8 items-stretch animate-in slide-in-from-bottom-8 fade-in duration-700 pt-16">

                {/* Payment Form */}
                <Card className="p-8 bg-card border-border/60 premium-shadow-md">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <CreditCard className="text-primary" />
                            Payment Method
                        </h2>
                        <p className="text-muted-foreground mt-1">Enter your card details securely.</p>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-6">
                        <div>
                            <Label className="text-foreground text-sm mb-1.5 block">Name on Card</Label>
                            <Input
                                required={price > 0}
                                type="text"
                                placeholder="John Doe"
                                className="bg-muted/30 border-border/60"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                disabled={price === 0}
                            />
                        </div>

                        <div>
                            <Label className="text-foreground text-sm mb-1.5 block">Card Number</Label>
                            <div className="relative">
                                <Input
                                    required={price > 0}
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength="19"
                                    className="pl-10 rtl:pr-10 rtl:pl-3 bg-muted/30 border-border/60"
                                    value={formData.cardNumber}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        val = val.replace(/(.{4})/g, '$1 ').trim();
                                        setFormData({ ...formData, cardNumber: val });
                                    }}
                                    disabled={price === 0}
                                />
                                <CreditCard className="absolute left-3 rtl:right-3 rtl:left-auto top-2.5 text-muted-foreground w-5 h-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label className="text-foreground text-sm mb-1.5 block">Expiry Date</Label>
                                <Input
                                    required={price > 0}
                                    type="text"
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    className="bg-muted/30 border-border/60"
                                    value={formData.expiry}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                        setFormData({ ...formData, expiry: val });
                                    }}
                                    disabled={price === 0}
                                />
                            </div>
                            <div>
                                <Label className="text-foreground text-sm mb-1.5 block">CVV</Label>
                                <Input
                                    required={price > 0}
                                    type="password"
                                    placeholder="123"
                                    maxLength="4"
                                    className="bg-muted/30 border-border/60"
                                    value={formData.cvv}
                                    onChange={e => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
                                    disabled={price === 0}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || (price > 0 && (!formData.cardNumber || !formData.expiry || !formData.cvv))}
                            className="w-full h-12 text-lg font-bold mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    <Lock className="w-5 h-5 me-2" />
                                    {price === 0 ? "Start Free Plan" : `Pay $${price}`}
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 mt-4">
                            <Lock size={12} /> Payments are secure and encrypted.
                        </p>
                    </form>
                </Card>

                {/* Order Summary */}
                <Card className="p-8 bg-card border-border/60 premium-shadow-md flex flex-col h-full lg:sticky lg:top-24">
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-foreground">Order Summary</h3>

                        <div className="space-y-4 mb-6 border-b border-border pb-6">
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>{plan} Plan (Monthly)</span>
                                <span className="font-semibold text-foreground">${price}.00</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>Setup Fee</span>
                                <span className="font-semibold text-foreground">$0.00</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <span className="text-lg font-medium text-foreground">Total</span>
                            <div className="text-right">
                                <span className="text-3xl font-bold text-primary">${price}.00</span>
                                <p className="text-sm text-muted-foreground">per month</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground border border-border/50 mt-auto">
                        <strong className="text-foreground block mb-1">Guaranteed Satisfaction</strong>
                        Change your plan or cancel at any time. We'll prorate your billing automatically.
                    </div>
                </Card>

            </div>
        </div>
    );
}
