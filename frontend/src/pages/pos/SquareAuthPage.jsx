import { Square, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthorizationSuccess from "./AuthorizationSuccess";
import { registerUser, seedRestaurantInfo } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";

const permissions = [
  {
    title: "Read payment information",
    description: "View transactions, payments, and refund history",
    key: "paymentInformation",
  },
  {
    title: "Manage inventory",
    description: "Access and update product inventory and pricing",
    key: "inventory",
  },
  {
    title: "Access customer data",
    description: "View customer profiles and purchase history",
    key: "customerData",
  },
  {
    title: "View business analytics",
    description: "Access sales reports and insights",
    key: "businessAnalytics",
  },
];

export default function PosAuthorizePage() {
  const [ErrorMap, setErrorMap] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const title = searchParams.get("title");
  const { login } = useAuth();

  const signInHandler = async () => {
    const stored = localStorage.getItem("register");
    const formData = JSON.parse(stored);
    const { email, password } = formData;
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleAllow = async () => {
    setIsLoading(true);
    setErrorMap("");
    const result = await registerUser();
    setIsLoading(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMap(result.error);
    }
  };

  if (isSuccess) {
    return (
      <AuthorizationSuccess
        title={title}
        icon={<div className="w-5 h-5 bg-white rounded-sm" />}
        bgColor="bg-black"
        textColor="text-black"
        buttonText="Continue to Square"
      />
    );
  }

//   if (isLoading) {
//     return <LoadingSpinner />;
//   }

  return (
    <div className="min-h-[100vh] p-4 flex items-center bg-gray-200 justify-center">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-14 h-14 mx-auto p-4 rounded-lg bg-black flex items-center justify-center">
            <Square className="text-white" />
          </div>
          <h1 className="text-2xl text-black font-semibold mt-2">Square</h1>
        </div>

        <div className="border-gray-300 border-2 rounded-xl shadow-md p-6 text-left">
          <h2 className="text-lg text-black font-semibold mb-2">
            Authorize Application
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Business Partner App would like to access your Square account
          </p>
          <p className="text-sm font-medium text-black mb-3">
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
                    <p className="text-sm text-black font-medium">
                      {perm.title}
                    </p>
                    <p className="text-xs text-gray-500">{perm.description}</p>
                  </div>
                </div>
              ))}
              {ErrorMap && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {ErrorMap}
                </p>
              )}

              <hr className="h-1 my-3" />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  disabled={isLoading}
                  className="w-full py-2 rounded-md text-white bg-black disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Allow Access"}
                </button>
                <button
                  type="button"
                  className="w-full py-2 rounded-md border-2 border-gray-600 text-black"
                  onClick={signInHandler}
                >
                  Skip For Now
                </button>
              </div>
            </form>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            By authorizing this application, you agree to share the information
            listed above. You can revoke access at any time from your Square
            account settings.
          </p>
        </div>

        <div className="text-xs text-gray-400 mt-4">
          Privacy Policy · Terms · Help
        </div>
      </div>
    </div>
  );
}
