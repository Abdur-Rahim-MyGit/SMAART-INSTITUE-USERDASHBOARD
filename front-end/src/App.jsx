import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
=======
import { UserProvider } from "@/contexts/UserContext";
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f
import AnimatedRoutes from "./components/AnimatedRoutes";
import FloatingCommunityButton from "@/components/FloatingCommunityButton";
import SecurityGuard from "@/components/SecurityGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
<<<<<<< HEAD
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
