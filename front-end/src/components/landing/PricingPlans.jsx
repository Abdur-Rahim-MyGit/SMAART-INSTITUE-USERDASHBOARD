import { motion } from "framer-motion";
import { Check, Zap, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PricingPlans = () => {
    const { t } = useTranslation();

    const plans = [
        {
            name: t("landing.pricing.plan1_title"),
            price: t("landing.pricing.plan1_price"),
            description: t("landing.pricing.plan1_desc"),
            features: t("landing.pricing.plan1_features", { returnObjects: true }) || ["Curriculum Alignment", "Student Employability", "Faculty Development"],
            cta: t("landing.pricing.plan1_cta"),
            highlight: false,
            icon: <User className="w-5 h-5 text-blue-400" />
        },
        {
            name: t("landing.pricing.plan2_title"),
            price: t("landing.pricing.plan2_price"),
            period: "",
            description: t("landing.pricing.plan2_desc"),
            features: t("landing.pricing.plan2_features", { returnObjects: true }) || ["Talent Pipeline", "Workforce Upskilling", "Capability Frameworks", "Recruitment Solutions"],
            cta: t("landing.pricing.plan2_cta"),
            highlight: true,
            icon: <Zap className="w-5 h-5 text-yellow-400" />
        },
        {
            name: t("landing.pricing.plan3_title"),
            price: t("landing.pricing.plan3_price"),
            description: t("landing.pricing.plan3_desc"),
            features: t("landing.pricing.plan3_features", { returnObjects: true }) || ["Large-scale Skilling", "Social Impact", "Economic Development", "Policy Support"],
            cta: t("landing.pricing.plan3_cta"),
            highlight: false,
            icon: <Building2 className="w-5 h-5 text-blue-400" />
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-white dark:bg-[#001835] relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a3884]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading tracking-tight">
                        {t("landing.pricing.title")}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-200">
                        {t("landing.pricing.subtitle")}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 border ${plan.highlight
                                ? "bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border-[#1a3884] dark:border-[#C0C0C0] shadow-[0_0_40px_rgba(26,56,132,0.15)]"
                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#C0C0C0] dark:hover:border-white/20"
                                } backdrop-blur-sm transition-all duration-300 flex flex-col h-full`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a3884] dark:bg-[#C0C0C0] text-white dark:text-[#002147] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg border border-[#C0C0C0] dark:border-white">
                                    {t("landing.pricing.popular")}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-2 rounded-lg ${plan.highlight ? "bg-[#1a3884]/10 text-[#1a3884] dark:text-[#C0C0C0]" : "bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-blue-300"} border border-transparent ${plan.highlight ? "border-[#1a3884]/20 dark:border-[#C0C0C0]/30" : ""}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                                {plan.period && <span className="text-gray-500 dark:text-slate-300 text-sm">{plan.period}</span>}
                            </div>

                            <p className="text-gray-600 dark:text-gray-200 text-sm mb-8 min-h-[40px]">{plan.description}</p>

                            <div className="space-y-4 mb-10 flex-grow">
                                {Array.isArray(plan.features) && plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-white">
                                        <Check className={`w-4 h-4 mt-0.5 ${plan.highlight ? "text-[#C0C0C0]" : "text-blue-400 dark:text-blue-300"}`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto">
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        const element = document.getElementById('contact');
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 ${plan.highlight
                                        ? "bg-[#1a3884] hover:bg-[#0d2150] text-white dark:bg-[#C0C0C0] dark:text-[#002147] dark:hover:bg-[#fbbf24] shadow-lg shadow-[#1a3884]/25 border border-[#C0C0C0]"
                                        : "bg-[#1a3884] hover:bg-[#0d2150] text-white dark:bg-[#C0C0C0] dark:text-[#002147] dark:hover:bg-[#fbbf24] shadow-lg shadow-[#1a3884]/25 border border-[#C0C0C0]"
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingPlans;
