import { motion } from "framer-motion";
import { LineChart, BrainCircuit, Trophy, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

// FeaturePoint Component with enhanced styling
const FeaturePoint = ({ icon: Icon, title, desc }) => (
    <motion.div 
        whileHover={{ x: 5, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex gap-4 group cursor-pointer"
    >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1a3884]/10 dark:bg-white/5 flex items-center justify-center border border-[#1a3884]/20 dark:border-white/10 group-hover:bg-[#1a3884] dark:group-hover:bg-[#C0C0C0] transition-colors duration-300">
            <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ type: "spring" }}>
                <Icon className="w-6 h-6 text-[#1a3884] dark:text-[#C0C0C0] group-hover:text-white dark:group-hover:text-[#002147] transition-colors duration-300" />
            </motion.div>
        </div>
        <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#1a3884] dark:group-hover:text-[#C0C0C0] transition-colors">{title}</h4>
            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

const FeatureDeepDive = () => {
    const { t } = useTranslation();

    return (
        <section className="py-24 bg-gray-50 dark:bg-[#000F24] overflow-hidden transition-colors duration-500">
            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 space-y-32">

                {/* Feature Block 1: Campus to Career */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a3884]/20 to-transparent blur-3xl rounded-full" />
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#001835]/80 aspect-video group">
                            {/* Visual Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#001226]/50 backdrop-blur-sm">
                                <div className="text-center p-6 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/5">
                                    <BrainCircuit className="w-12 h-12 text-[#1a3884] dark:text-[#C0C0C0] mx-auto mb-3 opacity-50" />
                                    <span className="text-gray-500 dark:text-slate-300 font-mono text-xs uppercase tracking-widest block whitespace-pre-line text-center">
                                        {t("landing.deep_dive.analysis_view")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Floating Element */}
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: -2 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="absolute -bottom-6 -right-6 bg-white dark:bg-[#001c3d] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl max-w-xs backdrop-blur-md cursor-pointer z-10"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                    {t("landing.deep_dive.analysis_live")}
                                </span>
                            </div>
                            <div className="h-1.5 w-32 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                <div className="h-full w-[75%] bg-[#1a3884] dark:bg-[#C0C0C0]" />
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="text-[#1a3884] dark:text-[#C0C0C0] font-bold tracking-wider text-sm uppercase">
                                {t("landing.deep_dive.section1_badge")}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-[#1a3884] dark:text-white mt-2 mb-4">
                                {t("landing.deep_dive.section1_title")}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-slate-200 leading-relaxed font-light">
                                {t("landing.deep_dive.section1_desc")}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={BrainCircuit}
                                title={t("landing.deep_dive.point1_title")}
                                desc={t("landing.deep_dive.point1_desc")}
                            />
                            <FeaturePoint
                                icon={Target}
                                title={t("landing.deep_dive.point2_title")}
                                desc={t("landing.deep_dive.point2_desc")}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Feature Block 2: Career to Life (Reversed) */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 space-y-8"
                    >
                        <div>
                            <span className="text-[#C0C0C0] font-bold tracking-wider text-sm uppercase">
                                {t("landing.deep_dive.section2_badge")}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-[#1a3884] dark:text-white mt-2 mb-4">
                                {t("landing.deep_dive.section2_title")}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-slate-200 leading-relaxed font-light">
                                {t("landing.deep_dive.section2_desc")}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={LineChart}
                                title={t("landing.deep_dive.point3_title")}
                                desc={t("landing.deep_dive.point3_desc")}
                            />
                            <FeaturePoint
                                icon={Trophy}
                                title={t("landing.deep_dive.point4_title")}
                                desc={t("landing.deep_dive.point4_desc")}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tl from-[#C0C0C0]/20 to-transparent blur-3xl rounded-full" />
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#001835]/80 aspect-video group">
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#001226]/50 backdrop-blur-sm">
                                <div className="text-center p-6 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/5">
                                    <Trophy className="w-12 h-12 text-[#C0C0C0] mx-auto mb-3 opacity-50" />
                                    <span className="text-gray-500 dark:text-slate-300 font-mono text-xs uppercase tracking-widest block whitespace-pre-line text-center">
                                        {t("landing.deep_dive.analytics_view")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default FeatureDeepDive;
