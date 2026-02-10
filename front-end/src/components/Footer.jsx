import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Footer = () => {
    const { theme } = useTheme();
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`border-t pt-16 pb-8 transition-colors duration-300 ${theme === 'dark'
            ? 'bg-white border-gray-200 text-slate-900'
            : 'bg-[#1a3884] border-[#daa520]/30 text-gray-300'
            }`}>
            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 border ${theme === 'dark'
                                ? 'bg-[#1a3884] border-[#1a3884]'
                                : 'bg-white/10 group-hover:bg-white/20 border-[#daa520]/50'
                                }`}>
                                <span className={`font-heading font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-white'}`}>S</span>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-lg font-bold tracking-tight leading-none transition-colors ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                                    }`}>
                                    SMAART<span className="text-[#daa520]"> Institute</span>
                                </span>
                                <span className={`text-[10px] uppercase tracking-widest leading-none mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-300'
                                    }`}>
                                    Employability & Impact
                                </span>
                            </div>
                        </Link>
                        <p className={`text-sm leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                            }`}>
                            An Integrated Employability & Impact Ecosystem. Building capability for the changing world of work.
                        </p>
                        <div className="flex gap-4">
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
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${theme === 'dark'
                                            ? 'bg-slate-100 text-slate-600 hover:bg-[#1a3884] hover:text-white border-slate-200'
                                            : 'bg-white/10 text-gray-300 hover:bg-[#daa520] hover:text-[#1a3884] border-white/10'
                                        }`}
                                >
                                    <social.Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className={`font-bold mb-6 transition-colors ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                            }`}>Quick Links</h3>
                        <ul className="space-y-3">
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
                                        className={`text-sm transition-colors flex items-center gap-2 group ${theme === 'dark'
                                                ? 'text-slate-600 hover:text-[#1a3884]'
                                                : 'text-gray-300 hover:text-[#daa520]'
                                            }`}
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#daa520]/50 group-hover:bg-[#daa520] transition-colors" />
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className={`font-bold mb-6 transition-colors ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                            }`}>Legal</h3>
                        <ul className="space-y-3">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Data Protection"].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className={`text-sm transition-colors flex items-center gap-2 group ${theme === 'dark'
                                                ? 'text-slate-600 hover:text-[#1a3884]'
                                                : 'text-gray-300 hover:text-[#daa520]'
                                            }`}
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#daa520]/50 group-hover:bg-[#daa520] transition-colors" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className={`font-bold mb-6 transition-colors ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                            }`}>Contact Us</h3>

                        {/* India Office */}
                        <div className="mb-6">
                            <h4 className="text-[#daa520] font-semibold text-sm mb-3">India</h4>
                            <ul className="space-y-3">
                                <li className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <div className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                                        }`}>SMAART Healthcare</div>
                                    <div>IGreat DigiHealth Private Limited</div>
                                </li>
                                <li className={`flex items-start gap-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <MapPin className="w-5 h-5 text-[#daa520] shrink-0 mt-0.5" />
                                    <span>123-124 Ispahani Centre, Nungambakkam, Chennai 600034, India</span>
                                </li>
                                <li className={`flex items-center gap-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <Phone className="w-5 h-5 text-[#daa520] shrink-0" />
                                    <span>+91-6383930215</span>
                                </li>
                                <li className={`flex items-center gap-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <Mail className="w-5 h-5 text-[#daa520] shrink-0" />
                                    <a href="mailto:hello@smaartinstitute.org" className="hover:text-[#daa520] transition-colors">
                                        hello@smaartinstitute.org
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* UK Office */}
                        <div>
                            <h4 className="text-[#daa520] font-semibold text-sm mb-3">United Kingdom</h4>
                            <ul className="space-y-3">
                                <li className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <div className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#1a3884]' : 'text-white'
                                        }`}>Smart Health Clinics Limited</div>
                                </li>
                                <li className={`flex items-start gap-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <MapPin className="w-5 h-5 text-[#daa520] shrink-0 mt-0.5" />
                                    <span>53 Salisbury Road, London, United Kingdom TW4 7NW</span>
                                </li>
                                <li className={`flex items-center gap-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                                    }`}>
                                    <Mail className="w-5 h-5 text-[#daa520] shrink-0" />
                                    <a href="mailto:hello@smaartinstitute.org" className="hover:text-[#daa520] transition-colors">
                                        hello@smaartinstitute.org
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                        &copy; {currentYear} SMAART Institute. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs">
                        <span>Designed with</span>
                        <span className="text-red-500">♥</span>
                        <span>for Excellence</span>
                    </div>
                </div>
            </div>
        </footer >
    );
};

export default Footer;
