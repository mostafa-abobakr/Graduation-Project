import { useState } from "react";
import {
  Bell,
  Trash2,
  Package,
  AlertTriangle,
  TrendingDown,
  Clock,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Utensils, CalendarDays } from "lucide-react";

const iconMap = { waste: Trash2, inventory: Package, alert: AlertTriangle, menu: Utensils, schedule: CalendarDays };
const priorityStyles = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
};
const dotStyles = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-primary",
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const restId = user?.restId;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data: fetchedNotifications = [] } = useQuery({
    queryKey: ["notifications", restId],
    queryFn: async () => {
      const res = await fetch(`https://resturantai.runasp.net/api/Notifications/${restId}`);
      if (!res.ok) return [];
      const data = await res.json();
      
      const combined = [
        ...(data.inventory || []),
        ...(data.menu || []),
        ...(data.schedule || [])
      ];
      
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return combined.map((n, i) => {
        const type = n.category.toLowerCase();
        const severity = n.severity.toLowerCase();
        let priority = "info";
        if (severity === "high") priority = "critical";
        else if (severity === "medium") priority = "warning";
        
        return {
          id: `${n.category}-${n.referenceID || i}-${i}`,
          type,
          category: n.category,
          referenceID: n.referenceID,
          title: n.title,
          description: n.message,
          time: new Date(n.createdAt),
          priority,
          inventoryID: n.inventoryID,
          batchID: n.batchID,
          referenceDate: n.referenceDate,
        };
      });
    },
    refetchInterval: 60000,
  });

  const notifications = fetchedNotifications
    .filter(n => filterCategory === "all" || n.category.toLowerCase() === filterCategory.toLowerCase())
    .filter(n => filterSeverity === "all" || n.priority === filterSeverity)
    .sort((a, b) => sortOrder === "desc" ? b.time.getTime() - a.time.getTime() : a.time.getTime() - b.time.getTime());

  const unreadCount = notifications.length;

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFilterCategory("all");
      setFilterSeverity("all");
      setSortOrder("desc");
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.category === "Inventory" && notification.inventoryID) {
      const state = {};
      if (notification.batchID) {
        state.highlightBatchId = notification.batchID;
      }
      navigate(`/dashboard/inventory/${notification.inventoryID}`, { state });
      setOpen(false);
    } else if (notification.category === "Menu") {
      const state = {};
      if (notification.referenceID) {
        state.highlightMenuItemId = notification.referenceID;
      }
      navigate(`/dashboard/menu/management`, { state });
      setOpen(false);
    } else if (notification.category === "Schedule") {
      const state = {};
      if (notification.referenceDate) {
        state.targetDate = notification.referenceDate;
      }
      navigate(`/dashboard/team/schedule`, { state });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg relative"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none min-w-[18px] min-h-[18px]">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 bg-card border-border/60 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-destructive/10 text-destructive border-0 text-[10px] px-1.5 py-0"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        <div className="px-4 py-2 flex flex-col gap-2 border-b border-border/60 bg-muted/10">
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border/60 flex-1">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="menu">Menu</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border/60 flex-1">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">High</SelectItem>
                <SelectItem value="warning">Medium</SelectItem>
                <SelectItem value="info">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-8 text-xs bg-background/50 border-border/60 w-full">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-[420px] overflow-y-auto overflow-x-hidden scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className="group flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/30 bg-primary/[0.02]"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${priorityStyles[notification.priority]}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[notification.priority]}`}
                          />
                          <p
                            className="text-sm truncate font-semibold text-foreground"
                          >
                            {notification.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground/60">
                          {formatDistanceToNow(notification.time, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
