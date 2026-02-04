import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQAccordion = () => {
  const faqs = [
    {
      question: "What is the SMAART Score?",
      answer: "The SMAART Score is a composite metric derived from our T1 Baseline Assessment. It provides a holistic view of a student's capabilities across 6 key career readiness dimensions."
    },
    {
      question: "How do I unlock the Skills Passport?",
      answer: "To unlock your Skills Passport, you need to complete the mandatory T1 Baseline Assessment and finish your personalized learning pathway. Once verified, your passport is automatically generated."
    },
    {
      question: "Is SMAART Minds free for students?",
      answer: "Many features are free for students, including basic assessments. However, full access to advanced coaching, the ICAS Passport, and premium courses may require an institutional subscription."
    },
    {
      question: "How can institutions partner with SMAART Minds?",
      answer: "Institutions can partner with us to provide their students with full access to the platform. We offer tailored plans that include bulk assessment credits, dashboard analytics, and placement support."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white relative overflow-hidden scroll-mt-24 sm:scroll-mt-28">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#30919D]/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading tracking-tight"
          >
            Frequently Asked <span className="text-[#30919D]">Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 font-light"
          >
            Got questions? We've got answers.
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
                ? "bg-white border-[#30919D]/50 shadow-lg shadow-[#30919D]/10 backdrop-blur-md"
                : "bg-gray-50 border-gray-200 hover:border-[#30919D]/30 hover:bg-white"
                }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none group"
              >
                <span className={`text-lg font-semibold pr-8 transition-colors duration-300 ${activeIndex === index ? "text-[#30919D]" : "text-[#002147] group-hover:text-[#30919D]"
                  }`}>
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${activeIndex === index
                  ? 'bg-[#30919D] text-white border-[#30919D] rotate-180'
                  : 'bg-white text-gray-400 border-gray-200 group-hover:border-[#30919D] group-hover:text-[#30919D]'
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
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 font-light">
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
