import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from "@mui/material";

// ================= // Contex // ================== 
const ThemeContext = createContext(null);

// ================= // Provide // ================== 
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored : "light";
  });

  useEffect(() => { localStorage.setItem("theme", mode); }, [mode]);
  const toggleTheme = () => { setMode((prev) => (prev === "light" ? "dark" : "light")); };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#90caf9" : "#1976d2",
            WhiteText: mode === "dark" ? "#000000" : "#ffffff",
            DarkText: mode === "dark" ? "#ffffff" : "#000000",
          },
          divider:
            mode === "dark"
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.12)",
          icon: {
            active: mode === "dark" ? "#90caf9" : "#1976d2", // Using primary color for active icons
          },
          background: {
            default: mode === "dark" ? "#090e1a" : "#f9fafb",
            paper: mode === "dark" ? "#020617" : "#ffffff",
          },
        },
        // shape: { borderRadius: 10, },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// ================= // Hook // ================== 
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};