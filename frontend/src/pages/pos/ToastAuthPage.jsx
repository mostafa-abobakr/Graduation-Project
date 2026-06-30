import { CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import AuthorizationSuccess from "./AuthorizationSuccess"
import toastIcon from "@/assets/posIcons/toast.svg"

const permissions = [
  {
    title: "Access your restaurant information",
    description: "View your restaurant name, location, and basic settings",
    key: "restaurantInfo"
  },
  {
    title: "Read menu data",
    description: "View menu items, prices, and modifiers",
    key: "menuData"
  },
  {
    title: "Access order history",
    description: "View past orders and transaction details",
    key: "orderHistory"
  },
  {
    title: "View employee information",
    description: "See employee names and roles within your restaurant",
    key: "employeeInfo"
  }
]

export default function PosAuthorizePage() {
  const [ErrorMap, setErrorMap] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const title = searchParams.get("auth")
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
      setErrorMap("Failed to connect to Toast. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthorizationSuccess
        title="Toast"
        icon={<img src={toastIcon} alt="Toast" className="w-8 h-8 object-contain" />}
        bgColor="bg-orange-600"
        textColor="text-orange-600 dark:text-orange-400"
        buttonText="Continue to Toast"
      />
    )
  }

  return (
    <div className="min-h-screen w-full max-w-lg p-4 flex items-center justify-center bg-background text-foreground animate-fade-in">
      <div className="w-full max-w-2xl text-center">
        {/* Header */}
        <div className="mb-6">
          <div className="w-14 h-14 mx-auto p-3.5 rounded-lg  flex items-center justify-center shadow-sm">
            <img src={toastIcon} alt="Toast" className="w-7 h-7 " />
          </div>
          <h1 className="text-2xl font-bold mt-3 text-foreground">Toast</h1>
        </div>

        {/* Card */}
        <div className="border border-border/60 bg-card text-card-foreground rounded-xl shadow-lg p-6 text-start">
          <h2 className="text-lg font-bold mb-1 text-foreground">
            Authorize Application
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            Business Partner App would like to access your Toast account
          </p>

          <p className="text-sm font-semibold mb-3 text-foreground">
            This application will be able to:
          </p>

          {/* Permissions */}
          <div className="space-y-3 mb-4">
            <form onSubmit={(e) => e.preventDefault()}>
              {permissions.map((perm, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{perm.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {perm.description}
                    </p>
                  </div>
                </div>
              ))}
              {ErrorMap && <p className="text-sm font-medium text-destructive mt-2">{ErrorMap}</p>}

              <hr className="border-border/60 my-4" />
              {/* Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center font-semibold transition-all shadow-sm"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Allow Access"}
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

          {/* Footer */}
          <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
            By authorizing this application, you agree to share the information listed above. You can revoke access at any time from your Square account settings.
          </p>
        </div>
      </div>
    </div>
  )
}