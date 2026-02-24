import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      quote: "Impact is measured by capability and progression, not just activity. We look at the whole system.",
      author: "Systems Thinking",
      role: "Core Value",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&q=80"
    },
    {
      id: 2,
      quote: "Focus on real-world outcomes that improve lives and economies. Evidence is our currency.",
      author: "Measurable Impact",
      role: "Core Value",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&q=80"
    },
    {
      id: 3,
      quote: "Preparing for the restructured world of work requires constant evolution and flexibility.",
      author: "Adaptability",
      role: "Core Value",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&q=80"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-[#000F24] relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 transition-colors duration-500">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1a3884]/5 dark:bg-[#daa520]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight font-heading"
          >
            Impact & <span className="text-[#daa520]">Values</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-gray-600 dark:text-gray-300"
          >
            Guided by the SMAART Values Framework
          </motion.p>
        </div>

        <div
          className="max-w-3xl mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative bg-white dark:bg-[#001835]/90 border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl min-h-[220px] flex items-center transition-colors duration-300 backdrop-blur-sm">
            {/* Decorative Quote Icon */}
            <div className="absolute top-4 left-4 text-gray-100 dark:text-white/5">
              <Quote className="w-12 h-12 rotate-180" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full relative z-10"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0 relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white dark:border-[#002147] shadow-lg relative z-10">
                      <img
                        src={testimonials[currentIndex].image}
                        alt={testimonials[currentIndex].author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <div className="flex justify-center md:justify-start gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 text-[#daa520] fill-[#daa520]" />
                      ))}
                    </div>

                    <p className="text-base md:text-lg font-medium italic mb-4 leading-relaxed text-gray-700 dark:text-gray-200 font-heading">
                      "{testimonials[currentIndex].quote}"
                    </p>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                        {testimonials[currentIndex].author}
                      </h4>
                      <p className="text-[#daa520] font-medium text-xs uppercase tracking-wide">
                        {testimonials[currentIndex].role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons - More compact */}
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={prev}
                className="rounded-full w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-[#1a3884] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                className="rounded-full w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-[#1a3884] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-[#daa520]" : "w-2 bg-gray-300 dark:bg-white/10 hover:bg-gray-400 dark:hover:bg-white/30"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
