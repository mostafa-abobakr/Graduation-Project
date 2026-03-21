import React, { useState, useEffect } from "react";
import img from "@/assets/Auth/Authentication.png";
import AuthContainer from "./AuthContainer";
import AuthForm from "./AuthForm";
import { Button } from "@/components/ui/button";
import OtpInput from "@/components/common/OtpInput";
import { useNavigate, useLocation } from "react-router-dom";

const EmailVerification = () => {
  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(5);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email ?? "your email";

  const handleOtpComplete = (code) => {
    setOtp(code);
  };

  useEffect(() => {
    if (counter <= 0) return;
    const timer = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    try {
      navigate("/login/reset-password");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async (e) => {
    e.preventDefault();
    if (counter > 0) return;
    setIsResending(true);
    try {
      setCounter(5);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthContainer img={img}>
      <AuthForm header="Verify Your Email">
        <p className="text-muted-foreground mb-4">
          We've sent a 6-digit verification code to your email
          <br />
          <span className="text-foreground font-semibold block mt-1">{email}</span>
        </p>
        <div className="mb-6 text-sm">
          <span>
            {counter > 0
              ? `Didn't receive the code? Resend in ${counter}s`
              : "Didn't receive the code?"}
          </span>
        </div>

        <OtpInput length={6} onComplete={handleOtpComplete} />
        
        <div className="space-y-4 mt-8">
          <Button
            type="button" 
            className="w-full font-medium h-12 text-md shadow-md"
            disabled={otp.length !== 6 || isVerifying}
            onClick={handleVerify} 
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full font-medium h-12 text-md"
            disabled={counter > 0 || isResending}
            onClick={handleResendClick}
          >
            {isResending
              ? "Sending..."
              : counter > 0
                ? `Resend in ${counter}s`
                : "Resend code"}
          </Button>
        </div>
      </AuthForm>
    </AuthContainer>
  );
};

export default EmailVerification;
