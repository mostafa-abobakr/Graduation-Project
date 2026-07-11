import React from "react";
import { createBrowserRouter, redirect, Outlet, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "./ROUTES";

// Fallback loader to show while chunk is downloading
const Loadable = (Component) => (props) => (
  <Suspense fallback={
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  }>
    <Component {...props} />
  </Suspense>
);

const DashboardLayout = Loadable(lazy(() => import("../components/layout/DashboardLayout")));
const LandingPage = Loadable(lazy(() => import("../pages/LandingPage")));
const NotFound = Loadable(lazy(() => import("../pages/NotFound")));
const Login = Loadable(lazy(() => import("@/pages/Auth/Login")));
const ForgetPassword = Loadable(lazy(() => import("@/pages/Auth/PasswordRecovery/ForgetPassword")));
const Register = Loadable(lazy(() => import("@/pages/Auth/Register")));
const RegisterPage = Loadable(lazy(() => import("@/pages/Auth/Register/RegisterPage")));
const RegisterRestaurant = Loadable(lazy(() => import("@/pages/Auth/Register/RegisterRestaurant")));
const RestaurantLocation = Loadable(lazy(() => import("@/pages/Auth/Register/RestaurantLocation")));
const PosOptions = Loadable(lazy(() => import("@/pages/pos/ConnectPosPage")));
const BillingPlans = Loadable(lazy(() => import("@/pages/Auth/Register/BillingPlans")));
const PaymentGateway = Loadable(lazy(() => import("@/pages/Auth/Register/PaymentGateway")));

const DashboardIndex = Loadable(lazy(() => import("../pages/DashboardIndex")));
const ForecastPage = Loadable(lazy(() => import("../pages/forecast")));
const MenuAnalyticsPage = Loadable(lazy(() => import("../pages/MenuAnalyticsPage")));
const RevenuePage = Loadable(lazy(() => import("../pages/RevenuePage")));
const AIInsightsPage = Loadable(lazy(() => import("../pages/AIInsightsPage")));
const MenuManagementPage = Loadable(lazy(() => import("../pages/MenuManagementPage")));
const SettingsPage = Loadable(lazy(() => import("../pages/SettingsPage")));
const StaffPage = Loadable(lazy(() => import("../pages/StaffPage")));
const SchedulePage = Loadable(lazy(() => import("@/pages/Schedule")));
const ReportsPage = Loadable(lazy(() => import("../pages/Reports")));
const ProfilePage = Loadable(lazy(() => import("../pages/ProfilePage")));
const BillingPage = Loadable(lazy(() => import("../pages/BillingPage")));

const InventoryPage = Loadable(lazy(() => import("../pages/Inventory")));
const InventoryForecastPage = Loadable(lazy(() => import("../pages/InventoryForecastPage")));
const InventoryAlertsPage = Loadable(lazy(() => import("../pages/InventoryAlertsPage")));
const ItemDetailsPage = Loadable(lazy(() => import("../pages/ItemDetails")));
const AddStock = Loadable(lazy(() => import("../pages/draft/AddStock")));
const InventoryOverview = Loadable(lazy(() => import("@/pages/draft/InventoryOverview")));


const requireAuth = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    throw redirect(ROUTES.LOGIN);
  }
  return null;
};

const requireGuest = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    throw redirect(ROUTES.DASHBOARD);
  }
  return null;
};

const Routes = [
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
    loader: requireGuest,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
    loader: requireGuest,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgetPassword />,
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
        path: "restaurant-details",
        element: <RegisterRestaurant />,
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
      }
    ],
  },
  // {
  //   path:ROUTES.AUTHORIZE_POS,
  //   element: <SquareAuthPage/>,
  // },
  {
    path: ROUTES.DASHBOARD_ROOT,
    element: <DashboardLayout />,
    loader: requireAuth,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
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
      { 
        path: ROUTES.INVENTORY, 
        element: <InventoryPage /> 
      },
      { 
        path: "/dashboard/inventory/add-stock", 
        element: <AddStock /> 
      },
      { 
        path: "/dashboard/inventory/alerts", 
        element: <InventoryAlertsPage /> 
      },
      { 
        path: "/dashboard/inventory/forecast", 
        element: <InventoryForecastPage /> 
      },
      { 
        path: "/dashboard/inventory/draft", 
        element: <InventoryOverview /> 
      },
      { 
        path: "/dashboard/inventory/:id", 
        element: <ItemDetailsPage /> 
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
