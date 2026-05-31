import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const IntegrationMarquee = () => {
    const { t } = useTranslation();
    const partners = [
        { name: "ICAS", color: "#C0C0C0" },
        { name: "University of Oxford", color: "#ffffff" },
        { name: "Cambridge Assessment", color: "#ffffff" },
        { name: "Pearson", color: "#ffffff" },
        { name: "Harvard Education", color: "#ffffff" },
        { name: "Stanford AI Lab", color: "#ffffff" },
        { name: "MIT Media Lab", color: "#ffffff" },
        { name: "Coursera", color: "#0056D2" },
    ];

    return (
        <section className="py-10 bg-[#001226] overflow-hidden border-y border-white/5 relative z-20">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#001226] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#001226] to-transparent z-10 pointer-events-none" />

            <p className="text-center text-sm font-semibold text-white uppercase tracking-widest mb-8">
                {t("landing.marquee.trusted_by")}
            </p>

            <div className="flex relative items-center">
                {/* Gradient Masks for smooth fade */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#001226] to-transparent z-20" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#001226] to-transparent z-20" />

                <motion.div
                    className="flex gap-16 items-center whitespace-nowrap"
                    animate={{ x: "-100%" }}
                    transition={{
                        repeat: Infinity,
                        duration: 40,
                        ease: "linear",
                    }}
                >
                    {[...partners, ...partners].map((partner, index) => (
                        <div
                            key={index}
                            className="text-2xl font-bold opacity-100 hover:opacity-100 transition-opacity duration-300 font-sans"
                            style={{ color: partner.color === '#ffffff' ? '#ffffff' : partner.color }}
                        >
                            {partner.name}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default IntegrationMarquee;
