import { useAuth } from "@/contexts/AuthContext"
import { Loader2, CreditCard, Lock, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import axios from "axios"
import { useLanguage } from "@/contexts/LanguageContext"

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
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get("plan") || "Pro"

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  })

  const prices = { Basic: 0, Pro: 49, Enterprise: 199 }
  const price = prices[plan] || 49

  const handlePayment = async (e) => {
    e.preventDefault()

    if (price > 0) {
      const rawCard = formData.cardNumber.replace(/\s+/g, "")

      if (rawCard.length < 15 || rawCard.length > 16) {
        toast.error(t("Invalid card number length. Must be 15 or 16 digits."))
        return
      }

      if (!validateLuhn(rawCard)) {
        toast.error(t("Invalid card number. Please check the digits."))
        return
      }

      if (!validateExpiry(formData.expiry)) {
        toast.error(t("Invalid expiration date. Use MM/YY format (and ensure not expired)."))
        return
      }

      if (!validateCVV(formData.cvv)) {
        toast.error(t("Invalid CVV. Must be 3 or 4 digits."))
        return
      }
    }

    setLoading(true)

    // Simulating Payment Gateway Delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

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
      <div className="min-h-[60vh] flex items-center justify-center p-6 w-full animate-in fade-in duration-300">
        <div className="bg-card text-card-foreground border border-border/60 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="text-emerald-500 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-2">
            {t("Payment Successful!")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("Your subscription to the {{plan}} plan is confirmed. Welcome aboard!", { plan })}
          </p>
          <div className="flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            {t("Redirecting to dashboard...")}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-transparent flex py-12 px-4 sm:px-6 lg:px-8 w-full">
      <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-start animate-in slide-in-from-bottom-8 fade-in duration-700">
        
        {/* Payment Form */}
        <div className="bg-card text-card-foreground rounded-3xl shadow-xl p-8 border border-border/60">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="text-primary" />
              {t("Payment Method")}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t("Enter your card details securely.")}
            </p>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("Name on Card")}
              </label>
              <input
                required={price > 0}
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={price === 0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("Card Number")}
              </label>
              <div className="relative">
                <input
                  required={price > 0}
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength="19"
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 py-3 rounded-xl bg-background border border-border/60 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "")
                    val = val.replace(/(.{4})/g, "$1 ").trim()
                    setFormData({ ...formData, cardNumber: val })
                  }}
                  disabled={price === 0}
                />
                <CreditCard className="absolute left-3 rtl:left-auto rtl:right-3 top-3.5 text-muted-foreground w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("Expiry Date")}
                </label>
                <input
                  required={price > 0}
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                  value={formData.expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "")
                    if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2, 4)
                    setFormData({ ...formData, expiry: val })
                  }}
                  disabled={price === 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("CVV")}
                </label>
                <input
                  required={price > 0}
                  type="password"
                  placeholder="123"
                  maxLength="4"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "") })}
                  disabled={price === 0}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (price > 0 && (!formData.cardNumber || !formData.expiry || !formData.cvv))}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <>
                  <Lock size={18} />
                  {price === 0 ? t("Start Free Plan") : `${t("Pay")} $${price}`}
                </>
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
              <Lock size={12} /> {t("Payments are secure and encrypted.")}
            </p>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-muted/40 text-foreground rounded-3xl shadow-xl p-8 border border-border/60 sticky top-12">
          <h3 className="text-2xl font-bold mb-6">{t("Order Summary")}</h3>

          <div className="space-y-4 mb-6 border-b border-border/60 pb-6">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{plan} {t("Plan (Monthly)")}</span>
              <span className="font-semibold text-foreground">${price}.00</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{t("Setup Fee")}</span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <span className="text-lg font-medium">{t("Total")}</span>
            <div className="text-end">
              <span className="text-3xl font-bold text-primary">${price}.00</span>
              <p className="text-sm text-muted-foreground">{t("per month")}</p>
            </div>
          </div>

          <div className="bg-card text-card-foreground border border-border/60 rounded-xl p-4 text-sm">
            <strong className="text-foreground block mb-1">{t("Guaranteed Satisfaction")}</strong>
            {t("Change your plan or cancel at any time. We'll prorate your billing automatically.")}
          </div>
        </div>

      </div>
    </div>
  )
}
