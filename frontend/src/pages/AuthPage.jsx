import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) { await login(email, password); navigate("/dashboard"); }
      else { await register({ fullName, email, userPhone, password, restaurantName, address, city, restaurantPhone }); navigate("/login"); }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Leaf className="h-4.5 w-4.5 text-primary" /></div>
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>ZeroWaste</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isLogin ? "Log in to your dashboard" : "Start your 14-day free trial"}</p>
        </div>
        <Card className="p-7 bg-card border-border/60 premium-shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div><Label htmlFor="fullName" className="text-foreground text-sm">Full Name</Label><Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
                <div><Label htmlFor="userPhone" className="text-foreground text-sm">Phone</Label><Input id="userPhone" placeholder="+1 234 567 890" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
                <div><Label htmlFor="restaurantName" className="text-foreground text-sm">Restaurant Name</Label><Input id="restaurantName" placeholder="My Restaurant" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="city" className="text-foreground text-sm">City</Label><Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
                  <div><Label htmlFor="restaurantPhone" className="text-foreground text-sm">Restaurant Phone</Label><Input id="restaurantPhone" placeholder="+1 234 567" value={restaurantPhone} onChange={(e) => setRestaurantPhone(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
                </div>
                <div><Label htmlFor="address" className="text-foreground text-sm">Address</Label><Input id="address" placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
              </>
            )}
            <div><Label htmlFor="email" className="text-foreground text-sm">Email</Label><Input id="email" type="email" placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
            <div><Label htmlFor="password" className="text-foreground text-sm">Password</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-muted/30 border-border/60" required /></div>
            <Button type="submit" className="w-full h-10" disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isLogin ? "Log In" : "Create Account"}</Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">{isLogin ? "Don't have an account? " : "Already have an account? "}<Link to={isLogin ? "/signup" : "/login"} className="text-primary hover:underline font-medium">{isLogin ? "Sign up" : "Log in"}</Link></p>
      </div>
    </div>
  );
}
