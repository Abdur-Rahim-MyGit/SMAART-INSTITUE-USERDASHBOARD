import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import PageTransition from "@/components/PageTransition";

import HeroSection from "@/components/landing/HeroSection";
import ServiceCards from "@/components/landing/ServiceCards";
import HowItWorks from "@/components/landing/HowItWorks";
import InteractiveGrid from "@/components/landing/InteractiveGrid";
import Testimonials from "@/components/landing/Testimonials";
import PassportPreview from "@/components/landing/PassportPreview";
import IntegrationMarquee from "@/components/landing/IntegrationMarquee";
import FeatureDeepDive from "@/components/landing/FeatureDeepDive";
import PricingPlans from "@/components/landing/PricingPlans";
import Newsletter from "@/components/landing/Newsletter";
import FAQAccordion from "@/components/landing/FAQAccordion";
import ContactForm from "@/components/landing/ContactForm";
import CertificateVerification from "@/components/landing/CertificateVerification";
import InstitutionSelectModal from "@/components/auth/InstitutionSelectModal";
import SplashScreen from "@/components/SplashScreen";
import SectionReveal from "@/components/ui/SectionReveal";
import CookieConsent from "@/components/CookieConsent";


const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSplash, setShowSplash] = useState(true);
  const [isInstitutionSelectOpen, setIsInstitutionSelectOpen] = useState(false);
  const hasRedirectedRef = useRef(false);

  // If user is already logged in, we need to redirect — start as false only in that case
  const isLoggedIn = !!sessionStorage.getItem("user");
  const [isReady, setIsReady] = useState(!isLoggedIn);

  // Auto-open modal logic
  useEffect(() => {
    // 1. Check for ?modal=true query param (manual trigger)
    if (searchParams.get('modal') === 'true') {
      setIsInstitutionSelectOpen(true);
      setSearchParams({}, { replace: true });
      return;
    }
  }, [searchParams, setSearchParams, showSplash]);

  useEffect(() => {
    // Check for forced logout flagging from api.js
    if (sessionStorage.getItem('kicked_out')) {
      setTimeout(() => {
        toast.error("You have been logged out because another device logged in to this account.", {
          duration: 8000,
          position: 'top-center',
          style: {
            border: '2px solid #ef4444',
            backgroundColor: '#fee2e2',
            color: '#7f1d1d'
          }
        });
        sessionStorage.removeItem('kicked_out');
      }, 500);
    }

    // FIX: Show a clear message when a 3-hour session expires mid-use
    if (sessionStorage.getItem('session_expired')) {
      setTimeout(() => {
        toast.error("Your session has expired after 3 hours of use. Please log in again to continue.", {
          duration: 8000,
          position: 'top-center',
          style: {
            border: '2px solid #f59e0b',
            backgroundColor: '#fef3c7',
            color: '#78350f'
          }
        });
        sessionStorage.removeItem('session_expired');
      }, 500);
    }

    // Check for intentional cross-tab logout
    if (sessionStorage.getItem('logged_out_other_tab')) {
      setTimeout(() => {
        toast.success("You have been logged out from another tab.", {
          duration: 5000,
          position: 'top-center',
          style: {
            border: '2px solid #10b981',
            backgroundColor: '#d1fae5',
            color: '#065f46'
          }
        });
        sessionStorage.removeItem('logged_out_other_tab');
      }, 500);
    }

    const userData = sessionStorage.getItem("user");
    if (userData) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        navigate("/dashboard", { replace: true });
      }
    } else {
      setIsReady(true);
    }
  }, [navigate]);

  // Block render only while we know a redirect is imminent
  if (!isReady) {
    return null;
  }

  const openLogin = () => {
    setIsInstitutionSelectOpen(true);
  };

  const openSignup = () => {
    setIsInstitutionSelectOpen(true);
  };

  const handleInstitutionSelected = (institution) => {
    setIsInstitutionSelectOpen(false);
    // After selection, always go to the centralized /login route
    navigate('/login');
  };

  return (
    <PageTransition className="min-h-screen bg-white dark:bg-[#00152E] text-gray-900 dark:text-white selection:bg-[#1a3884] selection:text-white transition-colors duration-300">
      <Helmet>
        <title>SMAART Institute | AI-Powered Student Career Analyser</title>
        <meta name="description" content="Unlock your future with SMAART Institute. The first AI Career Coach integrating EQ, Cognitive Skills, and Academic Performance to guide students to success." />
        <meta property="og:title" content="SMAART Institute | Shape Skills, Unlock Future" />
        <meta property="og:description" content="AI-driven assessments and personalized learning pathways for students." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="theme-color" content="#002147" />
      </Helmet>

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Navbar onLoginClick={openLogin} onSignupClick={openSignup} />

      <HeroSection onSignupClick={openSignup} onLoginClick={openLogin} />

      <IntegrationMarquee />





      <SectionReveal>
        <InteractiveGrid />
      </SectionReveal>

      <SectionReveal>
        <ServiceCards />
      </SectionReveal>

      <SectionReveal>
        <FeatureDeepDive />
      </SectionReveal>

      <SectionReveal>
        <HowItWorks />
      </SectionReveal>


      <SectionReveal>
        <PassportPreview />
      </SectionReveal>

      <SectionReveal>
        <Testimonials />
      </SectionReveal>

      <SectionReveal>
        <PricingPlans />
      </SectionReveal>

      <SectionReveal>
        <FAQAccordion />
      </SectionReveal>

      <SectionReveal>
        <CertificateVerification />
      </SectionReveal>

      <SectionReveal>
        <ContactForm />
      </SectionReveal>

      <SectionReveal>
        <Newsletter />
      </SectionReveal>

      <Footer />

      <CookieConsent />

      {/* Institution Selection Modal */}
      <InstitutionSelectModal
        isOpen={isInstitutionSelectOpen}
        onClose={() => setIsInstitutionSelectOpen(false)}
        onInstitutionSelected={handleInstitutionSelected}
      />
    </PageTransition>
  );
};

export default LandingPage;

