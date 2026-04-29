import { CheckCircle } from "lucide-react";
import { ToastIcon } from "./ConnectPosPage";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthorizationSuccess from "./AuthorizationSuccess";
import { registerUser } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";


const permissions =
    [
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
        },
    ]
export default function PosAuthorizePage() {
    const [ErrorMap, setErrorMap] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams();
    const title = searchParams.get("auth")
    const navigate = useNavigate();
    const {login} = useAuth();

    const signInHandler = async (e) => {
        if (e) e.preventDefault();
        
        setIsLoading(true);
        setErrorMap("");
        
        try {
            const stored = localStorage.getItem("register");

            if (!stored) {
                console.error("No registration data found. Please log in.");
                navigate("/login");
                return;
            }

            const formData = JSON.parse(stored);
            console.log("formData:",formData)
            if (!formData || !formData.email || !formData.password) {
                console.error("Incomplete login credentials. Please log in again.");
                navigate("/login");
                return;
            }

            try {
                await axios.post("https://resturantai.runasp.net/api/Auth/register", formData);
            } catch (err) {
                const errorData = err.response?.data;
                const msg = typeof errorData === "string" ? errorData : errorData?.message || errorData?.title;
                if (msg !== "Email already exists" && msg !== "User already exists") {
                    setErrorMap(msg || "Failed to register account.");
                    setIsLoading(false);
                    return;
                }
            }

            
            const success = await login(formData.email, formData.password);
            if (success) {
                navigate("/dashboard");
            } else {
                navigate("/login");
            }
        } catch (error) {
            console.error("Registration/login skip execution failed:", error);
            setErrorMap("An unexpected error occurred while skipping.");
        } finally {
            setIsLoading(false);
        }
    }

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
    }

    if (isSuccess) {
        return <AuthorizationSuccess
            title={title}
            icon={<ToastIcon size={32} />}
            bgColor="bg-orange-600"
            textColor="text-black"
            buttonText="Continue to Toast"
        /> 
    }

    return (
        <div className="min-h-[100vh] p-4 flex items-center bg-gray-50 justify-center  ">
            <div className="w-full max-w-md text-center">

                {/* Header */}
                <div className="mb-6">
                    <div className="w-14 h-14 mx-auto p-4 rounded-lg bg-orange-600 flex items-center justify-center">
                        <ToastIcon className="text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold mt-2 text-black">Toast</h1>
                </div>

                {/* Card */}
                <div className="border-2 border-gray-200 bg-white rounded-xl shadow-md p-6 text-left">
                    <h2 className="text-lg font-semibold mb-2 text-black">
                        Authorize Application
                    </h2>

                    <p className="text-sm text-gray-600 mb-4">
                        Business Partner App would like to access your Toast account
                    </p>

                    <p className="text-sm font-medium mb-3 text-black">
                        This application will be able to:
                    </p>

                    {/* Permissions */}
                    <div className="space-y-3 mb-4">
                        <form onSubmit={(e) => e.preventDefault()}>
                            {permissions.map((perm, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <CheckCircle size={18} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-black">{perm.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {perm.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {ErrorMap && <p className="text-sm font-medium text-red-500 mt-1">{ErrorMap}</p>}

                            <hr className="h-1 border-gray-200 my-3" />
                            {/* Buttons */}
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
                                    onClick={signInHandler}
                                    className="w-full py-2 font-semibold rounded-md border border-gray-400 text-black bg-white hover:bg-gray-50"
                                >
                                    Skip For Now
                                </button>
                            </div>
                        </form>
                        {/* Remember device */}
                        {/* <div className="flex items-start gap-2 mb-4">
                        <input type="checkbox" className="mt-1" />
                        <div>
                            <p className="text-sm font-medium">Remember this device</p>
                            <p className="text-xs text-gray-500">
                                You won't be asked to authorize again
                            </p>
                        </div>
                    </div> */}

                    </div>

                    {/* Footer */}
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        By authorizing this application, you agree to share the information listed above. You can revoke access at any time from your Square account settings.
                    </p>
                </div>

                <div className="text-xs text-gray-500 mt-4">
                    Privacy Policy · Terms · Help
                </div>
            </div>
        </div>
    );
}