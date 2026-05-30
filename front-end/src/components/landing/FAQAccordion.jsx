import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

const FAQAccordion = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: t("landing.faq.q1"),
      answer: t("landing.faq.a1")
    },
    {
      question: t("landing.faq.q2"),
      answer: t("landing.faq.a2")
    },
    {
      question: t("landing.faq.q3"),
      answer: t("landing.faq.a3")
    },
    {
      question: t("landing.faq.q4"),
      answer: t("landing.faq.a4")
    }
  ];

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white dark:bg-[#001835] relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1a3884]/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading tracking-tight"
          >
            {t("landing.faq.title")}{" "}
            <span className="text-[#C0C0C0]">{t("landing.faq.title_highlight")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-200 font-light"
          >
            {t("landing.faq.subtitle")}
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${activeIndex === index
                ? "bg-white dark:bg-[#1a3884]/20 border-[#C0C0C0]/50 shadow-lg shadow-[#1a3884]/10 backdrop-blur-md"
                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#C0C0C0]/30 hover:bg-white dark:hover:bg-white/10"
                }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none group"
              >
                <span className={`text-lg font-semibold pr-8 transition-colors duration-300 ${activeIndex === index ? "text-[#1a3884] dark:text-[#C0C0C0]" : "text-[#002147] dark:text-white group-hover:text-[#1a3884] dark:group-hover:text-[#C0C0C0]"
                  }`}>
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${activeIndex === index
                  ? 'bg-[#1a3884] text-white border-[#1a3884] rotate-180'
                  : 'bg-white dark:bg-white/10 text-gray-400 dark:text-slate-200 border-gray-200 dark:border-white/20 group-hover:border-[#C0C0C0] group-hover:text-[#C0C0C0]'
                  }`}>
                  {activeIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-gray-600 dark:text-slate-200 leading-relaxed border-t border-gray-100 dark:border-white/10 pt-4 font-light">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
