import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const API_BASE = "http://resturantai.runasp.net/api/Auth";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const role = email.toLowerCase() === "admin@restaurant.com" ? "admin" : "manager";
      const userData = { email, token: "static-token", role };
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      toast({ title: "Welcome back!", description: `Logged in as ${email} (${role})` });
    } catch (e) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Registration failed");
      }
      toast({ title: "Account created!", description: "Please log in with your credentials." });
    } catch (e) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
