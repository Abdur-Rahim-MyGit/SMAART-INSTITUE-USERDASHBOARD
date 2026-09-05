import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, Building2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  designation: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  companySize: "",
  city: "",
  message: "",
};

const FIELD_CLASS =
  "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6";

const LABEL_CLASS =
  "text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1";

const EmployerRegister = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/employer-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || "Registration received!");
        setFormData(EMPTY_FORM);
      } else {
        toast.error(data.error || "Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error("Employer registration error:", error);
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
              Register your company
            </h1>
            <p className="text-gray-600 dark:text-slate-200 text-base leading-relaxed max-w-xl mx-auto font-light">
              Tell us about your organization and we'll get in touch to set up hiring access on SMAART Institute.
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
                  Registration received
                </h3>
                <p className="text-gray-600 dark:text-slate-200 mb-10 max-w-sm mx-auto text-lg leading-relaxed font-light">
                  Our team will reach out to you shortly to complete your employer account.
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
                      placeholder="Acme Corporation" required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="website" className={LABEL_CLASS}>Website</Label>
                    <Input id="website" name="website" value={formData.website} onChange={handleChange}
                      placeholder="https://acme.com" className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="contactName" className={LABEL_CLASS}>Contact Person</Label>
                    <Input id="contactName" name="contactName" value={formData.contactName} onChange={handleChange}
                      placeholder="Jane Doe" required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="designation" className={LABEL_CLASS}>Designation</Label>
                    <Input id="designation" name="designation" value={formData.designation} onChange={handleChange}
                      placeholder="HR Manager" className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="email" className={LABEL_CLASS}>Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                      placeholder="jane@acme.com" required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone" className={LABEL_CLASS}>Phone</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      placeholder="+91-0000000000" required className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="industry" className={LABEL_CLASS}>Industry</Label>
                    <Input id="industry" name="industry" value={formData.industry} onChange={handleChange}
                      placeholder="Software" className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="companySize" className={LABEL_CLASS}>Company Size</Label>
                    <Input id="companySize" name="companySize" value={formData.companySize} onChange={handleChange}
                      placeholder="50-200" className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="city" className={LABEL_CLASS}>City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange}
                      placeholder="Chennai" className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className={LABEL_CLASS}>What are you hiring for?</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange}
                    placeholder="Tell us about the roles you're looking to fill..."
                    className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 min-h-[120px] rounded-xl px-4 py-3 resize-none" />
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
                        Register Company
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
