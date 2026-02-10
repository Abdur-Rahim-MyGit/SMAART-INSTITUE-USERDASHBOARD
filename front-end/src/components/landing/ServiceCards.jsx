import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Brain, BookOpen, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServiceCard = ({ service, index }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl p-8 overflow-hidden flex flex-col transition-all duration-300
                 bg-white/80 dark:bg-[#002147]/40 backdrop-blur-md border border-gray-200 dark:border-white/10 hover:border-[#daa520]/50 dark:hover:border-[#daa520]/50 hover:shadow-2xl hover:bg-white dark:hover:bg-[#002147]/60"
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(26, 56, 132, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a3884] to-[#0d2150] flex items-center justify-center mb-8 shadow-lg shadow-[#1a3884]/20 group-hover:scale-110 transition-transform duration-300 text-white border border-[#daa520]/20`}>
          {service.icon}
        </div>

        <h3 className="text-2xl font-bold mb-4 text-[#1a3884] dark:text-white group-hover:text-[#daa520] transition-colors">
          {service.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed flex-grow">
          {service.description}
        </p>

        <ul className="space-y-4 mb-8 border-t border-gray-200 dark:border-white/10 pt-6">
          {service.features.map((feature) => (
            <li key={feature} className="flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-[#daa520] mr-3 shadow-[0_0_8px_#daa520]" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          onClick={() => {
            const element = document.getElementById('contact');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full justify-between bg-gray-50 dark:bg-white/5 text-[#1a3884] dark:text-white hover:bg-[#1a3884] hover:text-white border border-gray-200 dark:border-white/10 hover:border-[#daa520] transition-all duration-300 group/btn h-12 text-base font-medium backdrop-blur-sm"
        >
          Learn More
          <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};

const ServiceCards = () => {
  const services = [
    {
      id: "work-ready",
      title: "Work-Ready & Adaptive Capability",
      description: "We develop capabilities that enable employability, career progression, and sustained career longevity — supporting individuals from entry into work through growth and transition.",
      icon: <Brain className="w-6 h-6" />,
      features: ["Employability", "Career Progression", "Sustained Longevity"]
    },
    {
      id: "impact-oriented",
      title: "Impact-Oriented Capability",
      description: "We develop capabilities for innovation, entrepreneurship, and sustainable value creation — enabling individuals and institutions to create enduring economic and societal impact.",
      icon: <BookOpen className="w-6 h-6" />,
      features: ["Innovation", "Entrepreneurship", "Value Creation"]
    },
    {
      id: "career-architecture",
      title: "SMAART Career Architecture Map™",
      description: "A modern reference model for careers, framing them as a multi-stage continuum rather than a single transition, reflecting longer careers and technological change.",
      icon: <Dumbbell className="w-6 h-6" />,
      features: ["Multi-stage Continuum", "Technological Change", "Repeated Transitions"]
    }
  ];

  return (
    <section id="services" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#00152e] relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]"></div>
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#1a3884]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#daa520]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-1 rounded-full border border-[#daa520]/30 bg-[#1a3884]/5 text-[#1a3884] text-sm font-semibold tracking-wide"
          >
            OUR FOCUS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a3884] dark:text-white tracking-tight font-heading leading-tight"
          >
            Building Capability for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#daa520] dark:from-blue-300 dark:via-white dark:to-yellow-300">Changing World of Work</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-200 leading-relaxed font-light"
          >
            We develop capabilities that enable employability, career progression, and sustained career longevity.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCards;
