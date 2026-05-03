import { Shield, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import AuthorizationSuccess from "./AuthorizationSuccess"

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
    },
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
            navigate("/register/plans")
        } catch (error) {
            setErrorMap("Failed to connect to Geidea. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return <AuthorizationSuccess
            title={title}
            icon={<Shield size={32} />}
            bgColor="bg-orange-600"
            textColor="text-black"
            buttonText="Continue to Geidea"
        /> 
    }

    return (
      <div className="min-h-[100vh] p-4 flex items-center justify-center bg-gray-50 ">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-14 h-14 mx-auto p-4 rounded-lg bg-orange-600 flex items-center justify-center">
              <Shield className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold mt-2 text-black   ">
              Geidea
            </h1>
          </div>

          <div className="  border-1 bg-white rounded-xl shadow-lg p-6 text-left">
            <h2 className="text-lg font-semibold mb-2 text-black">
              Authorize Application
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Merchant Partner App would like to access your Geidea account
            </p>
            <p className="text-sm font-medium mb-3 text-black">
              This application will be able to:
            </p>

            <div className="space-y-3 mb-4">
              <form onSubmit={(e) => e.preventDefault()}>
                {permissions.map((perm, index) => (
                  <div key={index} className="flex items-start gap-3 mt-3">
                    <div className="mt-0.5">
                      <CheckCircle size={18} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">
                        {perm.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                ))}
                {ErrorMap && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {ErrorMap}
                  </p>
                )}

                <hr className="h-1  my-3" />
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAllow}
                    disabled={isLoading}
                    className={`w-full py-2 rounded-md text-white bg-orange-600 disabled:opacity-50`}
                  >
                    {isLoading ? "Registering..." : "Allow Access"}
                  </button>
                  <button
                    type="button"
                    onClick={skipRegistration}
                    className="w-full py-2 rounded-md border text-black border-gray-300"
                  >
                    Skip For Now
                  </button>
                </div>
              </form>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              By authorizing this application, you agree to share the
              information listed above. You can revoke access at any time from
              your Geidea account settings.
            </p>
          </div>

          {/* <div className="text-xs text-gray-400 mt-4">
            Privacy Policy · Terms · Help
          </div> */}
        </div>
      </div>
    );
}