import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Dynamic API URL based on hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    email: "",
    phone: "",
    query: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || "Message sent successfully! We'll be in touch soon.");
        setFormData({ name: "", institution: "", email: "", phone: "", query: "" });
      } else {
        toast.error(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-gray-50/50 dark:bg-[#000F24] relative overflow-hidden scroll-mt-24 transition-colors duration-500">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1a3884]/5 dark:bg-[#1a3884]/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C0C0C0]/5 dark:bg-[#C0C0C0]/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-stretch">

            {/* Left Column: Contact Info */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3884]/10 dark:bg-[#C0C0C0]/10 border border-[#1a3884]/20 dark:border-[#C0C0C0]/20 text-[#1a3884] dark:text-[#C0C0C0] text-xs font-bold uppercase tracking-widest mb-8">
                  Get In Touch
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading leading-tight tracking-tight">
                  Engage with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] via-[#2a4d9e] to-[#C0C0C0] dark:from-blue-300 dark:via-blue-100 dark:to-yellow-300">
                    SMAART Institute
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-slate-200 text-base mb-10 leading-relaxed max-w-md font-light">
                  Ready to transform your institution? Our team is here to guide you through the implementation of SMAART Institute. Let's build something extraordinary together.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: Mail, title: "Email Us", info: "hello@smaartinstitute.org", sub: "Response within 24 hours" },
                    { icon: Phone, title: "Call Us", info: "+91-6383930215", sub: "Mon-Fri from 9am to 6pm" },
                    { icon: MapPin, title: "Visit Us", info: "Nungambakkam, Chennai", sub: "600034, India" }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-center gap-5 p-4 rounded-2xl bg-white dark:bg-[#001835]/80 border border-gray-100 dark:border-white/10 hover:border-[#C0C0C0]/50 dark:hover:border-[#C0C0C0]/50 shadow-sm transition-all duration-300 group backdrop-blur-sm"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center group-hover:bg-[#1a3884] dark:group-hover:bg-[#C0C0C0] group-hover:text-white dark:group-hover:text-[#002147] transition-all duration-300 shadow-inner">
                        <item.icon className="w-5 h-5 text-[#1a3884] dark:text-[#C0C0C0] group-hover:text-white dark:group-hover:text-[#002147] transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-gray-400 dark:text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-0.5">{item.title}</h4>
                        <p className="text-[#002147] dark:text-white font-bold text-base leading-none mb-0.5">{item.info}</p>
                        <p className="text-gray-500 dark:text-slate-300 text-[11px] font-light tracking-wide">{item.sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Form Card */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="h-full"
              >
                <div className="bg-white dark:bg-[#001835]/90 border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden h-full flex flex-col backdrop-blur-xl">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1a3884]/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#C0C0C0]/10 to-transparent pointer-events-none" />

                  {isSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center flex-grow"
                    >
                      <div className="w-24 h-24 bg-[#1a3884]/20 rounded-full flex items-center justify-center mb-8 border border-[#1a3884]/30 shadow-lg shadow-[#1a3884]/20">
                        <CheckCircle className="w-12 h-12 text-[#1a3884] dark:text-[#C0C0C0]" />
                      </div>
                      <h3 className="text-3xl font-bold text-[#002147] dark:text-white mb-4 tracking-tight">Message Received!</h3>
                      <p className="text-gray-600 dark:text-slate-200 mb-10 max-w-sm mx-auto text-lg leading-relaxed font-light">Thank you for reaching out. A specialist from our team will contact you within one business day.</p>
                      <Button onClick={() => setIsSuccess(false)} variant="outline" className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 px-10 py-6 rounded-2xl transition-all duration-300 text-lg font-bold">
                        Send Another Inquiry
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="flex-grow">
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-[#002147] dark:text-white mb-1">Send us a message</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-300 font-light">Tell us about your institution's needs.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="name" className="text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1">Full Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="John Smith"
                              required
                              className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="institution" className="text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1">Institution</Label>
                            <Input
                              id="institution"
                              name="institution"
                              value={formData.institution}
                              onChange={handleChange}
                              placeholder="University of Excellence"
                              className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="email" className="text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="john.smith@edu.com"
                              required
                              className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="phone" className="text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1">Phone Number</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+91-0000000000"
                              className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 h-14 rounded-2xl px-6"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="query" className="text-gray-900 dark:text-slate-200 font-bold text-xs uppercase tracking-widest pl-1">How can we help?</Label>
                          <Textarea
                            id="query"
                            name="query"
                            value={formData.query}
                            onChange={handleChange}
                            placeholder="I'm interested in implementing SMAART Institute for our students..."
                            required
                            className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#C0C0C0] focus:ring-1 focus:ring-[#C0C0C0] transition-all duration-300 min-h-[120px] rounded-xl px-4 py-3 resize-none"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#1a3884] to-[#2a4d9e] hover:from-[#2a4d9e] hover:to-[#1a3884] text-white font-bold py-5 text-lg rounded-xl shadow-xl shadow-[#1a3884]/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group border border-[#C0C0C0] relative overflow-hidden"
                          disabled={isSubmitting}
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative flex items-center">
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                Transmitting Message...
                              </>
                            ) : (
                              <>
                                Send Enquiry
                                <Send className="ml-3 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              </>
                            )}
                          </span>
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;


