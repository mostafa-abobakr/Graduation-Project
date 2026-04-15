import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
// import AuthPage from "../pages/AuthPage";
import DashboardLayout from "../components/layout/DashboardLayout";
import { lazy } from "react";

const DashboardIndex = lazy(() => import("../pages/DashboardIndex"));
const ForecastPage = lazy(() => import("../pages/ForecastPage"));
const MenuAnalyticsPage = lazy(() => import("../pages/MenuAnalyticsPage"));
const RevenuePage = lazy(() => import("../pages/RevenuePage"));
const AIInsightsPage = lazy(() => import("../pages/AIInsightsPage"));
const MenuManagementPage = lazy(() => import("../pages/MenuManagementPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const StaffPage = lazy(() => import("../pages/StaffPage"));
const InventoryPage = lazy(() => import("../pages/InventoryPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const BillingPage = lazy(() => import("../pages/BillingPage"));
import NotFound from "../pages/NotFound";
import { ROUTES } from "./ROUTES";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import RegisterPersonal from "@/pages/Auth/Register/RegisterPersonal";
import RegisterRestaurant from "@/pages/Auth/Register/RegisterRestaurant";
import PosOptions from "@/pages/pos/ConnectPosPage";
import SchedulePage from "@/pages/SchedulePage";


const requireAuth = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    throw redirect(ROUTES.LOGIN);
  }
  return null;
};

const Routes = [
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
    children: [
      {
        index: true,
        element: <RegisterPersonal />,
      },
      {
        path: "restaurant",
        element: <RegisterRestaurant />,
      },
      {
        path: "connect-pos",
        element: <PosOptions />,
      },
    ],
  },
  // {
  //   path:ROUTES.AUTHORIZE_POS,
  //   element: <SquareAuthPage/>,
  // },
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardLayout />,
    loader: requireAuth,
    children: [
      {
        index: true,
        element: <DashboardIndex />,
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
        path: ROUTES.SCHEDULE,
        element: <SchedulePage />,
      },
      {
        path: ROUTES.INVENTORY,
        element: <InventoryPage />,
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
