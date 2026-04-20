import React from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function EmptyState({ 
  icon: Icon = Search, 
  title, 
  description, 
  actionLabel, 
  onAction,
  searchQuery,
  searchItemName = "items"
}) {
  if (searchQuery !== undefined && searchQuery.trim() !== '') {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground py-16 text-center">
        <Search className="h-8 w-8 text-muted-foreground/50 mx-auto" />
        <p className="font-medium">No {searchItemName} found matching "{searchQuery}".</p>
        {onAction && (
          <Button variant="outline" size="sm" onClick={onAction}>
            Clear Search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground py-16 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2 opacity-50" />}
      <h3 className="text-lg font-medium text-foreground">{title || `No ${searchItemName} found`}</h3>
      {description && <p className="text-sm mt-1">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
