import { useState } from "react";
import { Check, Square, Shield } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import PosForm from "@/components/PosForm";

// Custom SVG to perfectly match a Toast POS bread slice 🍞
export const ToastIcon = ({ size = 28, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 4H9c-3 0-5 2.5-5 5v1.5c0 1.5.5 2.5 1.5 2.5V19c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2v-6c1 0 1.5-1 1.5-2.5V9c0-2.5-2-5-5-5z" />
  </svg>
);
const posOptions = [
  {
    id: "toast",
    name: "Toast POS",
    color: "bg-orange-600",
    borderColor: "border-orange-600",
    icon: <ToastIcon size={28} />,
  },
  {
    id: "square",
    name: "Square",
    color: "bg-black",
    borderColor: "border-black",
    icon: <Square size={28} />,
  },
  {
    id: "geidea",
    name: "Geidea",
    color: "bg-orange-600",
    borderColor: "border-orange-600",
    icon: <Shield size={28} />,
  },
];

export default function ConnectPOS() {
  const [selected, setSelected] = useState("toast");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleConnect = () => {
    setLoading(true);

    // simulate redirect
    setTimeout(() => {
      setSearchParams({ pos: selected });
      setLoading(false);
    }, 1000);
  };

  const currentPos = searchParams.get("pos");

  // Only intercept the page if a POS is actually selected in the URL
  if (currentPos) {
    switch (currentPos) {
      case "toast":
        return (
          <PosForm 
            title={"Toast"} 
            bgClass="bg-orange-600" 
            textClass="text-orange-600"
            icon={<ToastIcon
              className={`w-14 h-14 mx-auto mb-4 rounded-lg flex items-center justify-center text-white bg-orange-600`}
            />}
          />
        );
      case "square":
        return (
          <PosForm 
            title={"Square"} 
            bgClass="bg-black" 
            textClass="text-blue-600"
            icon={<Square size={28} 
              className={`w-14 h-14 mx-auto p-4 mb-4 rounded-lg flex items-center justify-center text-white bg-black `}
            />}
          />
        );
      case "geidea":
        return <PosForm
          title={"geidea"}
          bgClass="bg-orange-600"
          textClass="text-orange-600"
          icon={<Shield size={28} 
            className={`w-14 h-14 mx-auto mb-4 rounded-lg flex items-center justify-center text-white bg-orange-600`}
          />}
        />
      default:
        break; // Fall back to POS picker if invalid
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background  p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold  mb-2">
        Connect Your POS System
      </h1>
      <p className="text-gray-500 mb-10">
        Choose your point of sale platform to get started
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
        {posOptions.map((pos) => {
          const isSelected = selected === pos.id;

          return (
            <div
              key={pos.id}
              onClick={() => setSelected(pos.id)}
              className={`relative border-2 cursor-pointer rounded-2xl p-8 text-center transition-all ${
                isSelected
                  ? `${pos.borderColor} shadow-lg scale-105`
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              {/* Check Icon */}
              {isSelected && (
                <div
                  className={`absolute top-3 right-3 ${pos.color} text-white rounded-full p-1`}
                >
                  <Check size={16} />
                </div>
              )}

           
              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-lg flex items-center justify-center text-white ${pos.color}`}
              >
                {pos.icon}
              </div>

             
              <h3 className="text-md font-bold ">{pos.name}</h3>
            </div>
          );
        })}
      </div>

      {/* Button */}
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`${selected === "toast"||selected === "geidea" ? "bg-orange-600 hover:bg-orange-700" : "bg-black hover:bg-gray-800"} text-white px-8 py-3 rounded-xl text-lg font-medium transition-all disabled:opacity-50`}
      >
        {loading ? "Connecting..." : "Connect to POS →"}
      </button>
        
      {/* Footer */}
      <p className="text-gray-400 text-sm mt-6 text-center">
        Secure OAuth 2.0 authentication • Your credentials are never stored
      </p>

      <div className="flex gap-4 text-gray-400 text-sm mt-2">
        <span>Privacy Policy</span>
        <span>•</span>
        <span>Terms of Service</span>
        <span>•</span>
        <span>Support</span>
      </div>
    </div>
  );
}
