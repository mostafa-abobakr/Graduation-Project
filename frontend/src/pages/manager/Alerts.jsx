import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

const Alerts = ({ data }) => {
  if (!data) return null;

  return (
    <section className="flex-1 min-h-0 md:ml-4 p-4 flex flex-col overflow-y-auto max-h-[350px] rounded-xl border bg-card text-card-foreground shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <h2 className="mb-4 text-lg md:text-xl font-bold tracking-tight">
        Smart Alerts
      </h2>

      <ul className="flex flex-col gap-3">
        {data.alerts.slice(0, 5).map((alert, index) => (
          <li
            key={alert.link ?? index}
            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-balance">
                {alert.message}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Alerts;