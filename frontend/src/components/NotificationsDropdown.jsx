import { useState } from "react";
import { Bell, Trash2, Package, AlertTriangle, TrendingDown, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const initialNotifications = [
  { id: 1, type: "inventory", title: "Critical: Olive Oil Low", description: "Olive Oil stock at 5L — below reorder level of 8L. Place order immediately.", time: "2 min ago", read: false, priority: "critical" },
  { id: 2, type: "waste", title: "Waste Threshold Exceeded", description: "Pizza Margherita waste reached 12.4% today, exceeding the 10% threshold.", time: "15 min ago", read: false, priority: "critical" },
  { id: 3, type: "inventory", title: "Low Stock: Pizza Dough", description: "Pizza Dough at 12kg — approaching reorder level of 15kg.", time: "32 min ago", read: false, priority: "warning" },
  { id: 4, type: "waste", title: "Lettuce Waste Spike", description: "Caesar Salad lettuce waste up 28% compared to last week average.", time: "1 hr ago", read: false, priority: "warning" },
  { id: 5, type: "inventory", title: "Low Stock: Lettuce", description: "Lettuce stock at 8kg — near reorder level of 10kg.", time: "1 hr ago", read: true, priority: "warning" },
  { id: 6, type: "alert", title: "AI Prediction Update", description: "Weekend demand forecast updated: expect 35% more Chicken Burger orders.", time: "2 hr ago", read: true, priority: "info" },
  { id: 7, type: "waste", title: "Waste Goal Achieved", description: "Overall waste reduction hit 23% this month — exceeding 20% target!", time: "3 hr ago", read: true, priority: "info" },
  { id: 8, type: "inventory", title: "Order Delivered", description: "Salmon Fillet order of 20kg has been delivered and stocked.", time: "4 hr ago", read: true, priority: "info" },
];

const iconMap = { waste: Trash2, inventory: Package, alert: AlertTriangle };
const priorityStyles = { critical: "bg-destructive/10 text-destructive", warning: "bg-warning/10 text-warning", info: "bg-primary/10 text-primary" };
const dotStyles = { critical: "bg-destructive", warning: "bg-warning", info: "bg-primary" };

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismissNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none min-w-[18px] min-h-[18px]">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 bg-card border-border/60 shadow-xl" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0 text-[10px] px-1.5 py-0">{unreadCount} new</Badge>}
          </div>
          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">Mark all read</button>}
        </div>
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type];
                return (
                  <div key={notification.id} className={`group flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/30 ${!notification.read ? "bg-primary/[0.02]" : ""}`} onClick={() => markAsRead(notification.id)}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${priorityStyles[notification.priority]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {!notification.read && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[notification.priority]}`} />}
                          <p className={`text-sm truncate ${!notification.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>{notification.title}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notification.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground/60">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <button className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium py-2 rounded-md hover:bg-muted/30 transition-colors">View all notifications</button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
