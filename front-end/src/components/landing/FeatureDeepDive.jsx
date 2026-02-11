import { motion } from "framer-motion";
import { LineChart, BrainCircuit, Trophy, Target } from "lucide-react";

const FeaturePoint = ({ icon: Icon, title, desc }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1a3884]/10 flex items-center justify-center border border-[#1a3884]/20">
            <Icon className="w-6 h-6 text-[#1a3884]" />
        </div>
        <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

const FeatureDeepDive = () => {
    return (
        <section className="py-24 bg-gray-50 dark:bg-[#002147] overflow-hidden transition-colors duration-300">
            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 space-y-32">

                {/* Feature Block 1: The Emotion Couch */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a3884]/20 to-transparent blur-3xl rounded-full" />
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#001835]/80 aspect-video group">
                            {/* Placeholder for real screenshot */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#001226]">
                                <span className="text-gray-500 dark:text-gray-600 font-mono text-xs uppercase tracking-widest border border-gray-300 dark:border-gray-700 px-4 py-2 rounded">
                                    UI Screenshot Placeholder
                                </span>
                            </div>
                        </div>
                        {/* Floating Element */}
                        <div className="absolute -bottom-6 -right-6 bg-white dark:bg-[#002147] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl max-w-xs">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-bold text-gray-900 dark:text-white">Live AI Analysis</span>
                            </div>
                            <div className="h-1.5 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full w-[75%] bg-[#1a3884]" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="text-[#1a3884] font-bold tracking-wider text-sm uppercase">Professional & Technical Capability™</span>
                            <h3 className="text-3xl md:text-4xl font-bold text-[#1a3884] dark:text-white mt-2 mb-4">Campus to Career™</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Preparing learners for entry into the workforce and aligning their capability with professional practice. We bridge the gap between academic theory and workplace reality.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={BrainCircuit}
                                title="Practice-Aligned Learning"
                                desc="Real-world simulations and industry-standard tools that mirror the actual work environment."
                            />
                            <FeaturePoint
                                icon={Target}
                                title="Employability Focus"
                                desc="Direct pathways to meaningful early-career roles with verified capability evidence."
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Feature Block 2: Skill Analytics (Reversed) */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 space-y-8"
                    >
                        <div>
                            <span className="text-[#daa520] font-bold tracking-wider text-sm uppercase">Innovation & Impact Capability™</span>
                            <h3 className="text-3xl md:text-4xl font-bold text-[#1a3884] dark:text-white mt-2 mb-4">Career to Life™</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Supporting long-term progression, leadership transition, and the ability to create value through innovation. For those ready to shape the future.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={LineChart}
                                title="Leadership Transition"
                                desc="Moving from individual contributor to strategic leader with advanced decision-making skills."
                            />
                            <FeaturePoint
                                icon={Trophy}
                                title="Value Creation"
                                desc="Entrepreneurial skills and innovation frameworks for the new economy."
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tl from-[#daa520]/20 to-transparent blur-3xl rounded-full" />
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#001835]/80 aspect-video group">
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#001226]">
                                <span className="text-gray-500 dark:text-gray-600 font-mono text-xs uppercase tracking-widest border border-gray-300 dark:border-gray-700 px-4 py-2 rounded">
                                    Analytics Dashboard Placeholder
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default FeatureDeepDive;
