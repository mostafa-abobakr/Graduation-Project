import React from 'react';

export function PageHeader({ icon: Icon, title, description, actions, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
             <h1 className="text-2xl font-bold text-foreground">{title}</h1>
             {children}
          </div>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </div>
      {actions && (
          <div className="flex items-center gap-2 shrink-0">
              {actions}
          </div>
      )}
    </div>
  );
}
