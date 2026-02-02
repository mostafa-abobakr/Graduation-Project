import DashboardSkeleton from "@/components/common/Skeleton/Dashboard/index";
import MainLayout from "@/layouts/MainLayout";
import { useEffect, useState } from "react";
function Root() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setLoading(false); console.log(loading); }, 2000);
    return () => clearTimeout(timer);
    // Cleanup function to prevent memory leaks
  }, []);

  return <div>{loading ? <DashboardSkeleton /> : <MainLayout />}</div>;
}

export default Root;
