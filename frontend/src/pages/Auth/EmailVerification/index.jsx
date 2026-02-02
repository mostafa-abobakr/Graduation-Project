
import React, { useState } from "react";
import img from "@/assets/Auth/Authentication.png";
import AuthLayout from "@/components/AuthLayout/index";
import AuthForm from "../AuthForm";
import styles from "./EmailVerification.module.css";
import Button from "@/components/common/Button";
import OtpInput from "@/components/common/OtpInput";
const EmailVerification = () => {
    const [otp , setOtp]= useState("");
    const handleOtpComplete = (code) => {
        setOtp(code)
      console.log("OTP Code:", code);

    };
  return (
    <AuthLayout img={img}>
      <AuthForm header={"Verify Your Email"}>
        <p className={styles.p}>
          We’ve sent a 6-digit verification code to your email
          <br />
          <span className={styles.span}>admin22@gmail.com</span>
        </p>

        <p className={styles.p}>Enter the code below to continue.</p>

        <OtpInput length={5} onComplete={handleOtpComplete} />

        <Button
          text={"Reset Password"}
          path={otp.length === 5 ? "/login/reset-password" : ""}
          style={{
            background:
              otp.length === 5
                ? "var(--color-primary-light)"
                : "var(--color-text-disabled)",
            color: "white",
            cursor: otp.length === 5 ? "pointer" : "not-allowed",
            opacity: otp.length === 5 ? 1 : 0.7,
          }}
          disabled={otp.length < 5}
        ></Button>
        {/* <Button
          text={"Back To Login"}
          path={"/login"}
          style={{ background: "var(--color-primary-light)", color: "white" }}
        ></Button> */}
        <Button
          text={"Resend link"}
          path={""}
          style={{
            background: "var(--color-text-disabled)",
            color: "var(--color-text-secondary)",
          }}
        ></Button>
      </AuthForm>
    </AuthLayout>
  );
};

export default EmailVerification;

