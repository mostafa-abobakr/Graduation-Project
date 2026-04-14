import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import DashboardCards from "./DashboardCards";
import RestaurantsTable from "./RestaurantsTable";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.get(
        "http://resturantai.runasp.net/api/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error) {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        navigate("/unauthorized");
      } else {
        throw error;
      }
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["Admin_dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
  });

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

      <DashboardCards data={data} isLoading={isLoading} />

      <RestaurantsTable
        restaurants={data?.restaurants || []}
        loading={isLoading || (!data && !isError)}
      />
    </div>
  );
}
