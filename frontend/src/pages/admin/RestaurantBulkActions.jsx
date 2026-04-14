import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RestaurantBulkActions({
  selectedCount,
  onCancel,
  onActivate,
  onDeactivate,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex justify-center w-full mb-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-card border border-border/60 shadow-md rounded-full px-5 py-2.5 flex items-center gap-4">
        {/* Selection Count Badge */}
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 px-3 py-1 text-sm font-medium"
        >
          {selectedCount} Selected
        </Badge>

        {/* Divider */}
        <div className="w-px h-6 bg-border/60"></div>

        {/* Cancel Button */}
        <Button
          className="rounded-full h-9 px-5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all"
          onClick={onCancel}
        >
          Cancel
        </Button>

        {/* Activate Button */}
        <Button
          className="rounded-full shadow-sm hover:shadow-md transition-all bg-emerald-500/10 hover:bg-emerald-500/[9.5%] text-emerald-500 h-9 px-5 border-0"
          onClick={onActivate}
        >
          Activate Selected
        </Button>

        {/* Deactivate Button */}
        <Button
          variant="destructive"
          className="rounded-full shadow-sm hover:shadow-md transition-all h-9 px-5"
          onClick={onDeactivate}
        >
          Deactivate Selected
        </Button>
      </div>
    </div>
  );
}
