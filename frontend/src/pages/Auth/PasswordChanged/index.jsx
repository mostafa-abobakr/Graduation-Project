import React from "react";
import img from "@/assets/Auth/Authentication.png";
import AuthLayout from "@/components/AuthLayout/index";
import AuthForm from "../AuthForm";
import styles from "./PasswordChanged.module.css";
import Button from "@/components/common/Button";
const PasswordChanged = () => {
  return (
    <AuthLayout img={img}>
      <AuthForm header={"Password Changed"}>
        <p className={styles.p}>Your password has been changed successfully.</p>

        <p className={styles.p}>You can now log in using your new password.</p>
        <Button
          text={"Back To Login"}
          path={"/login"}
          style={{ background: "var(--color-primary-light)", color: "white" }}
        ></Button>
      </AuthForm>
    </AuthLayout>
  );
};

export default PasswordChanged;
