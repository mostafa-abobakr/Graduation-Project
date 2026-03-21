import { NavLink } from "@/components/NavLink";
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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BarChart3,
  Brain,
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
  User,
  CreditCard,
  Shield,
  Building2,
  Activity,
  UserCog,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useAuth } from "@/contexts/AuthContext";
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

const managerAnalyticsItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Forecast", url: "/dashboard/forecast", icon: Brain },
  { title: "Menu Analytics", url: "/dashboard/menu-analytics", icon: ChefHat },
  { title: "Waste Analytics", url: "/dashboard/waste", icon: Trash2 },
  { title: "Revenue", url: "/dashboard/revenue", icon: DollarSign },
  { title: "AI Insights", url: "/dashboard/insights", icon: Lightbulb },
];

const managerManagementItems = [
  { title: "Menu Management", url: "/dashboard/menu", icon: BarChart3 },
  { title: "Staff", url: "/dashboard/staff", icon: Users },
  { title: "Inventory", url: "/dashboard/inventory", icon: Package },
];

const managerOtherItems = [
  { title: "Feedback", url: "/dashboard/feedback", icon: MessageSquare },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const adminOverviewItems = [
  { title: "Platform Overview", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Platform Analytics",
    url: "/dashboard/platform-analytics",
    icon: Activity,
  },
];

const adminManagementItems = [
  { title: "Restaurants", url: "/dashboard/restaurants", icon: Building2 },
  { title: "Users & Managers", url: "/dashboard/users", icon: UserCog },
];

const adminOtherItems = [
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  {
    title: "Platform Settings",
    url: "/dashboard/platform-settings",
    icon: Settings,
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useAuth();
  
  const renderGroup = (label, items) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarContent>
        <div className={`p-4 ${collapsed ? "px-2" : "px-4"}`}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <span
                className="text-base font-bold text-foreground tracking-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                zeroBite
              </span>
            )}
          </Link>
          {!collapsed && isAdmin && (
            <div className="mt-2 flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Admin Mode
              </span>
            </div>
          )}
        </div>
        <Separator className="mx-3 w-auto" />
        {isAdmin ? (
          <>
            {renderGroup("Overview", adminOverviewItems)}
            {renderGroup("Management", adminManagementItems)}
            {renderGroup("System", adminOtherItems)}
          </>
        ) : (
          <>
            {renderGroup("Analytics", managerAnalyticsItems)}
            {renderGroup("Management", managerManagementItems)}
            {renderGroup("Other", managerOtherItems)}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
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
              <NotificationsDropdown />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold cursor-pointer ring-offset-background transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {initials}
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
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {!isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard/settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard/platform-settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Platform Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/billing")}
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
