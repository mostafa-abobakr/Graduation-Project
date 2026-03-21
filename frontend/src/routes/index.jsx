import React from "react";
import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
// import AuthPage from "../pages/AuthPage";
import DashboardLayout from "../components/DashboardLayout";
import DashboardPage from "../pages/DashboardPage";
import ForecastPage from "../pages/ForecastPage";
import MenuAnalyticsPage from "../pages/MenuAnalyticsPage";
import WasteAnalyticsPage from "../pages/WasteAnalyticsPage";
import RevenuePage from "../pages/RevenuePage";
import AIInsightsPage from "../pages/AIInsightsPage";
import MenuManagementPage from "../pages/MenuManagementPage";
import SettingsPage from "../pages/SettingsPage";
import StaffPage from "../pages/StaffPage";
import InventoryPage from "../pages/InventoryPage";
import FeedbackPage from "../pages/FeedbackPage";
import ReportsPage from "../pages/ReportsPage";
import ProfilePage from "../pages/ProfilePage";
import BillingPage from "../pages/BillingPage";
import RestaurantsPage from "../pages/admin/RestaurantsPage";
import UsersPage from "../pages/admin/UsersPage";
import PlatformAnalyticsPage from "../pages/admin/PlatformAnalyticsPage";
import PlatformSettingsPage from "../pages/admin/PlatformSettingsPage";
import NotFound from "../pages/NotFound";
import { ROUTES } from "./ROUTES";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";

const Routes = [
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login/>,
  },
  {
    path: ROUTES.SIGNUP,
    element: <Register/>,
  },
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.FORECAST,
        element: <ForecastPage />,
      },
      {
        path: ROUTES.MENU_ANALYTICS,
        element: <MenuAnalyticsPage />,
      },
      {
        path: ROUTES.WASTE,
        element: <WasteAnalyticsPage />,
      },
      {
        path: ROUTES.REVENUE,
        element: <RevenuePage />,
      },
      {
        path: ROUTES.INSIGHTS,
        element: <AIInsightsPage />,
      },
      {
        path: ROUTES.MENU,
        element: <MenuManagementPage />,
      },
      {
        path: ROUTES.STAFF,
        element: <StaffPage />,
      },
      {
        path: ROUTES.INVENTORY,
        element: <InventoryPage />,
      },
      {
        path: ROUTES.FEEDBACK,
        element: <FeedbackPage />,
      },
      {
        path: ROUTES.REPORTS,
        element: <ReportsPage />,
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
      {
        path: ROUTES.RESTAURANTS,
        element: <RestaurantsPage />,
      },
      {
        path: ROUTES.USERS,
        element: <UsersPage />,
      },
      {
        path: ROUTES.PLATFORM_ANALYTICS,
        element: <PlatformAnalyticsPage />,
      },
      {
        path: ROUTES.PLATFORM_SETTINGS,
        element: <PlatformSettingsPage />,
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.BILLING,
        element: <BillingPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

const router = createBrowserRouter(Routes);

export default router;
