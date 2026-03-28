import React from "react";
import img from "@/assets/Auth/ResetPassword.png";
import AuthContainer from "@/components/AuthContainer";
import AuthForm from "@/components/AuthForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  
  const handleReset = (e) => {
    e.preventDefault();
    navigate("/password-changed");
  };

  return (
    <AuthContainer img={img}>
      <AuthForm header="Reset password" onSubmit={handleReset}>
        <div className="space-y-5 w-full">
          <div className="space-y-2 relative">
            <Label htmlFor="new-password" className="font-semibold text-foreground">New Password</Label>
            <div className="relative">
              <svg className="absolute left-3 top-[0.6rem] w-[1.1rem] h-[1.1rem] text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="pl-[2.2rem] bg-muted/20 border-border/80 h-[3rem]"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2 relative">
            <Label htmlFor="confirm-password" className="font-semibold text-foreground">Confirm Password</Label>
            <div className="relative">
              <svg className="absolute left-3 top-[0.6rem] w-[1.1rem] h-[1.1rem] text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="pl-[2.2rem] bg-muted/20 border-border/80 h-[3rem]"
                required
              />
            </div>
          </div>
        
          <Button
            type="submit"
            className="w-full mt-6 h-12 text-[1rem] shadow-md hover:shadow-lg transition-all"
          >
            Change Password
          </Button>
        </div>
      </AuthForm>
    </AuthContainer>
  );
};

export default ResetPassword;
