import { Box, Stack, useMediaQuery } from "@mui/material";
import styles from "./AuthLayout.module.css";
import Lottie from "lottie-react";

function AuthLayout({ img, children, isLottie = false }) {
  return (
    <div className={styles.authWrapper}>
      <div className={styles.card}>
        {isLottie ? (
          <Lottie animationData={img} />
        ) : (
          <img src={img} alt="" className={styles.img} />
        )}
        <div className={styles.divider}></div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
