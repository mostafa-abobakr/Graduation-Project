import React from "react";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InventoryPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("Inventory Tracking")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("Manage your restaurant's stock, track expiry dates, and handle reorders.")}
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="mt-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
