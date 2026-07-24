import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContextFixed";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AnimatedRoutes from "./components/AnimatedRoutes";
import { PWAPrompt } from "@/components/PWAPrompt";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient();

const LanguageDirectionHandler = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ThemeProvider>
            <UserProvider>
              <NotificationProvider>
                <SidebarProvider>
                  <ErrorBoundary>
                    <LanguageDirectionHandler />
                    <Toaster />
                    <Sonner />
                    <PWAPrompt />
                    <AnimatedRoutes />
                  </ErrorBoundary>
                </SidebarProvider>
              </NotificationProvider>
            </UserProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
