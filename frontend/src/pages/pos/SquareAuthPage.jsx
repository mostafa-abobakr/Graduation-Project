import { Square, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import AuthorizationSuccess from "./AuthorizationSuccess"

const permissions = [
  {
    title: "Read payment information",
    description: "View transactions, payments, and refund history",
    key: "paymentInformation"
  },
  {
    title: "Manage inventory",
    description: "Access and update product inventory and pricing",
    key: "inventory"
  },
  {
    title: "Access customer data",
    description: "View customer profiles and purchase history",
    key: "customerData"
  },
  {
    title: "View business analytics",
    description: "Access sales reports and insights",
    key: "businessAnalytics"
  }
]

export default function PosAuthorizePage() {
  const [ErrorMap, setErrorMap] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const title = searchParams.get("title")

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
      setErrorMap("Failed to connect to Square. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthorizationSuccess
        title="Square"
        icon={<div className="w-5 h-5 bg-background rounded-sm" />}
        bgColor="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        textColor="text-foreground"
        buttonText="Continue to Square"
      />
    )
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-background text-foreground animate-fade-in">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-14 h-14 mx-auto p-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-sm">
            <Square className="text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold mt-3 text-foreground">Square</h1>
        </div>

        <div className="border border-border/60 bg-card text-card-foreground rounded-xl shadow-lg p-6 text-left">
          <h2 className="text-lg font-bold mb-1 text-foreground">
            Authorize Application
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Business Partner App would like to access your Square account
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
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
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
                  className="w-full py-3 rounded-xl font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm"
                >
                  {isLoading ? "Sending..." : "Allow Access"}
                </button>
                <button
                  type="button"
                  className="w-full py-3 rounded-xl border border-border text-foreground hover:bg-muted bg-transparent transition-all font-semibold"
                  onClick={skipRegistration}
                >
                  Skip For Now
                </button>
              </div>
            </form>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
            By authorizing this application, you agree to share the information
            listed above. You can revoke access at any time from your Square
            account settings.
          </p>
        </div>
      </div>
    </div>
  )
}
