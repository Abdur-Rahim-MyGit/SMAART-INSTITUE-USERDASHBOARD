import { motion } from "framer-motion";
import { Check, Zap, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingPlans = () => {
    const plans = [
        {
            name: "Student Basic",
            price: "Free",
            description: "Essential tools for self-discovery and basic career tracking.",
            features: ["Basic EQ Assessment", "3 Career Path Matches", "Limited Resource Access"],
            cta: "Start Free",
            highlight: false,
            icon: <User className="w-5 h-5" />
        },
        {
            name: "Student Pro",
            price: "$12",
            period: "/month",
            description: "Full AI analysis, unlimited learning paths, and certifications.",
            features: ["Advanced AI Career Coach", "Unlimited Course Access", "ICAS Passport Integration", "Priority Support"],
            cta: "Go Pro",
            highlight: true,
            icon: <Zap className="w-5 h-5 text-yellow-400" />
        },
        {
            name: "Institution",
            price: "Custom",
            description: "Enterprise-grade dashboards for colleges and universities.",
            features: ["Bulk Student Management", "Performance Analytics", "Custom Learning Tracks", "API Access"],
            cta: "Contact Sales",
            highlight: false,
            icon: <Building2 className="w-5 h-5" />
        }
    ];

    return (
        <section className="py-24 bg-white dark:bg-[#001835] relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#30919D]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading tracking-tight">Flexible Plans for Everyone</h2>
                    <p className="text-gray-600 dark:text-gray-400">Whether you're an individual learner or a large university, we have a plan to scale with you.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 border ${plan.highlight
                                ? "bg-[#30919D]/10 border-[#30919D] shadow-[0_0_40px_rgba(48,145,157,0.15)]"
                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                } backdrop-blur-sm transition-all duration-300`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#30919D] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-2 rounded-lg ${plan.highlight ? "bg-[#30919D]/20" : "bg-gray-200 dark:bg-white/10"}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                                {plan.period && <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>}
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 min-h-[40px]">{plan.description}</p>

                            <div className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Check className={`w-4 h-4 mt-0.5 ${plan.highlight ? "text-[#30919D]" : "text-gray-400 dark:text-gray-500"}`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.highlight ? "default" : "outline"}
                                className={`w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 ${plan.highlight
                                    ? "bg-[#30919D] hover:bg-[#287a85] text-white shadow-lg shadow-[#30919D]/25"
                                    : "border-gray-200 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                    }`}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingPlans;
