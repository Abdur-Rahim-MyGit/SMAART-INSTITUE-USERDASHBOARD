import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const Counter = ({ value }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 3000 });
  const rounded = useTransform(springValue, (latest) => Math.floor(latest));

  // Extract number and suffix
  const numberMatch = value.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0]) : 0;
  const suffix = value.replace(/\d+/, '');

  useEffect(() => {
    if (isInView) {
      motionValue.set(number);
    }
  }, [isInView, motionValue, number]);

  return (
    <span ref={ref} className="inline-flex">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

const TrustStats = () => {
  const stats = [
    { label: "Partner Institutions", value: "50+" },
    { label: "Students Assessed", value: "10000+" },
    { label: "Placement Rate", value: "92%" },
    { label: "Corporate Partners", value: "100+" },
  ];

  return (
    <section className="py-20 relative overflow-hidden z-20">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-32 bg-[#30919D]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full relative z-10 px-6 sm:px-10 md:px-16 lg:px-24">
        <div className="bg-white/80 dark:bg-[#001835]/60 backdrop-blur-md p-8 md:p-12 shadow-2xl border border-gray-200 dark:border-white/10 rounded-3xl max-w-7xl mx-auto transition-colors duration-300">
          <div className="container mx-auto px-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-center group pt-8 md:pt-0 first:pt-0 border-gray-200 dark:border-white/10"
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-[#30919D] transition-colors duration-300 font-heading">
                    <Counter value={stat.value} />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider group-hover:text-[#002147] dark:group-hover:text-white transition-colors">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStats;
