import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { UserProvider } from "@/contexts/UserContext";
import AnimatedRoutes from "./components/AnimatedRoutes";
import SecurityGuard from "@/components/SecurityGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import SingleTabGuard from "@/components/SingleTabGuard";


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SingleTabGuard>
                  <AnimatedRoutes />
                  <SecurityGuard />
                </SingleTabGuard>
              </BrowserRouter>
            </SidebarProvider>
          </UserProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
