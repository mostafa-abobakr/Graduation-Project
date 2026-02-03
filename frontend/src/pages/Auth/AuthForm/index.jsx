import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const AuthForm = ({ header, children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 2.5, // 20px
        // backgroundColor: theme.palette.background.default,
      }}
    >
      <Box
        component="form"
        sx={{
          // backgroundColor: theme.palette.background.paper,
          padding: 4, // 32px
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 600,
          width: "100%",
          borderRadius: 1, // 8px
     
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            mb: 3, // 24px
            alignSelf: "flex-start",
          }}
        >
          {header}
        </Typography>
        <Box sx={{ width: "100%" }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AuthForm;
