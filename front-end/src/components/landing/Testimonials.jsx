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
    <section id="testimonials" className="py-24 bg-gray-50 dark:bg-[#002147] relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a3884]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight font-heading"
          >
            Impact & <span className="text-[#daa520]">Values</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            Guided by the SMAART Values Framework
          </motion.p>
        </div>

        <div
          className="max-w-4xl mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative bg-white dark:bg-[#001835]/80 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl min-h-[300px] flex items-center transition-colors duration-300">
            {/* Decorative Quote Icon */}
            <div className="absolute top-6 left-6 text-gray-200 dark:text-white/5">
              <Quote className="w-16 h-16 rotate-180" />
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
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
                  <div className="flex-shrink-0 relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10">
                      <img
                        src={testimonials[currentIndex].image}
                        alt={testimonials[currentIndex].author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#1a3884] text-white p-1.5 rounded-full shadow-lg border border-white">
                      <Quote className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <div className="flex justify-center md:justify-start gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-[#daa520] fill-[#daa520]" />
                      ))}
                    </div>

                    <p className="text-lg md:text-2xl font-medium italic mb-6 leading-relaxed text-gray-700 dark:text-gray-200 font-heading">
                      "{testimonials[currentIndex].quote}"
                    </p>

                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {testimonials[currentIndex].author}
                      </h4>
                      <p className="text-[#daa520] font-medium text-sm uppercase tracking-wide">
                        {testimonials[currentIndex].role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="absolute bottom-8 right-8 flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={prev}
                className="rounded-full w-12 h-12 text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1a3884] dark:hover:bg-[#1a3884] border border-gray-200 dark:border-white/10 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                className="rounded-full w-12 h-12 text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1a3884] dark:hover:bg-[#1a3884] border border-gray-200 dark:border-white/10 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-12 bg-[#daa520]" : "w-3 bg-gray-300 dark:bg-white/10 hover:bg-gray-400 dark:hover:bg-white/30"
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
