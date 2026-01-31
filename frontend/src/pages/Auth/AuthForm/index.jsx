import React from "react";
import { TextField, Button, Typography, Container, Box } from "@mui/material";
import styles from "./AuthForm.module.css";
import AuthFooter from "../AuthFooter.jsx/index";
const AuthForm = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle login logic here
  };
  return (
    <div className="container">
      <div className={styles.paper}>
        <Typography component="h1" variant="h5" gutterBottom alignSelf="left">
          Welcome back!
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          className={styles.form}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className={styles.submitButton}
          >
            Sign In
          </Button>
          <AuthFooter
            footerText="Don't have an account?"
            footerLinkText="Sign Up"
            footerLinkHref="/signup"
          />
        </Box>
      </div>
    </div>
  );
};

export default AuthForm;
