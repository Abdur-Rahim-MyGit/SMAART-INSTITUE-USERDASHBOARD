import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstitutionSelector from "@/components/InstitutionSelector";
import PageTransition from "@/components/PageTransition";
import TrustStats from "@/components/landing/TrustStats";
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
import InstitutionSelectModal from "@/components/auth/InstitutionSelectModal";
import SplashScreen from "@/components/SplashScreen";
import SectionReveal from "@/components/ui/SectionReveal";
import CookieConsent from "@/components/CookieConsent";
import ThemeToggle from "@/components/landing/ThemeToggle";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [isInstitutionSelectOpen, setIsInstitutionSelectOpen] = useState(false);

  // Immediate redirect for logged-in users before any rendering
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check for forced logout flagging from api.js
    if (sessionStorage.getItem('kicked_out')) {
      // Small delay to ensure UI is ready
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

    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    } else {
      setIsReady(true);
    }
  }, [navigate]);

  if (!isReady && sessionStorage.getItem("user")) {
    return null; // Don't render anything if we're about to redirect
  }

  const openLogin = () => {
    setIsInstitutionSelectOpen(true);
  };

  const openSignup = () => {
    setIsInstitutionSelectOpen(true);
  };

  const handleInstitutionSelected = (institution) => {
    setIsInstitutionSelectOpen(false);
    navigate(`/institution/${encodeURIComponent(institution.name)}`);
  };

  return (
    <PageTransition className="min-h-screen bg-white dark:bg-[#002147] text-gray-900 dark:text-white selection:bg-[#30919D] selection:text-white transition-colors duration-300">
      <Helmet>
        <title>Smaart Minds | AI-Powered Student Career Analyser</title>
        <meta name="description" content="Unlock your future with Smaart Minds. The first AI Career Coach integrating EQ, Cognitive Skills, and Academic Performance to guide students to success." />
        <meta property="og:title" content="Smaart Minds | Shape Skills, Unlock Future" />
        <meta property="og:description" content="AI-driven assessments and personalized learning pathways for students." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="theme-color" content="#002147" />
      </Helmet>

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Navbar onLoginClick={openLogin} onSignupClick={openSignup} />

      <HeroSection onSignupClick={openSignup} onLoginClick={openLogin} />

      <IntegrationMarquee />

      <main className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
        <SectionReveal className="py-24">
          <InstitutionSelector />
        </SectionReveal>
      </main>

      <SectionReveal>
        <TrustStats />
      </SectionReveal>

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
