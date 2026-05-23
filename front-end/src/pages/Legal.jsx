import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, Cookie, Database, ArrowLeft, Calendar, HelpCircle, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Helmet } from "react-helmet-async";

const LEGAL_TABS = [
  {
    id: "privacy-policy",
    label: "Privacy Policy",
    icon: Shield,
    lastUpdated: "May 22, 2026",
    description: "How we collect, use, protect, and handle your personal and assessment data."
  },
  {
    id: "terms-of-service",
    label: "Terms of Service",
    icon: FileText,
    lastUpdated: "May 22, 2026",
    description: "The rules, guidelines, and agreements governing your use of our platform."
  },
  {
    id: "cookie-policy",
    label: "Cookie Policy",
    icon: Cookie,
    lastUpdated: "May 22, 2026",
    description: "Information about how and why we use cookies to improve your user experience."
  },
  {
    id: "data-protection",
    label: "Data Protection",
    icon: Database,
    lastUpdated: "May 22, 2026",
    description: "Our technical and organizational security measures to protect your information."
  }
];

const Legal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const activeTabId = searchParams.get("tab") || "privacy-policy";
  const activeTab = LEGAL_TABS.find(tab => tab.id === activeTabId) || LEGAL_TABS[0];

  useEffect(() => {
    // Scroll to top when active tab changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTabId]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <PageTransition className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] text-gray-900 dark:text-white transition-colors duration-300">
      <Helmet>
        <title>{activeTab.label} | SMAART Institute Legal Center</title>
        <meta name="description" content={`SMAART Institute ${activeTab.label} - Read our guidelines, privacy protections, terms, and policies.`} />
      </Helmet>

      {/* Header Navigation */}
      <Navbar showLinks={true} />

      {/* Main Container */}
      <div className="pt-32 pb-24 container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a3884] dark:text-slate-300 hover:text-[#C0C0C0] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to previous page
          </button>
        </div>

        {/* Page Hero Section */}
        <div className="mb-12 relative overflow-hidden bg-gradient-to-br from-[#1a3884]/5 via-transparent to-[#1a3884]/5 dark:from-[#002147]/50 dark:to-transparent border border-gray-200/50 dark:border-transparent rounded-3xl p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#1a3884]/5 dark:bg-[#1a3884]/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:text-[#C0C0C0] bg-[#1a3884]/10 dark:bg-white/5 px-3.5 py-1.5 rounded-full inline-block mb-4">
              Legal Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
              Policies & Agreements
            </h1>
            <p className="text-gray-500 dark:text-slate-300 text-base leading-relaxed">
              We value your trust and are committed to transparency. In this section, you'll find details on how SMAART Institute protects your privacy, uses cookies, secures student data, and outlines terms of engagement.
            </p>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Tab Selectors (Sticky on Desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-4">
            <div className="bg-white dark:bg-[#002147] border border-gray-100 dark:border-transparent rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-slate-400 mb-6 px-2">
                Documents
              </h3>
              
              {/* Desktop Vertical Tabs */}
              <nav className="flex flex-col gap-2">
                {LEGAL_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-300 border ${
                        isActive
                          ? "bg-[#1a3884] text-white border-transparent shadow-lg shadow-[#1a3884]/20"
                          : "bg-transparent text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 border-transparent hover:border-gray-200/50 dark:hover:border-transparent"
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/5 text-[#1a3884] dark:text-[#C0C0C0]"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-tight mb-1">{tab.label}</div>
                        <div className={`text-xs truncate ${isActive ? "text-white/80" : "text-gray-400 dark:text-slate-400"}`}>
                          Last updated: {tab.lastUpdated}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Direct contact helper card */}
            <div className="bg-gradient-to-br from-[#1a3884] to-[#132c6b] text-white rounded-3xl p-6 shadow-lg shadow-[#1a3884]/15 border border-[#C0C0C0]/20">
              <HelpCircle className="w-8 h-8 text-[#C0C0C0] mb-4" />
              <h4 className="font-bold text-base mb-2">Have legal questions?</h4>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                If you have questions regarding our Privacy Policy, Terms of Service, or Data Protection compliance, please contact our support team.
              </p>
              <a
                href="mailto:hello@smaartinstitute.org"
                className="inline-flex items-center gap-2 bg-white text-[#1a3884] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#F8FAFC] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                hello@smaartinstitute.org
              </a>
            </div>
          </div>

          {/* Right Column: Detailed Document Area */}
          <main className="lg:col-span-8">
            <div className="bg-white dark:bg-[#002147] border border-gray-100 dark:border-transparent rounded-3xl p-8 sm:p-10 md:p-12 shadow-sm relative min-h-[500px]">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTabId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Content Header */}
                  <div className="border-b border-gray-100 dark:border-white/5 pb-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-slate-400 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Last Updated: {activeTab.lastUpdated}</span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span>Version 1.0.0</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {activeTab.label}
                    </h2>
                  </div>

                  {/* Render content based on selected tab */}
                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-gray-600 dark:text-slate-300 space-y-6 font-normal">
                    {activeTabId === "privacy-policy" && <PrivacyPolicyContent />}
                    {activeTabId === "terms-of-service" && <TermsOfServiceContent />}
                    {activeTabId === "cookie-policy" && <CookiePolicyContent />}
                    {activeTabId === "data-protection" && <DataProtectionContent />}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </PageTransition>
  );
};

/* --- Privacy Policy Content --- */
const PrivacyPolicyContent = () => (
  <>
    <p>
      At SMAART Institute, we are committed to safeguarding the privacy and security of our users—primarily students, educators, and institutional administrators. This Privacy Policy describes how we collect, process, share, and protect your information when you use our platform, assessments, and employability tools.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Information We Collect</h3>
    <p>
      To deliver tailored career guidance, calculate quotients, and facilitate learning pathways, we collect several types of data:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Account Details:</strong> When you register, we collect your full name, email address, school/institution name, student ID, and secure authentication details.</li>
      <li><strong>Assessment and Quotient Responses:</strong> We store responses to cognitive, emotional intelligence (EQ), academic, and career interest questionnaires. This data is critical for generating your personalized reports.</li>
      <li><strong>Academic & Skills Records:</strong> With your permission, we store academic metrics, credentials, course completion logs, and certificates displayed on your Skills Passport.</li>
      <li><strong>Usage & Device Metrics:</strong> We log system interactions, page views, module completion progress, browser details, and anonymous activity metrics to optimize platform responsiveness.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. How We Use Your Information</h3>
    <p>
      Your data is never sold or traded. We use it solely to build a supportive ecosystem:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Personalization:</strong> To map out customized courses, learning tracks, and AI career recommendations.</li>
      <li><strong>Evaluation:</strong> To compute quotients and visualize your baseline vs. progressive capabilities.</li>
      <li><strong>Institutional Analytics:</strong> Authorized staff at your educational institution receive aggregate reports to support your academic growth.</li>
      <li><strong>Security & Optimization:</strong> To verify certificates, authenticate sessions, prevent fraud, and run system health diagnostics.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Data Sharing and Disclosure</h3>
    <p>
      We share data only under strict safeguards:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Your Institution:</strong> Administrators of your registered college or school will have access to academic results and skills tracking reports.</li>
      <li><strong>Verify Portal:</strong> Publicly verifiable badges or certificates are shared only when you actively distribute your public verification links.</li>
      <li><strong>Service Providers:</strong> We use trusted third-party providers (e.g. database hosting, secure authentication) that are contractually bound to maintain confidentiality.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">4. Security Measures</h3>
    <p>
      We implement enterprise-grade security protocols. Data is encrypted in transit using industry-standard Secure Socket Layer (SSL/TLS) technology and encrypted at rest within our secure databases. Access permissions are strictly managed using secure tokenized routing.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">5. Your Choices and Rights</h3>
    <p>
      You hold fundamental rights regarding your data. You may review and update your profile settings at any time. If you wish to permanently delete your account, withdraw consent, or request a portable copy of your skills history, you can do so by submitting a request to our support desk.
    </p>
  </>
);

/* --- Terms of Service Content --- */
const TermsOfServiceContent = () => (
  <>
    <p>
      Welcome to SMAART Institute. By accessing or using our websites, applications, learning management systems, and assessment platforms, you agree to comply with and be bound by the following Terms of Service. Please read them carefully.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Eligibility and Registration</h3>
    <p>
      Access to SMAART is granted to students and administrators associated with participating educational institutions. You must provide accurate, complete registration details. You are solely responsible for preserving the confidentiality of your credentials and all activities occurring under your account.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Use of Platform & Code of Conduct</h3>
    <p>
      Our ecosystem is built to maximize career potential. You agree to:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Answer all cognitive, EQ, and baseline assessments honestly and independently.</li>
      <li>Refrain from copying, distributing, or scraping the learning content, toolkit modules, or design tokens.</li>
      <li>Avoid attempting to bypass verification protocols, upload malicious code, or compromise platform integrity.</li>
      <li>Communicate respectfully within student groups and community channels.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Proprietary Rights</h3>
    <p>
      All source code, design systems, visual styles, assessment structures, proprietary quotients algorithms, and content within the SMAART Institute platform are the intellectual property of SMAART Institute and its licensors. Use of our logo, branding, or dashboard designs requires explicit, written consent.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">4. AI Insights & Career Advice Disclaimer</h3>
    <p>
      The platform utilizes artificial intelligence, user input, and statistical modeling to generate career insights, profile analyses, and developmental suggestions. These recommendations are for advisory and educational purposes. SMAART Institute does not guarantee specific job placements, test scores, or academic outcomes.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">5. Suspensions and Termination</h3>
    <p>
      We reserve the right to suspend, limit, or terminate access to your account if we discover a breach of these Terms, unauthorized account access, academic dishonesty, or if requested by your educational institution.
    </p>
  </>
);

/* --- Cookie Policy Content --- */
const CookiePolicyContent = () => (
  <>
    <p>
      SMAART Institute uses cookies and similar tracking technologies to ensure our website functions correctly, remembers your visual preferences, and evaluates how users interact with our toolkits. This Cookie Policy explains what cookies are and how we use them.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. What Are Cookies?</h3>
    <p>
      Cookies are small text files stored on your browser or device when you visit a webpage. They help the system recognize your session, remember login data, and keep track of selected settings (such as dark/light mode preference).
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Types of Cookies We Use</h3>
    <p>
      Our application utilizes three primary types of cookies:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Essential/Strictly Necessary Cookies:</strong> These cookies are critical to let you navigate the site, log into secure accounts, and keep your session authenticated (e.g. JWT storage, anti-CSRF protection tokens). The platform cannot operate correctly without these.</li>
      <li><strong>Functional Cookies:</strong> These cookies remember choices you make. For example, whether you have configured the dashboard sidebar to be collapsed, what language you chose, and your dark mode styling preferences.</li>
      <li><strong>Performance & Analytics Cookies:</strong> We collect aggregated, anonymous data on what pages are visited most, typical load times, and module interaction speed. This helps us refine layout designs and ensure the site feels premium and fast.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Managing Your Cookie Preferences</h3>
    <p>
      Most web browsers allow you to manage cookies through browser settings. You can block or clear cookies at your discretion. However, please note that blocking essential cookies will prevent you from logging in or using the protected dashboard features of the SMAART Institute platform.
    </p>
  </>
);

/* --- Data Protection Content --- */
const DataProtectionContent = () => (
  <>
    <p>
      At SMAART Institute, protecting student and user records is our highest priority. We implement modern data protection frameworks (such as GDPR, CCPA, and regional student privacy acts) to guarantee that user data remains private, secure, and under control.
    </p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Core Data Protection Principles</h3>
    <p>
      We operate our technical architectures based on core principles:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Data Minimization:</strong> We only collect information that is strictly necessary to run assessments, generate career recommendations, and maintain your account.</li>
      <li><strong>Purpose Limitation:</strong> Your assessment scores, academic documents, and profile attributes are never utilized for unauthorized marketing purposes.</li>
      <li><strong>Integrity and Security:</strong> We deploy firewalls, rate limiting, secure routing, database encryption, and regular code audits to ward off external threats.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Student Rights and Control</h3>
    <p>
      We empower you with control over your digital footprint:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Right of Access:</strong> You can view all records related to your assessments, courses, certificates, and profiles directly from your dashboard.</li>
      <li><strong>Right to Rectification:</strong> You can update inaccurate profile details from your Profile Settings.</li>
      <li><strong>Right to Erasure (Right to be Forgotten):</strong> You can request that we completely erase your historical assessment scores and deactivate your account from our records.</li>
      <li><strong>Right to Data Portability:</strong> You can request an export of your Skills Passport history and credential metadata.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Incident Response and Auditing</h3>
    <p>
      In the unlikely event of a security incident or data breach, we have active protocols in place to identify the cause, isolate affected databases, mitigate impacts, and notify users and administrative authorities within the legally mandated timelines. We conduct internal audits of our system integrations to ensure the highest standards of data stewardship.
    </p>
  </>
);

export default Legal;
