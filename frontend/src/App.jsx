import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Root from "./routes/root";
import Home from "./pages/Home/index";
import About from "./pages/About/index";
import Orders from "./pages/Orders/index";
import Products from "./pages/Products/index";
import Dashboard from "./pages/Dashboard/index";
import Analytics from "./pages/Analytics/index";
import Customers from "./pages/Customers/index";
import Settings from "./pages/Settings/index";
import Notification from "./pages/Notification/index";
import Toast from "./utils/Toast";
import { ToastProvider } from "@/context/ToastContext";
import { ROUTES } from "./routes"; // Import from routes
import "./styles/global/reset.css";
import "./styles/global/base.css";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: ROUTES.ABOUT, element: <About /> },
      { path: ROUTES.ORDERS, element: <Orders /> },
      { path: ROUTES.PRODUCTS, element: <Products /> },
      { path: ROUTES.DASHBOARD, element: <Dashboard /> },
      { path: ROUTES.ANALYTICS, element: <Analytics /> },
      { path: ROUTES.CUSTOMERS, element: <Customers /> },
      { path: ROUTES.SETTINGS, element: <Settings /> },
      { path: ROUTES.NOTIFICATION, element: <Notification /> },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Toast />
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
