import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import {RouterProvider} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import router from "@/routes/index.jsx";
import { RegisterProvider } from "./contexts/Valdation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RegisterProvider>
      <LanguageProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <ScrollToTopButton />
        <InventoryProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </InventoryProvider>
      </AuthProvider>
      </LanguageProvider>
      </RegisterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
