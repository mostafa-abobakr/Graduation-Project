import React, { useState, useEffect } from "react";
import img from "@/assets/Auth/Authentication.png";
import AuthLayout from "@/components/AuthLayout";
import AuthForm from "../AuthForm";
import styles from "./EmailVerification.module.css";
import Button from "@/components/common/Button";
import OtpInput from "@/components/common/OtpInput";

const EmailVerification = () => {
  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(5);
  const [isResending, setIsResending] = useState(false);

  const handleOtpComplete = (code) => {
    setOtp(code);
  };

  // Timer effect
  useEffect(() => {
    if (counter <= 0) return;

    const timer = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [counter]);

  const handleResendClick = async (e) => {
    e.preventDefault();
    if (counter > 0) return;

   
      setIsResending(true);
      setCounter(5); 
    
  };

  return (
    <AuthLayout img={img}>
      <AuthForm header={"Verify Your Email"}>
        <p className={styles.p}>
          We've sent a 6-digit verification code to your email
          <br />
          <span className={styles.span}>admin22@gmail.com</span>
        </p>
        <span className={styles.counter}>
          Didn’t receive the code? {counter}s
        </span>
        <OtpInput
          length={6}
          onComplete={handleOtpComplete}
          value={otp}
          onChange={setOtp}
        />

        <Button
          text="Verify Email"
          type="submit"
          path={"/login/reset-password"}
          className={otp.length === 6 ? styles.active : styles.disabled}
          disabled={otp.length !== 6}
          onClick={(e) => {
            e.preventDefault();
            // Add your verification logic here
            console.log("Verifying OTP:", otp);
          }}
        />
        <Button
          text={
            isResending
              ? "Sending..."
              : counter > 0
                ? `Resend in ${counter}s`
                : "Resend code"
          }
          className={`${styles.resendBtn} ${
            counter > 0 || isResending ? styles.disabled : styles.active
          }`}
          disabled={counter > 0 || isResending}
          onClick={handleResendClick}
        />
      </AuthForm>
    </AuthLayout>
  );
};

export default EmailVerification;
