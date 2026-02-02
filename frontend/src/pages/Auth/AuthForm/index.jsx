import React from "react";
import { Typography, } from "@mui/material";
import styles from "./AuthForm.module.css";

const AuthForm = ({ header, children }) => {
  
  return (
    <div className={styles.container}>
      <div className={styles.paper}>
        <Typography component="h1" variant="h5" gutterBottom alignItems="start">
          {header}
        </Typography>
        {children}
      </div>
    </div>
  );
};

export default AuthForm;
