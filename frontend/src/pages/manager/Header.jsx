import React from "react";
import { LayoutDashboard } from "lucide-react";
const Header = ({ viewMode, setViewMode }) => {
  return (
    <header
      className="
        flex 
        flex-col sm:flex-row 
        justify-between 
        items-center 
        gap-4
        bg-background 
      "
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your business operations
          </p>
        </div>
      </div>

      {/* Animated Segmented Picker (Glider) */}
      <div className="relative flex bg-muted/60 p-1.5 rounded-xl w-full sm:w-[320px] shadow-inner border border-border/40">
        <div
          className="absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-background rounded-lg shadow transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(${
              viewMode === "today" ? "0" : viewMode === "week" ? "100" : "200"
            }%))`,
          }}
        />
        {["today", "week", "month"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            aria-pressed={viewMode === mode}
            className={`relative z-10 flex-1 py-1 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
              viewMode === mode
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </header>
  );
};

export default Header;
