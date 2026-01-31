import styles from "./MainLayout.module.css";
import Navbar from "@/layouts/Navbar/Navbar";
import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
function MainLayout() {
  return (
    <div className={styles.layout}>
      <Navbar />
      {/* <div className={styles.content}> */}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      {/* </div> */}
    </div>
  );
}

export default MainLayout;
