import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Shield, Database } from "lucide-react";
import { useState } from "react";
import {  useNavigate } from "react-router-dom";

export default function AuthorizationSuccess({
    title = "",
    subtitle = "Authorization Successful!",
    description = "Everything is set up and ready to go",
    icon,
    bgColor = "bg-orange-500",
    textColor = "text-orange-500",
   
})
{
const {login} = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const signInHandler = async () => {
        const stored = localStorage.getItem("register");
        const formData = JSON.parse(stored);
        const { email, password } = formData;
        setLoading(true);
        const success = await login(email, password)
        if (success) {
            navigate("/dashboard")
        }
        setLoading(false);
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">

            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-6">
                <div className={`w-14 h-14 flex items-center justify-center rounded-xl text-white ${bgColor}`}>
                    {icon}
                </div>
                <h2 className="text-xl font-semibold mt-3 text-black">{title}</h2>
            </div>

            {/* Card */}
            <div className="bg-white  rounded-2xl shadow-xl p-8 w-full max-w-md text-center">

                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="text-green-600" size={28} />
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold mb-1 text-black" >{subtitle}</h3>
                <p className="text-gray-500 mb-6">{description}</p>

                {/* Steps */}
                <div className="space-y-4 text-left mb-6">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <Shield size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black">Authentication Complete</p>
                                <p className="text-xs text-gray-400">Signed in successfully</p>
                            </div>
                        </div>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <CheckCircle size={18} className={`${textColor}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black">Authorization Granted</p>
                                <p className="text-xs text-gray-400">
                                    Access permissions approved
                                </p>
                            </div>
                        </div>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Database size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black ">Permissions Set</p>
                                <p className="text-xs text-gray-400">
                                    Data access configured
                                </p>
                            </div>
                        </div>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>

                </div>

                {/* Redirect Box */}
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-600 mb-6">
                    Redirecting... You will be redirected shortly
                </div>

                {/* Button */}
                <button
                    onClick={signInHandler}
                    className={`w-full py-3 rounded-xl text-white font-medium ${bgColor}`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Continue"}
                </button>

                {/* Footer */}
                <p className="text-xs text-gray-400 mt-4">
                    Your connection is secure and encrypted.
                </p>
            </div>

            {/* Bottom Links */}
            <div className="flex gap-4 text-gray-400 text-sm mt-6">
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Service</span>
                <span>•</span>
                <span>Help</span>
            </div>
        </div>
    );
}