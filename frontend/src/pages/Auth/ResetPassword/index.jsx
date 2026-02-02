import React from "react";
import {  InputAdornment} from "@mui/material";

import img from "@/assets/Auth/ResetPassword.png";
import Input from "@/components/common/Input";
import AuthLayout from "@/components/AuthLayout";
import AuthFrom from "@/Pages/Auth/AuthForm/index";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Button from "@/components/common/Button/index"
const ResetPassword = () => {
  return (
    <AuthLayout img={img}>
      <AuthFrom header={"Reset password"}>
        <Input
          type="password"
          label="New Password"
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon
                  sx={{
                    color: "var(--color-primary-main)",
                    fontSize: "20px",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
        <Input
          type="password"
          label="Confirm Password"
          autoComplete="confirm-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon
                  sx={{
                    color: "var(--color-primary-main)",
                    fontSize: "20px",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
        <Button
          text="change password"
          style={{ background: "var(--color-primary-light)", color: "white" }}
          path={"/password-changed"}
        />
      </AuthFrom>
    </AuthLayout>
  );
};

export default ResetPassword;
