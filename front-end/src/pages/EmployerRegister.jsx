import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, Building2, AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

// Mirrors the admin project's own employer-registration form (same fields,
// same validation) so a submission here is accepted as-is by the real
// review queue it's forwarded to. See back-end/routes/employerRegistration.js.
const COUNTRY_IDENTIFIER_LABEL = {
  India: null, // India uses separate GSTIN + CIN fields instead
  "United Kingdom": "Companies House Number",
  "United States": "Employer Identification Number (EIN)",
  Canada: "Business Number (BN)",
  Australia: "Australian Business Number (ABN)",
  Singapore: "Unique Entity Number (UEN)",
  "United Arab Emirates": "Trade License Number",
  Japan: "Corporate Number",
};
const COUNTRIES = Object.keys(COUNTRY_IDENTIFIER_LABEL);
const BRANCHES = ["HR", "Recruitment", "Talent Acquisition", "Management", "Operations", "Administration", "Finance", "Marketing", "Sales", "Engineering", "Legal", "Other"];

const EMPTY_FORM = {
  companyName: "",
  fullName: "",
  designation: "",
  branch: "",
  email: "",
  mobile: "",
  country: "India",
  gstin: "",
  cin: "",
  identifier: "",
};
const EMPTY_TERMS = { hiringTerms: false, fairHiring: false, dataProcessing: false };

const FIELD_CLASS =
  "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6";
const LABEL_CLASS = "text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1";
const SELECT_CLASS =
  "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6";

const TERMS = [
  { key: "hiringTerms", label: "General Hiring Terms", desc: "I agree to the SMAART platform terms of service for employers." },
  { key: "fairHiring", label: "Fair-Hiring & Non-Discrimination Policy", desc: "I agree to evaluate candidates solely on merit and skills." },
  { key: "dataProcessing", label: "Data Processing Agreement (GDPR/DPDP)", desc: "I agree to securely handle student data according to privacy laws." },
];

const EmployerRegister = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [termsAccepted, setTermsAccepted] = useState(EMPTY_TERMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
  };

  const setField = (name) => (value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const validate = () => {
    if (!formData.companyName.trim()) return "Company name is required.";
    if (!formData.fullName.trim()) return "Contact person name is required.";
    if (!formData.designation.trim()) return "Designation is required.";
    if (!formData.branch) return "Branch is required.";
    if (!formData.email.trim() || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      return "A valid work email is required.";
    }
    if (formData.mobile.length !== 10) return "Mobile number must be 10 digits.";
    if (formData.country === "India") {
      if (!formData.gstin.trim()) return "GSTIN is required.";
      if (!formData.cin.trim()) return "CIN Number is required.";
    } else if (!formData.identifier.trim()) {
      return `${COUNTRY_IDENTIFIER_LABEL[formData.country]} is required.`;
    }
    if (!termsAccepted.hiringTerms || !termsAccepted.fairHiring || !termsAccepted.dataProcessing) {
      return "You must accept all three legal agreements to proceed.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employer-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sourceType: "SMAART_NETWORK",
          termsAccepted,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || "Registration submitted!");
        setFormData(EMPTY_FORM);
        setTermsAccepted(EMPTY_TERMS);
      } else {
        toast.error(data.error || data.message || "Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error("Employer registration error:", err);
      toast.error("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] text-gray-900 dark:text-white transition-colors duration-300">
      <Helmet>
        <title>Employer Registration | SMAART Institute</title>
      </Helmet>
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1a3884]/5 dark:bg-[#1a3884]/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C0C0C0]/5 dark:bg-[#C0C0C0]/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3884]/10 dark:bg-[#C0C0C0]/10 border border-[#1a3884]/20 dark:border-[#C0C0C0]/20 text-[#1a3884] dark:text-[#C0C0C0] text-xs font-bold uppercase tracking-widest mb-6">
              <Building2 className="w-3.5 h-3.5" />
              For Employers
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#002147] dark:text-white mb-4 font-heading leading-tight tracking-tight">
              Become a SMAART Employer Partner
            </h1>
            <p className="text-gray-600 dark:text-slate-200 text-base leading-relaxed max-w-xl mx-auto font-light">
              Complete the form below. Your account will be verified by our admin team before activation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white dark:bg-[#001835]/90 border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1a3884]/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#C0C0C0]/10 to-transparent pointer-events-none" />

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-24 h-24 bg-[#1a3884]/20 rounded-full flex items-center justify-center mb-8 border border-[#1a3884]/30 shadow-lg shadow-[#1a3884]/20">
                  <CheckCircle className="w-12 h-12 text-[#1a3884] dark:text-[#C0C0C0]" />
                </div>
                <h3 className="text-3xl font-bold text-[#002147] dark:text-white mb-4 tracking-tight">
                  Registration submitted
                </h3>
                <p className="text-gray-600 dark:text-slate-200 mb-10 max-w-sm mx-auto text-lg leading-relaxed font-light">
                  Our admin team will verify your details and reach out to you shortly. A confirmation email has been sent to your inbox.
                </p>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 px-10 py-6 rounded-2xl transition-all duration-300 text-lg font-bold"
                >
                  Register another company
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="companyName" className={LABEL_CLASS}>Company Name</Label>
                    <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange}
                      placeholder="TechNova Pvt Ltd" required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="fullName" className={LABEL_CLASS}>Contact Person</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
                      placeholder="Vikram Shah" required className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="designation" className={LABEL_CLASS}>Designation</Label>
                    <Input id="designation" name="designation" value={formData.designation} onChange={handleChange}
                      placeholder="HR Manager" required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label className={LABEL_CLASS}>Branch</Label>
                    <Select value={formData.branch} onValueChange={setField("branch")}>
                      <SelectTrigger className={SELECT_CLASS}>
                        <SelectValue placeholder="Select branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="email" className={LABEL_CLASS}>Work Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                      placeholder="name@company.com" required className={FIELD_CLASS} />
                    {formData.email && /@(gmail|yahoo|hotmail|outlook)\.com$/.test(formData.email) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pl-1">
                        <AlertTriangle className="w-3 h-3" /> Free domains may delay verification.
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="mobile" className={LABEL_CLASS}>Mobile Number</Label>
                    <Input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange}
                      placeholder="10-digit number" maxLength={10} required className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className={LABEL_CLASS}>Country of Registration</Label>
                  <Select value={formData.country} onValueChange={setField("country")}>
                    <SelectTrigger className={SELECT_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {formData.country === "India" ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="gstin" className={LABEL_CLASS}>GSTIN Number</Label>
                      <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleChange}
                        placeholder="15-digit GSTIN" maxLength={15} required className={FIELD_CLASS} />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="cin" className={LABEL_CLASS}>CIN Number</Label>
                      <Input id="cin" name="cin" value={formData.cin} onChange={handleChange}
                        placeholder="21-digit CIN" maxLength={21} required className={FIELD_CLASS} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="identifier" className={LABEL_CLASS}>{COUNTRY_IDENTIFIER_LABEL[formData.country]}</Label>
                    <Input id="identifier" name="identifier" value={formData.identifier} onChange={handleChange}
                      placeholder="Enter registration number" required className={FIELD_CLASS} />
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                    Required Legal Agreements
                  </h4>
                  {TERMS.map((term) => (
                    <label key={term.key} className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox
                        checked={termsAccepted[term.key]}
                        onCheckedChange={(checked) => setTermsAccepted((prev) => ({ ...prev, [term.key]: checked === true }))}
                        className="mt-0.5 border-gray-300 dark:border-white/20 data-[state=checked]:bg-[#1a3884] data-[state=checked]:border-[#1a3884]"
                      />
                      <div className="text-sm">
                        <span className="font-bold text-gray-800 dark:text-slate-100 group-hover:text-[#1a3884] dark:group-hover:text-[#C0C0C0] transition-colors">
                          {term.label}
                        </span>
                        <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 font-light">{term.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#1a3884] to-[#2a4d9e] hover:from-[#2a4d9e] hover:to-[#1a3884] text-white font-bold py-5 text-lg rounded-xl shadow-xl shadow-[#1a3884]/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group border border-[#C0C0C0] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <Send className="ml-3 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default EmployerRegister;
