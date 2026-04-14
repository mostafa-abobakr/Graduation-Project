import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CalendarCheck, Ban, DollarSign } from "lucide-react";

export default function DashboardCards({ data, isLoading }) {
  const dashboardData = [
    {
      title: "Total Restaurants",
      value: data?.summary?.totalRestaurants ?? 0,
      icon: <Building2 className="h-6 w-6" />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    {
      title: "Active Restaurants",
      value: data?.summary?.activeRestaurants ?? 0,
      icon: <CalendarCheck className="h-6 w-6" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Inactive Restaurants",
      value: data?.summary?.inactiveRestaurants ?? 0,
      icon: <Ban className="h-6 w-6" />,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Total Revenue",
      value: `$${((data?.summary?.totalRestaurants ?? 0) * 500).toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5 bg-card border-border/60 premium-shadow">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full max-w-[100px]" />
                <Skeleton className="h-6 w-full max-w-[60px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dashboardData.map((item, index) => (
        <Card
          key={index}
          className="p-5 bg-card border-border/60 premium-shadow flex items-center gap-4 transition-transform hover:shadow-xl duration-300"
        >
          <div
            className={`flex items-center justify-center shrink-0 w-12 h-12 rounded-xl ${item.bgColor} ${item.color}`}
          >
            {item.icon}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mb-0.5">
              {item.title}
            </span>
            <span className="text-2xl font-bold text-foreground leading-tight tracking-tight">
              {item.value}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
