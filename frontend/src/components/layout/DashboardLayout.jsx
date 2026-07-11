import React, { Suspense } from "react";
import MainLogo from "@/assets/logos/MainLogo";
import TextLogo from "@/assets/logos/TextLogo";
import { NavLink } from "@/components/shared/NavLink";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  UtensilsCrossed,
  ChefHat,
  Trash2,
  DollarSign,
  Lightbulb,
  Settings,
  Leaf,
  Users,
  Package,
  MessageSquare,
  FileText,
  LogOut,
  PlusCircle,
  Bell,
  User,
  CreditCard,
  Shield,
  Building2,
  Activity,
  UserCog,
  CalendarDays,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/useSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const managerHomeItems = [
  { title: "Overview", url: "/dashboard/overview", icon: LayoutDashboard },
  { title: "AI Insights", url: "/dashboard/insights", icon: Lightbulb },
];

const managerFinanceItems = [
  { title: "Revenue", url: "/dashboard/finance/revenue", icon: DollarSign },
  { title: "Sales Forecast", url: "/dashboard/finance/forecast", icon: Brain },
  { title: "Reports", url: "/dashboard/finance/reports", icon: FileText },
];

const managerMenuItems = [
  { title: "Management", url: "/dashboard/menu/management", icon: ChefHat },
  { title: "Analytics", url: "/dashboard/menu/analytics", icon: UtensilsCrossed },
];

const managerInventoryItems = [
  { title: "Current Stock", url: "/dashboard/inventory/stock", icon: Package },
  { title: "Alerts", url: "/dashboard/inventory/alerts", icon: Bell },
  { title: "Forecast", url: "/dashboard/inventory/forecast", icon: AlertTriangle },
];

const managerTeamItems = [
  { title: "Staff", url: "/dashboard/team/staff", icon: Users },
  { title: "Schedule", url: "/dashboard/team/schedule", icon: CalendarDays },
];

const managerSystemItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/dashboard", icon: Shield },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();

  const renderGroup = (label, items) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-3">
        {t(label)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.subItems) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={t(item.title)}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t(item.title)}</span>}
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 group-data-[state=open]/collapsible:rtl:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={subItem.url}
                                end={subItem.url === "/dashboard/inventory/stock"}
                                className="flex items-center w-full px-2 py-1.5 transition-colors text-muted-foreground hover:text-foreground"
                                activeClassName="bg-primary/10 text-primary font-medium rounded-md"
                              >
                                <span>{t(subItem.title)}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard/overview"}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                    activeClassName="bg-primary/10 text-primary font-medium"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{t(item.title)}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      side={language === "ar" ? "right" : "left"}
      collapsible="icon"
      className={
        language === "ar"
          ? "border-l border-border/60"
          : "border-r border-border/60"
      }
    >
      <SidebarContent>
        <div className={`pt-4 ${collapsed ? "px-2" : "px-4"}`}>
          <Link to="/dashboard">
            <motion.div layoutId="app-logo-transition" className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <MainLogo className="h-full w-full text-primary" />
              </div>
              {!collapsed && <TextLogo className="h-5 w-auto text-foreground" />}
            </motion.div>
          </Link>
        </div>
        <Separator className="mx-3 w-auto" />
        {isAdmin ? (
          <>{renderGroup("Platform", adminItems)}</>
        ) : (
          <>
            {renderGroup("HOME", managerHomeItems)}
            <Separator className="mx-3 w-auto" />
            {renderGroup("FINANCE & REPORTS", managerFinanceItems)}
            <Separator className="mx-3 w-auto" />
            {renderGroup("MENU", managerMenuItems)}
            <Separator className="mx-3 w-auto" />
            {renderGroup("INVENTORY", managerInventoryItems)}
            <Separator className="mx-3 w-auto" />
            {renderGroup("TEAM", managerTeamItems)}
            <Separator className="mx-3 w-auto" />
            {renderGroup("SYSTEM", managerSystemItems)}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const initials = user?.email?.slice(0, 2).toUpperCase() || "??";
  
  const { data: settingsData } = useSettings(user?.restId);
  const avatarUrl = settingsData?.profile?.imageUrl || user?.photoUrl || user?.imageUrl;

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b border-border/60 px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            {isAdmin && (
              <Badge
                variant="outline"
                className="border-primary/30 text-primary text-[10px] font-semibold"
              >
                ADMIN
              </Badge>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="h-8 w-8 rounded-full bg-secondary/80 flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors hover:bg-secondary"
              >
                {language === "en" ? "AR" : "EN"}
              </button>
              <NotificationsDropdown />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-8 w-8 border border-border/50 hover:opacity-80 transition-opacity">
                      <AvatarImage src={avatarUrl} alt="User avatar" className="object-cover" />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {user?.email || "Guest"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role || "manager"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="cursor-pointer"
                  >
                    <User className="me-2 h-4 w-4" />
                    {t("Profile")}
                  </DropdownMenuItem> */}
                  {!isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard/settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="me-2 h-4 w-4" />
                      {t("Settings")}
                    </DropdownMenuItem>
                  )}
                  {/* Platform Settings removed for simplicity */}
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/billing")}
                    className="cursor-pointer"
                  >
                    <CreditCard className="me-2 h-4 w-4" />
                    {t("Billing")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="me-2 h-4 w-4" />
                    {t("Log out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <motion.main
            id="main-scroll-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 px-4 md:px-5 overflow-auto relative"
          >
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}
