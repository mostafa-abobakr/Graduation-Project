import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/shared/ThemeProvider";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ThemeProvider>
);
