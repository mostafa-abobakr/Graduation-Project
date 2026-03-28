import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useRegisterContext } from "@/contexts/Valdation";

const Register = () => {
  const { formData } = useRegisterContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Guard: redirect to the correct step based on filled data
  useEffect(() => {
    const hasPersonal = formData.fullName && formData.email && formData.userPhone && formData.password;
    const hasRestaurant = formData.restaurantName && formData.address && formData.city && formData.restaurantPhone;

    const currentPath = location.pathname;

    // If on restaurant step but personal info is missing → go back
    if (currentPath === "/register/restaurant" && !hasPersonal) {
      navigate("/register", { replace: true });
    }
    // If on connect-pos step but restaurant info is missing → go back
    if (currentPath === "/register/connect-pos" && (!hasPersonal || !hasRestaurant)) {
      navigate(hasPersonal ? "/register/restaurant" : "/register", { replace: true });
    }
  }, [formData, location.pathname, navigate]);

  return <Outlet />;
};

export default Register;
