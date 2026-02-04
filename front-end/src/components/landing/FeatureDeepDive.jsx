import { motion } from "framer-motion";
import { LineChart, BrainCircuit, Trophy, Target } from "lucide-react";

const FeaturePoint = ({ icon: Icon, title, desc }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#30919D]/10 flex items-center justify-center border border-[#30919D]/20">
            <Icon className="w-6 h-6 text-[#30919D]" />
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
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#30919D]/20 to-transparent blur-3xl rounded-full" />
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
                                <div className="h-full w-[75%] bg-[#30919D]" />
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
                            <span className="text-[#30919D] font-bold tracking-wider text-sm uppercase">Emotional Intelligence</span>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">Master Your Mind with The Emotion Couch</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Beyond IQ, success requires EQ. Our AI therapist helps students navigate stress, build resilience, and develop the soft skills top employers demand.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={BrainCircuit}
                                title="Real-time Mood Analysis"
                                desc="Advanced sentiment tracking that adapts coaching advice based on your current emotional state."
                            />
                            <FeaturePoint
                                icon={Target}
                                title="Conflict Resolution Scenarios"
                                desc="Interactive roleplay scenarios to practice leadership and empathy in a safe environment."
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
                            <span className="text-[#daa520] font-bold tracking-wider text-sm uppercase">Data-Driven Growth</span>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">Precision Career Mapping</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Stop guessing. Our deep learning algorithms analyze your performance across 50+ markers to recommend the perfect career trajectory.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={LineChart}
                                title="Skill Gap Visualization"
                                desc="See exactly what skills you're missing for your dream job and get instant course recommendations."
                            />
                            <FeaturePoint
                                icon={Trophy}
                                title="Verified Achievement Badges"
                                desc="Earn blockchain-verified micro-credentials recognized by our global partner network."
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
