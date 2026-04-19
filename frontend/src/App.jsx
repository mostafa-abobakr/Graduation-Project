import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {RouterProvider} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import router from "@/routes/index.jsx";
import { RegisterProvider } from "./contexts/Valdation";
import { LanguageProvider } from "@/contexts/LanguageContext";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RegisterProvider>
      <LanguageProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </AuthProvider>
      </LanguageProvider>
      </RegisterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
