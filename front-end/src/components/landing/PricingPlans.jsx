import { motion } from "framer-motion";
import { Check, Zap, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingPlans = () => {
    const plans = [
        {
            name: "Universities & Colleges",
            price: "Academic",
            description: "Partner with us to enhance student employability and align curriculum with industry needs.",
            features: ["Curriculum Alignment", "Student Employability", "Faculty Development"],
            cta: "Partner With Us",
            highlight: false,
            icon: <User className="w-5 h-5 text-blue-400" />
        },
        {
            name: "Employers & Workforce",
            price: "Industry",
            period: "",
            description: "Access a pipeline of work-ready talent and upskill your existing workforce.",
            features: ["Talent Pipeline", "Workforce Upskilling", "Capability Frameworks", "Recruitment Solutions"],
            cta: "Hire Talent",
            highlight: true,
            icon: <Zap className="w-5 h-5 text-yellow-400" />
        },
        {
            name: "Government & CSR",
            price: "Impact",
            description: "Collaborate on large-scale skilling initiatives to drive social and economic impact.",
            features: ["Large-scale Skilling", "Social Impact", "Economic Development", "Policy Support"],
            cta: "Collaborate",
            highlight: false,
            icon: <Building2 className="w-5 h-5 text-blue-400" />
        }
    ];

    return (
        <section className="py-24 bg-white dark:bg-[#001835] relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a3884]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading tracking-tight">Partnerships</h2>
                    <p className="text-gray-600 dark:text-gray-200">We form long-term, institutional partnerships to drive ecosystem-wide impact.</p>
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
                                    Most Popular
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
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-white">
                                        <Check className={`w-4 h-4 mt-0.5 ${plan.highlight ? "text-[#C0C0C0]" : "text-blue-400 dark:text-blue-300"}`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto">
                                <Button
                                    variant="default"
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

