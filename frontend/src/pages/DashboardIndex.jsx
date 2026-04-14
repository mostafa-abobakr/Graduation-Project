import { useAuth } from "@/contexts/AuthContext";
import ManagerDashboard from "./manager";
import AdminDashboard from "./admin";

export default function DashboardIndex() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <ManagerDashboard />;
}
