import { Box, useTheme, useMediaQuery,Divider } from "@mui/material";
import Lottie from "lottie-react";

function AuthLayout({ img, children, isLottie = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        backgroundColor: theme.palette.background.default,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(2),
      }}
    >
      <Box
        sx={{
          boxShadow: theme.shadows[3],
          borderRadius: 2.5, // 10px
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: theme.spacing(4), // 32px
          width: { xs: "100%", sm: "90%", md: "90%" },
          height: { xs: "90%", md: "90%" },
          backgroundColor: theme.palette.background.paper,
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing(4),
            height: "100%",
          }}
        >
          {isLottie ? (
            <Lottie
              animationData={img}
              style={{
                width: "100%",
                maxWidth: 400,
                animation: "ImgAnimation 6s ease-in-out infinite alternate",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                "@keyframes ImgAnimation": {
                  "0%, 100%": {
                    transform: "translateY(0)",
                    opacity: 0.8,
                    filter: "drop-shadow(0 20px 40px rgba(231, 243, 254, 0.1))",
                  },
                  "50%": {
                    transform: "translateY(-40px)",
                    filter:
                      "drop-shadow(0 20px 40px rgba(231, 243, 254, 0.6)) drop-shadow(0 20px 40px rgba(51, 141, 225, 0.6))",
                    opacity: 1,
                  },
                },
              }}
            />
          ) : (
            <Box
              component="img"
              src={img}
              alt="Authentication"
              sx={{
                width: "55%",
                maxHeight: "100%",
                animation: "ImgAnimation 6s ease-in-out infinite alternate",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                "@keyframes ImgAnimation": {
                  "0%, 100%": {
                    transform: "translateY(0)",
                    opacity: 0.8,
                    filter: "drop-shadow(0 20px 40px rgba(231, 243, 254, 0.1))",
                  },
                  "50%": {
                    transform: "translateY(-40px)",
                    filter:
                      "drop-shadow(0 20px 40px rgba(50, 136, 216, 0.6)) drop-shadow(0 20px 40px rgba(51, 141, 225, 0.6))",
                    opacity: 1,
                  },
                },
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            px: 2.5,
          }}
        >
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: "90%",
              borderColor: "divider",
              margin:"auto",
              borderRightWidth: "1px",
            }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            padding: theme.spacing(4),
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;
