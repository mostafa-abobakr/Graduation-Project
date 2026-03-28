import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

const API_BASE = "http://resturantai.runasp.net/api/Auth";

const AuthContext = createContext(null);


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // You can adjust isAdmin logic based on backend response, e.g. user.role
  const isAdmin = user?.role?.toLowerCase() === "admin";

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
      toast({ title: "Account created!", description: "Please log in with your credentials." });
    } catch (e) {
      const errorMsg = e.response?.data || e.response?.request?.responseText || "Registration failed";
      toast({ title: "Registration failed", description: errorMsg, variant: "destructive" });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
