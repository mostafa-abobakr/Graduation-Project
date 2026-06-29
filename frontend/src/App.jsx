import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {RouterProvider} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import router from "@/routes/index.jsx";
import { RegisterProvider } from "./contexts/Valdation";
import { LanguageProvider } from "@/contexts/LanguageContext";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — data won't auto-refetch until stale
      refetchOnWindowFocus: false, // don't refetch when switching browser tabs
      refetchOnReconnect: false,
    },
  },
});

window.addEventListener("data-mutated", () => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RegisterProvider>
      <LanguageProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <InventoryProvider>
          <RouterProvider router={router} />
        </InventoryProvider>
      </AuthProvider>
      </LanguageProvider>
      </RegisterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
