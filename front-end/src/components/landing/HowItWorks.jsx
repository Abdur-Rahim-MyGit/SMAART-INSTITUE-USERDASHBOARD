import { motion } from "framer-motion";
import { ClipboardCheck, Map, Award, Lock, Unlock, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Skills",
      description: "Applied ability. Ensuring learning translates into real-world application, not just qualification.",
      icon: <ClipboardCheck className="w-8 h-8" />,
    },
    {
      id: 2,
      title: "Judgement",
      description: "Decision quality in real situations. Developing the ability to make effective choices in complex environments.",
      icon: <Map className="w-8 h-8" />,
    },
    {
      id: 3,
      title: "Adaptability",
      description: "Effectiveness as conditions change. Building resilience and flexibility for a restructured world of work.",
      icon: <Award className="w-8 h-8" />,
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-[#002147] relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1a3884] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#daa520] rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[#1a3884] dark:text-white mb-6 tracking-tight font-heading"
          >
            SMAART Integrated <span className="text-[#daa520]">Capability Framework™</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 font-light"
          >
            How capability is built for modern work. Integrating skills, judgement, and adaptability.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-0 w-full h-px bg-gray-200 dark:bg-white/10 z-0">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-transparent via-[#daa520]/50 to-transparent origin-left"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.3, duration: 0.6 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-32 h-32 rounded-3xl bg-gray-50 dark:bg-[#001835]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 flex items-center justify-center mb-8 relative shadow-xl shadow-gray-200/50 dark:shadow-black/20 group-hover:-translate-y-2 transition-transform duration-500 z-10 group-hover:border-[#daa520]/30 group-hover:shadow-[#daa520]/10">
                  <div className="text-[#daa520] group-hover:text-white transition-colors duration-300 transform group-hover:scale-110">
                    {step.icon}
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-[#1a3884] text-white flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white dark:border-[#002147]">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[#1a3884] dark:text-white mb-4 group-hover:text-[#daa520] transition-colors">
                  {step.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs text-lg font-light">
                  {step.description}
                </p>

                {/* Animated Lock State (Decorative) */}
                <div className="mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
                    {index === 0 ? <Unlock className="w-3 h-3 text-[#daa520]" /> : <Lock className="w-3 h-3" />}
                    {index === 0 ? "Unlocked" : "Locked"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
