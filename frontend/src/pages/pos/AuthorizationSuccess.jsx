import { useAuth } from "@/contexts/AuthContext"
import { CheckCircle, Shield, Database, Loader2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function AuthorizationSuccess({
  title = "",
  subtitle = "Authorization Successful!",
  description = "Everything is set up and ready to go",
  icon,
  bgColor = "bg-orange-500",
  textColor = "text-orange-500"
}) {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signInHandler = async () => {
    setLoading(true)
    setTimeout(() => {
      navigate("/register/plans")
    }, 1000)
  }

  return (
    <div className="min-h-screen flex w-full flex-col items-center justify-center bg-background text-foreground  p-6 animate-fade-in">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-6">
        <div className={cn("w-14 h-14 flex items-center justify-center rounded-xl text-white shadow-sm")}>
          {icon}
        </div>
        <h2 className="text-xl font-bold mt-3 text-foreground">{title}</h2>
      </div>

      {/* Card */}
      <div className="bg-card text-card-foreground border border-border/60 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-500/10 p-3 rounded-full">
            <CheckCircle className="text-green-500" size={28} />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold mb-1 text-foreground">{subtitle}</h3>
        <p className="text-muted-foreground text-sm mb-6">{description}</p>

        {/* Steps */}
        <div className="space-y-4 text-start mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <Shield size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Authentication Complete</p>
                <p className="text-xs text-muted-foreground">Signed in successfully</p>
              </div>
            </div>
            <CheckCircle size={18} className="text-green-500" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CheckCircle size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Authorization Granted</p>
                <p className="text-xs text-muted-foreground text-opacity-80">
                  Access permissions approved
                </p>
              </div>
            </div>
            <CheckCircle size={18} className="text-green-500" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Database size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Permissions Set</p>
                <p className="text-xs text-muted-foreground">
                  Data access configured
                </p>
              </div>
            </div>
            <CheckCircle size={18} className="text-green-500" />
          </div>
        </div>

        {/* Redirect Box */}
        {loading && (
          <div className="bg-blue-500/10 text-blue-500 border border-blue-500/20 p-4 rounded-xl text-sm mb-6 animate-pulse">
            Redirecting... You will be redirected shortly
          </div>
        )}

        {/* Button */}
        <button
          onClick={signInHandler}
          className={cn("w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-sm", bgColor)}
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Continue"}
        </button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-4">
          Your connection is secure and encrypted.
        </p>
      </div>

      {/* Bottom Links */}
      <div className="flex gap-4 text-muted-foreground text-xs mt-6">
        <span className="hover:underline cursor-pointer">Privacy Policy</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Terms of Service</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Help</span>
      </div>
    </div>
  )
}