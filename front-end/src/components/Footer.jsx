import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Footer = () => {
    const { theme } = useTheme();
    const currentYear = new Date().getFullYear();

    // Define premium styling for both themes
    const footerBg = theme === 'dark' ? 'bg-[#000F24]' : 'bg-white';
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
        <footer className={`border-t pt-20 pb-10 transition-colors duration-500 relative ${footerBg} ${borderColor} ${footerText}`}>
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${logoBoxClass}`}>
                                <span className="font-heading font-bold text-2xl text-white">S</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1">
                                    <span className={`text-xl font-black tracking-tighter leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-[#1a3884]'}`}>
                                        SMAART
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] leading-none mt-1 transition-colors ${subTextColor}`}>
                                    Institute
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm leading-relaxed max-w-xs font-light">
                            An Integrated Employability & Impact Ecosystem. Building capability for the changing world of work.
                        </p>
                        <div className="flex gap-3">
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
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-transparent ${iconClass}`}
                                >
                                    <social.Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className={`font-bold text-lg mb-8 ${headingColor}`}>Quick Links</h3>
                        <ul className="space-y-4">
                            {[
                                { name: "Services", id: "services" },
                                { name: "How It Works", id: "how-it-works" },
                                { name: "Testimonials", id: "testimonials" },
                                { name: "FAQ", id: "faq" },
                                { name: "Contact", id: "contact" }
                            ].map((item) => (
                                <li key={item.name}>
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
                        <h3 className={`font-bold text-lg mb-8 ${headingColor}`}>Legal</h3>
                        <ul className="space-y-4">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Data Protection"].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className={`text-sm transition-colors flex items-center gap-3 group font-medium hover:text-[#C0C0C0]`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#C0C0C0]/50 group-hover:bg-[#C0C0C0]' : 'bg-[#1a3884]/30 group-hover:bg-[#C0C0C0]'}`} />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className={`font-bold text-lg mb-8 ${headingColor}`}>Contact Us</h3>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <MapPin className="w-5 h-5 text-[#C0C0C0] shrink-0 mt-0.5" />
                                <span className="text-sm leading-relaxed">Nungambakkam, Chennai<br />600034, India</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Mail className="w-5 h-5 text-[#C0C0C0] shrink-0" />
                                <a href="mailto:hello@smaartinstitute.org" className="text-sm hover:text-[#C0C0C0] transition-colors">hello@smaartinstitute.org</a>
                            </li>
                            <li className="flex items-center gap-4">
                                <Phone className="w-5 h-5 text-[#C0C0C0] shrink-0" />
                                <a href="tel:+916383930215" className="text-sm hover:text-[#C0C0C0] transition-colors">+91-6383930215</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${borderColor}`}>
                    <p className={`text-xs ${subTextColor}`}>
                        &copy; {currentYear} SMAART Institute. All rights reserved.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className={`text-xs font-semibold flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#1a3884] hover:text-[#C0C0C0]'}`}
                    >
                        Back to Top <ArrowUp className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

