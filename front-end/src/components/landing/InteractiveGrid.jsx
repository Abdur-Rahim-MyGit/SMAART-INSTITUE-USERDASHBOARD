import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useTranslation } from "react-i18next";

const InteractiveGrid = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { t } = useTranslation();

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section 
      className="relative py-24 bg-gray-50 dark:bg-[#000F24] overflow-hidden group border-y border-gray-200 dark:border-white/5 transition-colors duration-500"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-10 pointer-events-none" />
      
      {/* Light mode spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-10 block dark:hidden"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              rgba(26, 56, 132, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Dark mode spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 hidden dark:block z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              rgba(192, 192, 192, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="container mx-auto px-6 relative z-20 pointer-events-none">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3884]/5 dark:bg-white/5 border border-[#1a3884]/20 dark:border-white/10 mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#1a3884] dark:bg-[#C0C0C0] animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-[#1a3884] dark:text-[#C0C0C0]">
              Discover the Platform
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6 font-heading"
          >
            Intelligent Connections <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#132c6b] dark:from-[#C0C0C0] dark:to-white">Across Your Future</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-slate-300 max-w-xl mx-auto font-light leading-relaxed"
          >
            Hover over this section to see the intelligence at work. Our platform continuously analyzes and connects your unique data points to forge new career pathways.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default InteractiveGrid;
