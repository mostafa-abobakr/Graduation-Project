import React, { useState } from "react";
import img from "@/assets/Auth/Authentication.png";
import AuthContainer from "@/components/AuthContainer";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PasswordChanged = () => {
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <AuthContainer img={img}>
      <AuthForm header="Password Changed" onSubmit={handleSubmit}>
        <div className="mb-6 space-y-2 text-muted-foreground">
          <p className="text-[15px] leading-relaxed">
            Your password has been changed successfully.
          </p>
          <p className="text-[15px] leading-relaxed">
            You can now log in using your new password.
          </p>
        </div>
       
        <Button
          type="submit"
          className="w-full mt-4 h-12 text-[1rem] shadow-md hover:shadow-lg transition-all" 
        >
          {isResending ? "Sending..." : "Back To Login"}
        </Button>
      </AuthForm>
    </AuthContainer>
  );
};

export default PasswordChanged;
