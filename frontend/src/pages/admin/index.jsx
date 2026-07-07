import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardCards from "./DashboardCards";
import RestaurantsTable from "./RestaurantsTable";
import { useAdminDashboard } from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useAdminDashboard();

  useEffect(() => {
    if (isError) {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        navigate("/unauthorized");
      }
    }
  }, [isError, error, navigate]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1 mt-2">
          Platform Overview
        </h1>
        <p className="text-muted-foreground text-sm">
          Overview and management of all registered restaurants.
        </p>
      </div>

      <DashboardCards data={data} isLoading={isPending} />

      <RestaurantsTable
        restaurants={data?.restaurants || []}
        loading={isPending || (!data && !isError)}
      />
    </div>
  );
}
