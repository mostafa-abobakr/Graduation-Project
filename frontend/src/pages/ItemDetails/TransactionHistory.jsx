import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, AlertCircle, TrendingUp, CalendarDays, TrendingDown, Clock, ChevronUp, ChevronDown } from "lucide-react";
export function TransactionHistory({ transactionsLoading, transactionsError, timelineEvents, unit }) {
  return (
    <Card className="border-border/50 shadow-sm bg-card h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" strokeWidth={2.5} />
          Transaction History
        </CardTitle>
        <CardDescription>
          Log of all additions and daily consumptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            Loading history...
          </div>
        ) : transactionsError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-destructive/5 rounded-lg border border-dashed border-destructive/20">
            <AlertCircle className="h-8 w-8 text-destructive mb-3 opacity-70" />
            <p className="font-medium text-foreground">
              Could not load transactions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEvents && timelineEvents.length > 0 ? (
              timelineEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== timelineEvents.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-16px] w-px bg-border/50" />
                  )}
                  
                  {event.type === "add" ? (
                    <div className="flex gap-4 p-2 w-full">
                      <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-primary/10 text-primary z-10">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              Restock
                              {event.data.batchId && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 text-primary border-primary/20">
                                  Batch #{event.data.batchId}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(event.dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-medium text-primary">
                              +{event.data.quantity} {unit}
                            </div>
                            {(event.data.price > 0) && (
                              <div className="text-xs text-muted-foreground mt-1 font-mono">
                                ${event.data.price.toFixed(2)} / unit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ConsumeGroupRow event={event} itemUnit={unit} />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg bg-muted/10">
                No history recorded for this item.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConsumeGroupRow({ event, itemUnit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 relative group w-full">
      <div 
        className="flex gap-4 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-muted/50 text-muted-foreground z-10">
          <TrendingDown className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                Daily Consumption
              </p>
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(event.dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono font-medium text-rose-400">
                -{event.totalQuantity} {itemUnit}
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="ml-12 pl-4 border-l-2 border-border/50 space-y-3 pb-2 pt-1 animate-fade-in">
          {event.deductions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(d => (
            <div key={d.transactionId} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(d.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/20 ml-2">
                  Batch #{d.batchId}
                </Badge>
              </div>
              <div className="font-mono text-xs text-rose-400/80 mr-11">
                -{d.quantity} {itemUnit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
