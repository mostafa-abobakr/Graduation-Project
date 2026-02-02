import { Box, Stack, useMediaQuery } from "@mui/material";
import styles from "./AuthLayout.module.css";

function AuthLayout({ img, children }) {

  const isSmall = useMediaQuery("(max-width:800px)");

  return (
    <div className={styles.authWrapper}>
      <Stack
        direction={isSmall ? "column" : "row"}
        // className={styles.card}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '10px',
          boxShadow: '0 5px 5px rgba(0, 0, 0, 0.204)',
          padding: '20px',
        }}
      >
        <img src={img} alt="" className={styles.img} />
        <div className={styles.divider}></div>
        {children}
      </Stack>
    </div>
  );
}

export default AuthLayout;
