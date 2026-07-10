import { CheckCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import AuthorizationSuccess from "./AuthorizationSuccess"
import geideaIcon from "@/assets/posIcons/geidea.svg"

const permissions = [
  {
    title: "Process payments",
    description: "Accept and process card and digital wallet payments",
    key: "processPayments"
  },
  {
    title: "Access transaction history",
    description: "View payment records, refunds, and transaction details",
    key: "transactionHistory"
  },
  {
    title: "Manage merchant settings",
    description: "Update terminal configurations and payment preferences",
    key: "merchantSettings"
  },
  {
    title: "View reports and analytics",
    description: "Access business insights and financial reports",
    key: "reportsAndAnalytics"
  }
]

export default function PosAuthorizePage() {
  const [ErrorMap, setErrorMap] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const title = searchParams.get("title")
  const navigate = useNavigate()

  const skipRegistration = () => {
    navigate("/login")
  }

  const handleAllow = async () => {
    setIsLoading(true)
    setErrorMap("")
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsSuccess(true)
    } catch (error) {
      setErrorMap("Failed to connect to Geidea. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthorizationSuccess
        title="Geidea"
        icon={<img src={geideaIcon} alt="Geidea" loading="lazy" className="w-14 h-14 object-contain drop-shadow-sm" />}
        bgColor="bg-transparent"
        textColor="text-orange-600 dark:text-orange-400"
        buttonText="Continue to Geidea"
      />
    )
  }

  return (
    <div className="min-h-screen w-full p-4 flex items-center justify-center bg-background text-foreground animate-fade-in">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex flex-col items-center">
          <img
            src={geideaIcon}
            alt="Geidea"
            loading="lazy"
            className="w-16 h-16 object-contain drop-shadow-sm"
          />
          <h1 className="text-2xl font-bold mt-4 text-foreground">
            Geidea
          </h1>
        </div>

        <div className="border border-border/60 bg-card text-card-foreground rounded-xl shadow-lg p-6 text-start">
          <h2 className="text-lg font-bold mb-1 text-foreground">
            Authorize Application
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Merchant Partner App would like to access your Geidea account
          </p>
          <p className="text-sm font-semibold mb-3 text-foreground">
            This application will be able to:
          </p>

          <div className="space-y-3 mb-4">
            <form onSubmit={(e) => e.preventDefault()}>
              {permissions.map((perm, index) => (
                <div key={index} className="flex items-start gap-3 mt-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {perm.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {perm.description}
                    </p>
                  </div>
                </div>
              ))}
              {ErrorMap && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {ErrorMap}
                </p>
              )}

              <hr className="border-border/60 my-4" />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-all font-semibold shadow-sm"
                >
                  {isLoading ? "Registering..." : "Allow Access"}
                </button>
                <button
                  type="button"
                  onClick={skipRegistration}
                  className="w-full py-3 rounded-xl border border-border text-foreground hover:bg-muted bg-transparent transition-all font-semibold"
                >
                  Skip For Now
                </button>
              </div>
            </form>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
            By authorizing this application, you agree to share the
            information listed above. You can revoke access at any time from
            your Geidea account settings.
          </p>
        </div>
      </div>
    </div>
  )
}