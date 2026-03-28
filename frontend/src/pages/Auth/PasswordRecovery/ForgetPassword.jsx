import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import img from "@/assets/Auth/Forgotpassword-rafiki.png";
import AuthContainer from "@/components/AuthContainer";
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";

const ForgetPassword = () => {
  const navigate = useNavigate();
  
  const onSubmit = (e) => {
    e.preventDefault();
    navigate("/email-sent"); // Assuming /email-sent exists, or update as needed
  };

  return (
    <AuthContainer img={img}>
      <AuthForm header="Forget password" onSubmit={onSubmit}>
        <p className="text-muted-foreground mb-6 text-[15px] leading-relaxed">
          Please enter your email address below. You will receive a verification link.
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-foreground">Email Address</Label>
          <div className="relative">
            <span className="absolute left-3 top-[0.6rem] text-primary font-bold z-10">
              @
            </span>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com"
              className="pl-8 bg-muted/20 border-border/80 h-[3rem]" 
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-8 h-12 text-[1rem] shadow-md hover:shadow-lg transition-all"
        >
          Continue
        </Button>
      </AuthForm>
    </AuthContainer>
  );
};

export default ForgetPassword;
