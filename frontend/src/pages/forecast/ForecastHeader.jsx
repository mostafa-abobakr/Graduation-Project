import React from "react"
import { Button } from "@/components/ui/button"
import { Settings, Brain } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ForecastHeader({ alignment, setAlignment, setModalOpen }) {
  const { t, language } = useLanguage()
  const now = new Date()

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-background">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Sales Forecast")}</h1>
          <p className="text-muted-foreground text-sm">
            {language === 'ar' 
              ? now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
              : now.toDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex bg-muted/60 p-1.5 rounded-xl shadow-inner border border-border/40">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-3px)] bg-background rounded-lg shadow transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${alignment === "day" ? "0%" : "calc(100% - 6px)"})`,
            }}
          />
          {[
            { id: "day", label: t("Tomorrow") },
            { id: "week", label: t("This Week") },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAlignment(mode.id)}
              aria-pressed={alignment === mode.id}
              className={`relative z-10 px-4 py-1 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
                alignment === mode.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
