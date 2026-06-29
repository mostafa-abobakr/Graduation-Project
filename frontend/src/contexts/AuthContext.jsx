import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { queryClient } from "@/lib/queryClient";

const API_BASE = "/api/Auth";

const AuthContext = createContext(null);


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      const token = localStorage.getItem("authToken") || parsedUser.token;
      if (token) {
        try {
          const decoded = jwtDecode(token);
          parsedUser.restId = parseInt(decoded.RestID || decoded.restId || decoded.restID || "0", 10);
          parsedUser.token = token;
          parsedUser.exp = decoded.exp;
        } catch (e) {
          console.error("Failed to decode token on load:", e);
        }
      }
      return parsedUser;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // You can adjust isAdmin logic based on backend response, e.g. user.role
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    queryClient.clear()
  };

  useEffect(() => {
    let timeoutId;

    if (user && user.token && user.exp) {
      const expirationTime = user.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration > 0) {
        // Set timeout to logout when the time comes
        timeoutId = setTimeout(() => {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          logout();
        }, timeUntilExpiration);
      } else {
        // It's already expired, logout immediately
        toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
        logout();
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios({
        method: "post",
        url: `${API_BASE}/login`,
        headers: { "Content-Type": "application/json" },
        data: { email, password },
      });

      if (response.data && response.data.token) {

        const role = response.data.role;
        const userData = { ...response.data, email, role };

        try {
          const decoded = jwtDecode(response.data.token);
          userData.restId = parseInt(decoded.RestID || decoded.restId || decoded.restID || "0", 10);
          userData.exp = decoded.exp;
        } catch (e) {
          console.error("Failed to decode token on login:", e);
        }

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authToken", response.data.token);
        toast({ title: "Welcome back!", description: `Logged in successfully` });
        return true;
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Login failed.";
      toast({ title: "Login failed", description: errorMsg, variant: "destructive" });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const res = await axios({
        method: "post",
        url: `${API_BASE}/register`,
        headers: { "Content-Type": "application/json" },
        data: data,
      });
      toast({ title: "Account created!", description: "you can  log in with your credentials." });
    } catch (e) {
      const errorData = e.response?.data;
      const errorMsg = errorData?.message || (typeof errorData === 'string' ? errorData : "Registration failed");
      toast({ title: "Registration failed", description: errorMsg, variant: "destructive" });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    const handleUnauthorized = () => {
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      logout();
    };
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
