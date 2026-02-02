import AuthLayout from "@/components/AuthLayout";
import img from "@/assets/Auth/login.png";
import { TextField, Box } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AuthFooter from "../AuthFooter.jsx/index";
import { Link } from "react-router-dom";
import AuthForm from "../AuthForm";
import styles from "./Login.module.css";
import Input from "@/components/common/Input";

import LoginImg from "@/assets/Auth/Login.json";
function Login() {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle login logic here
  };
  return (
    <AuthLayout img={LoginImg} isLottie={true}>
      <div>
        <AuthForm header={"Welcome Back!"}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            className={styles.form}
          >
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

            <Input
              type="password"
              label="Password"
              autoComplete="current-password"
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

            <button type="submit" className={styles.submitButton}>
              Login
            </button>
            <Link to="/login/forgot-password" className={styles.forgotPassword}>
              forgot password?
            </Link>
            <AuthFooter
              footerText="Don't have an account?"
              footerLinkText="Sign Up"
              footerLinkHref="/signup"
            />
          </Box>
        </AuthForm>
      </div>
    </AuthLayout>
  );
}

export default Login;
