import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AnimatedRoutes from "./components/AnimatedRoutes";
import FloatingCommunityButton from "@/components/FloatingCommunityButton";
import SecurityGuard from "@/components/SecurityGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

import ThemeToggle from "@/components/landing/ThemeToggle";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ThemeToggle />
              <AnimatedRoutes />
              <FloatingCommunityButton />
              <SecurityGuard />
            </BrowserRouter>
          </ErrorBoundary>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
