import { motion, useMotionValue, useTransform } from "framer-motion";
import { FileText, Download, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import whiteLogo from "@/assets/white.png";

const PassportPreview = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-[#002147] transition-colors duration-300 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#1a3884]/5 dark:bg-[#1a3884]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#daa520]/5 dark:bg-[#daa520]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Visual Demo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative w-full max-w-xl perspective-2000"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              x.set(0);
              y.set(0);
            }}
          >
            {/* Passport Card */}
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative bg-white dark:bg-[#001c3d] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 group p-1"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 dark:via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />

              <div className="bg-white dark:bg-[#001c3d] rounded-[calc(1.5rem-4px)] overflow-hidden">
                {/* Header */}
                <div className="p-5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-[#002147] rounded-xl flex items-center justify-center p-1.5 border border-gray-100 dark:border-white/10 shadow-lg">
                      <div className="w-full h-full bg-gradient-to-br from-[#1a3884] to-[#132c6b] rounded-lg flex items-center justify-center">
                        <img src={whiteLogo} alt="Logo" className="w-8 h-8 object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1a3884] dark:text-white text-xl tracking-tight">SMAART Passport</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#daa520] font-black">Capability & Skills Record</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-[#daa520]/10 border border-[#daa520]/30 text-[#b8860b] dark:text-[#daa520] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    VERIFIED
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 text-gray-600 dark:text-gray-300 relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner flex items-center justify-center">
                      <div className="w-10 h-10 text-gray-300 dark:text-gray-600">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-5 w-48 bg-gray-200 dark:bg-white/10 rounded-full" />
                      <div className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.2 }}
                        className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 hover:border-[#daa520]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-[#1a3884]" />
                          <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded-full" />
                        </div>
                        <div className="h-2.5 w-10 rounded-full bg-[#daa520]/30" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10 flex justify-between items-end">
                    <div className="flex gap-2">
                      <div className="h-10 w-10 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10" />
                      <div className="h-10 w-10 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 font-bold">Issued By</p>
                      <p className="font-bold text-[#daa520] text-xl font-heading tracking-tight">SMAART Institute</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decorative stack effect */}
            <div className="absolute -z-10 top-8 -right-8 w-full h-full rounded-3xl transform rotate-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
            <div className="absolute -z-20 top-12 -right-12 w-full h-full rounded-3xl transform rotate-6 bg-gray-50/30 dark:bg-white/2 border border-gray-200/50 dark:border-white/5" />
          </motion.div>

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-[#1a3884] dark:text-white tracking-tight font-heading leading-tight"
            >
              SMAART Capability & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#2a4d9e]">
                Skills Passport™
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg mb-10 leading-relaxed text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto lg:mx-0"
            >
              A verifiable, lifelong record of capability development and progression. It captures not just what you know, but what you can do—providing trusted evidence of your readiness for the future of work.
            </motion.p>
            <ul className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
              {["Verified Capability Profile", "Universal Portability", "Evidence-Based Progression"].map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-5 text-gray-700 dark:text-gray-300"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#daa520]/20 text-[#daa520] shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-[#1a3884] to-[#daa520] hover:from-[#daa520] hover:to-[#1a3884] text-white font-bold px-8 py-5 rounded-2xl shadow-xl shadow-[#1a3884]/20 text-lg transition-all duration-300 group"
              >
                <Download className="mr-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                Get Your Skills Passport
              </Button>
            </motion.div>
          </div>

        </div>
      </div>
    </section >
  );
};

export default PassportPreview;

