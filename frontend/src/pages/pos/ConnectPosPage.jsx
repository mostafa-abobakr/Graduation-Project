import { useState } from "react"
import { Check } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import AuthContainer from "@/components/AuthContainer"
import PosForm from "@/components/PosForm"
import toastIcon from "@/assets/posIcons/toast.svg"
import squareIcon from "@/assets/posIcons/square.svg"
import geideaIcon from "@/assets/posIcons/geidea.svg"

const posOptions = [
  {
    id: "toast",
    name: "Toast POS",
    icon: <img src={toastIcon} alt="Toast POS" className="w-10 h-10 object-contain" />
  },
  {
    id: "square",
    name: "Square",
    icon: <img src={squareIcon} alt="Square" className="w-10 h-10 object-contain" />
  },
  {
    id: "geidea",
    name: "Geidea",
    icon: <img src={geideaIcon} alt="Geidea" className="w-10 h-10 object-contain" />
  }
]

export default function ConnectPOS() {
  const [selected, setSelected] = useState("toast")
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleConnect = () => {
    setLoading(true)
    setTimeout(() => {
      setSearchParams({ pos: selected })
      setLoading(false)
    }, 1000)
  }

  const currentPos = searchParams.get("pos")

  // Render the correct POS auth form when a POS is selected in the URL
  if (currentPos) {
    switch (currentPos) {
      case "toast":
        return (
          <PosForm
            title="Toast"
            bgClass="bg-orange-600 hover:bg-orange-700 text-white"
            textClass="text-orange-600 dark:text-orange-400"
            icon={
              <img
                src={toastIcon}
                alt="Toast"
                className="w-14 h-14 mx-auto mb-4 rounded-lg p-2.5 object-contain"
              />
            }
          />
        )
      case "square":
        return (
          <PosForm
            title="Square"
            bgClass="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
            textClass="text-blue-600 dark:text-blue-400"
            icon={
              <img
                src={squareIcon}
                alt="Square"
                className="w-14 h-14 mx-auto p-3 mb-4 rounded-lg bg-white object-contain"
              />
            }
          />
        )
      case "geidea":
        return (
          <PosForm
            title="geidea"
            bgClass="bg-orange-600 hover:bg-orange-700 text-white"
            textClass="text-orange-600 dark:text-orange-400"
            icon={
              <img
                src={geideaIcon}
                alt="Geidea"
                className="w-14 h-14 mx-auto p-3.5 mb-4 rounded-lg object-contain"
              />
            }
          />
        )
      default:
        break
    }
  }

  return (
    <AuthContainer
      title="Connect Your POS System"
      description="Choose your point of sale platform to get started"
      className="min-h-0 py-6 bg-transparent "
      maxWidth="max-w-4xl"
    >
      {/* POS Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8  w-full">
        {posOptions.map((pos) => {
          const isSelected = selected === pos.id
          return (
            <div
              key={pos.id}
              onClick={() => setSelected(pos.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelected(pos.id)
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select ${pos.name}`}
              className={`relative border-2 cursor-pointer rounded-2xl p-8 text-center bg-card text-card-foreground transition-all duration-300 ${
                isSelected
                  ? "border-primary shadow-lg scale-105"
                  : "border-border/60 hover:border-primary/45 hover:shadow-md"
              }`}
            >
              {/* Check Icon */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                  <Check size={14} />
                </div>
              )}

              {/* Brand Icon */}
              <div
                className={`w-16 h-16 mx-auto mb-5 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-center transition-colors ${
                  isSelected ? "bg-primary/10 border-primary/20" : ""
                }`}
              >
                {pos.icon}
              </div>

              <h3 className="text-md font-bold">{pos.name}</h3>
            </div>
          )
        })}
      </div>

      {/* Connect Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-3 rounded-xl text-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 w-full md:w-auto"
        >
          {loading ? "Connecting..." : "Connect to POS →"}
        </button>

        <p className="text-muted-foreground text-xs text-center">
          Secure OAuth 2.0 authentication • Your credentials are never stored
        </p>

        <div className="flex gap-4 text-muted-foreground text-xs">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>Support</span>
        </div>
      </div>
    </AuthContainer>
  )
}
