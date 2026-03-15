import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ForecastPage from "./pages/ForecastPage";
import MenuAnalyticsPage from "./pages/MenuAnalyticsPage";
import WasteAnalyticsPage from "./pages/WasteAnalyticsPage";
import RevenuePage from "./pages/RevenuePage";
import AIInsightsPage from "./pages/AIInsightsPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import SettingsPage from "./pages/SettingsPage";
import StaffPage from "./pages/StaffPage";
import InventoryPage from "./pages/InventoryPage";
import FeedbackPage from "./pages/FeedbackPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import BillingPage from "./pages/BillingPage";
import RestaurantsPage from "./pages/admin/RestaurantsPage";
import UsersPage from "./pages/admin/UsersPage";
import PlatformAnalyticsPage from "./pages/admin/PlatformAnalyticsPage";
import PlatformSettingsPage from "./pages/admin/PlatformSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="menu-analytics" element={<MenuAnalyticsPage />} />
              <Route path="waste" element={<WasteAnalyticsPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="insights" element={<AIInsightsPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="restaurants" element={<RestaurantsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="platform-analytics" element={<PlatformAnalyticsPage />} />
              <Route path="platform-settings" element={<PlatformSettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
