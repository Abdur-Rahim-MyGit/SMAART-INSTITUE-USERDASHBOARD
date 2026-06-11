import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

const Footer = ({ variant = "full" }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const currentYear = new Date().getFullYear();
    const isDashboard = variant === "dashboard";

    // Define premium styling for both themes
    const footerBg = isDashboard
        ? (theme === 'dark' ? 'bg-[#002147]/60' : 'bg-white/80')
        : (theme === 'dark' ? 'bg-[#000F24]' : 'bg-white');
    const footerText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const headingColor = theme === 'dark' ? 'text-white' : 'text-[#1a3884]';
    const borderColor = theme === 'dark' ? 'border-white/10' : 'border-gray-100';
    const subTextColor = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';

    // Icon styles
    const iconClass = theme === 'dark'
        ? 'bg-white/5 text-gray-400 hover:bg-[#C0C0C0] hover:text-[#000F24]'
        : 'bg-[#1a3884]/5 text-[#1a3884] hover:bg-[#1a3884] hover:text-white';

    // Logo Box styles
    const logoBoxClass = theme === 'dark'
        ? 'bg-[#1a3884] border-[#1a3884]/50 shadow-lg shadow-[#1a3884]/20'
        : 'bg-[#1a3884] text-white border-transparent shadow-lg shadow-[#1a3884]/20';

    return (
        <footer className={`border-t ${isDashboard ? "pt-7 pb-5 mt-6 rounded-xl mx-4 md:mx-8" : "pt-20 pb-10"} transition-colors duration-500 relative ${footerBg} ${borderColor} ${footerText}`}>
            {/* Decorative Top Border */}
            {!isDashboard && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />
            )}

            <div className={`${isDashboard ? "max-w-[1600px] mx-auto px-4 md:px-8" : "container mx-auto px-6 sm:px-10 md:px-16 lg:px-24"}`}>
                <div className={`grid ${isDashboard ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"} ${isDashboard ? "gap-6 mb-5" : "gap-12 mb-16"}`}>
                    {/* Brand Column */}
                    <div className={isDashboard ? "space-y-3" : "space-y-6"}>
                        <Link to={isDashboard ? "/dashboard" : "/"} className={`flex items-center group ${isDashboard ? "gap-2.5" : "gap-3"}`}>
                            <div className={`${isDashboard ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center transition-all duration-300 border ${logoBoxClass}`}>
                                <span className={`font-heading font-bold text-white ${isDashboard ? "text-lg" : "text-2xl"}`}>S</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1">
                                    <span className={`${isDashboard ? "text-base" : "text-xl"} font-black tracking-tighter leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-[#1a3884]'}`}>
                                        SMAART
                                    </span>
                                    <div className={`rounded-full bg-[#C0C0C0] ${isDashboard ? "w-1 h-1" : "w-1.5 h-1.5"}`} />
                                </div>
                                <span className={`${isDashboard ? "text-[9px] tracking-[0.25em] mt-0.5" : "text-[10px] tracking-[0.3em] mt-1"} font-bold uppercase leading-none transition-colors ${subTextColor}`}>
                                    {t("landing.navbar.enquiry") === "Enquiry" ? "Institute" : t("landing.navbar.enquiry") === "Demande" ? "Institut" : t("landing.navbar.enquiry") === "पूछताछ" ? "संस्थान" : t("landing.navbar.enquiry") === "விசாரணை" ? "நிறுவனம்" : "ادارہ"}
                                </span>
                            </div>
                        </Link>
                        <p className={`${isDashboard ? "text-xs leading-relaxed max-w-sm" : "text-sm leading-relaxed max-w-xs"} font-light`}>
                            {t("landing.footer.desc") || "An Integrated Employability & Impact Ecosystem. Building capability for the changing world of work."}
                        </p>
                        <div className={isDashboard ? "flex gap-2" : "flex gap-3"}>
                            {[
                                { Icon: Facebook, url: "https://facebook.com/smaartminds" },
                                { Icon: Twitter, url: "https://twitter.com/smaartminds" },
                                { Icon: Linkedin, url: "https://linkedin.com/company/smaartminds" },
                                { Icon: Instagram, url: "https://instagram.com/smaartminds" }
                            ].map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${isDashboard ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl"} flex items-center justify-center transition-all duration-300 border border-transparent ${iconClass}`}
                                >
                                    <social.Icon className={isDashboard ? "w-4 h-4" : "w-5 h-5"} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {!isDashboard && (
                        <>
                            {/* Quick Links */}
                            <div>
                                <h3 className={`font-bold text-lg mb-8 ${headingColor}`}>
                                    {t("landing.footer.links_title") || "Quick Links"}
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { name: t("landing.navbar.services") || "Services", id: "services" },
                                        { name: t("landing.navbar.how_it_works") || "How It Works", id: "how-it-works" },
                                        { name: t("landing.navbar.testimonials") || "Testimonials", id: "testimonials" },
                                        { name: t("landing.navbar.faq") || "FAQ", id: "faq" },
                                        { name: t("landing.navbar.contact") || "Contact", id: "contact" }
                                    ].map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => {
                                                    const element = document.getElementById(item.id);
                                                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className={`text-sm transition-colors flex items-center gap-3 group font-medium hover:text-[#C0C0C0]`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#C0C0C0]/50 group-hover:bg-[#C0C0C0]' : 'bg-[#1a3884]/30 group-hover:bg-[#C0C0C0]'}`} />
                                                {item.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h3 className={`font-bold text-lg mb-8 ${headingColor}`}>
                                    {t("landing.footer.legal_title") || "Legal"}
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { name: t("landing.footer.privacy_policy") || "Privacy Policy", key: "privacy-policy" },
                                        { name: t("landing.footer.terms_of_service") || "Terms of Service", key: "terms-of-service" },
                                        { name: t("landing.footer.cookie_policy") || "Cookie Policy", key: "cookie-policy" },
                                        { name: t("landing.footer.data_protection") || "Data Protection", key: "data-protection" }
                                    ].map((item) => (
                                        <li key={item.key}>
                                            <Link
                                                to={`/legal?tab=${item.key}`}
                                                className={`text-sm transition-colors flex items-center gap-3 group font-medium hover:text-[#C0C0C0]`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#C0C0C0]/50 group-hover:bg-[#C0C0C0]' : 'bg-[#1a3884]/30 group-hover:bg-[#C0C0C0]'}`} />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Contact Info */}
                    <div className={isDashboard ? "sm:pl-4" : ""}>
                        <h3 className={`font-bold ${isDashboard ? "text-sm mb-3" : "text-lg mb-8"} ${headingColor}`}>
                            {t("landing.footer.contact_title") || "Contact Us"}
                        </h3>
                        <ul className={isDashboard ? "space-y-2.5" : "space-y-6"}>
                            <li className={`flex items-start ${isDashboard ? "gap-2.5" : "gap-4"}`}>
                                <MapPin className={`text-[#C0C0C0] shrink-0 mt-0.5 ${isDashboard ? "w-4 h-4" : "w-5 h-5"}`} />
                                <span className={`${isDashboard ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}>
                                    {t("landing.footer.visit_text") || "Nungambakkam, Chennai 600034, India"}
                                </span>
                            </li>
                            <li className={`flex items-center ${isDashboard ? "gap-2.5" : "gap-4"}`}>
                                <Mail className={`text-[#C0C0C0] shrink-0 ${isDashboard ? "w-4 h-4" : "w-5 h-5"}`} />
                                <a href="mailto:hello@smaartinstitute.org" className={`${isDashboard ? "text-xs" : "text-sm"} hover:text-[#C0C0C0] transition-colors`}>hello@smaartinstitute.org</a>
                            </li>
                            <li className={`flex items-center ${isDashboard ? "gap-2.5" : "gap-4"}`}>
                                <Phone className={`text-[#C0C0C0] shrink-0 ${isDashboard ? "w-4 h-4" : "w-5 h-5"}`} />
                                <a href="tel:+916383930215" className={`${isDashboard ? "text-xs" : "text-sm"} hover:text-[#C0C0C0] transition-colors`}>+91-6383930215</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={`${isDashboard ? "pt-4 mt-2" : "pt-8"} border-t flex flex-col sm:flex-row items-center justify-between ${isDashboard ? "gap-2" : "gap-4"} ${borderColor}`}>
                    <p className={`${isDashboard ? "text-[11px]" : "text-xs"} ${subTextColor}`}>
                        &copy; {currentYear} SMAART Institute. {t("landing.footer.copyright") || "All rights reserved."}
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className={`${isDashboard ? "text-[11px] gap-1.5" : "text-xs gap-2"} font-semibold flex items-center transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#1a3884] hover:text-[#C0C0C0]'}`}
                    >
                        {t("landing.footer.back_to_top") || "Back to Top"} <ArrowUp className={isDashboard ? "w-3 h-3" : "w-3 h-3"} />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
