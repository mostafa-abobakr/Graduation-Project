import React from "react";
import { createBrowserRouter, redirect, Outlet } from "react-router-dom";
import LandingPage from "../pages/LandingPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import { lazy } from "react";

const DashboardIndex = lazy(() => import("../pages/DashboardIndex"));
const ForecastPage = lazy(() => import("../pages/forecast"));
const MenuAnalyticsPage = lazy(() => import("../pages/MenuAnalyticsPage"));
const RevenuePage = lazy(() => import("../pages/RevenuePage"));
const AIInsightsPage = lazy(() => import("../pages/AIInsightsPage"));
const MenuManagementPage = lazy(() => import("../pages/MenuManagementPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const StaffPage = lazy(() => import("../pages/StaffPage"));
const InventoryPage = lazy(() => import("../pages/Inventory"));
const InventoryForecastPage = lazy(() => import("../pages/InventoryForecastPage"));
const InventoryAlertsPage = lazy(() => import("../pages/InventoryAlertsPage"));
const ItemDetailsPage = lazy(() => import("../pages/Inventory/ItemDetailsPage"));
const AddStock = lazy(() => import("../pages/draft/AddStock"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const BillingPage = lazy(() => import("../pages/BillingPage"));
import NotFound from "../pages/NotFound";
import { ROUTES } from "./ROUTES";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import RegisterPage from "@/pages/Auth/Register/RegisterPage";
import RestaurantLocation from "@/pages/Auth/Register/RestaurantLocation";
import PosOptions from "@/pages/pos/ConnectPosPage";
import SchedulePage from "@/pages/SchedulePage";
import BillingPlans from "@/pages/Auth/Register/BillingPlans";
import PaymentGateway from "@/pages/Auth/Register/PaymentGateway";
import InventoryOverview from "@/pages/draft/InventoryOverview";
import PaymentStripe from "@/pages/Auth/Register/PaymentStripe";


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
        element: <RegisterPage />,
      },
      {
        path: "restaurant-location",
        element: <RestaurantLocation />,
      },
      {
        path: "connect-pos",
        element: <PosOptions />,
      },
      {
        path: "plans",
        element: <BillingPlans />,
      },
      {
        path: "payment",
        element: <PaymentGateway />,
      },
      {
        path: "stripe",
        element: <PaymentStripe />,
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
    path: ROUTES.INVENTORY,
    element: <DashboardLayout />,
    loader: requireAuth,
    children: [
      { index: true, element: <InventoryPage /> },
      { path: "add-stock", element: <AddStock /> },
      { path: "alerts", element: <InventoryAlertsPage /> },
      { path: "forecast", element: <InventoryForecastPage /> },
      { path: ":id", element: <ItemDetailsPage /> },
      { path: "draft", element: <InventoryOverview /> },
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

const router = createBrowserRouter(Routes);

export default router;
