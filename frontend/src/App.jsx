import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {RouterProvider} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import router from "@/routes/index.jsx";
import { RegisterProvider } from "./contexts/Valdation";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RegisterProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </AuthProvider>
      </RegisterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
