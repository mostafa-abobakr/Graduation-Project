import React from 'react'
import { InputAdornment, TextField } from "@mui/material";
import img from "@/assets/Auth/Forgotpassword-rafiki.png";
import Input from '@/components/common/Input';
import AuthLayout from '@/components/AuthLayout'
import AuthFrom from "@/Pages/Auth/AuthForm/index"
import Button from '@/components/common/Button/index';
import styles from "./forgetPassword.module.css"
const ForgetPassword = () => {
  return (
    <div>
      <AuthLayout img={img}>
        <AuthFrom header={"Forget password"}>
          <p className={styles.p}>
            please enter your email address below you will recive a verification
            link
          </p>
          <Input
            type="email"
            label="Email Address"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span
                    style={{
                      color: "var(--color-primary-main)",
                      fontWeight: 600,
                      fontSize: "20px",
                    }}
                  >
                    @
                  </span>
                </InputAdornment>
              ),
            }}
          />
          <Button
            text={"continue"}
            path={"/email-sent"}
            style={{ background: "var(--color-primary-light)", color: "white" }}
          ></Button>
        </AuthFrom>
      </AuthLayout>
    </div>
  );
}

export default ForgetPassword