import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 dark:bg-[#00152e] border-t border-gray-200 dark:border-white/10 pt-16 pb-8 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#30919D] to-[#1a5f66] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-[#30919D]/20 transition-all duration-300">
                                <span className="text-white font-heading font-bold text-xl">S</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight leading-none transition-colors">
                                    SMAART<span className="text-[#30919D]">Minds</span>
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mt-1">
                                    Institute
                                </span>
                            </div>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors">
                            Empowering institutions and individuals with data-driven insights and comprehensive learning pathways for a smarter future.
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
                                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#30919D] hover:text-white dark:hover:bg-[#30919D] dark:hover:text-white transition-all duration-300"
                                >
                                    <social.Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-6 transition-colors">Quick Links</h3>
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
                                        className="text-gray-600 dark:text-gray-400 hover:text-[#30919D] dark:hover:text-[#30919D] text-sm transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#30919D]/50 group-hover:bg-[#30919D] transition-colors" />
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-6 transition-colors">Legal</h3>
                        <ul className="space-y-3">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Data Protection"].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className="text-gray-600 dark:text-gray-400 hover:text-[#30919D] dark:hover:text-[#30919D] text-sm transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#30919D]/50 group-hover:bg-[#30919D] transition-colors" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-6 transition-colors">Contact Us</h3>

                        {/* India Office */}
                        <div className="mb-6">
                            <h4 className="text-[#30919D] font-semibold text-sm mb-3">India</h4>
                            <ul className="space-y-3">
                                <li className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">SMAART Healthcare</div>
                                    <div>IGreat DigiHealth Private Limited</div>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <MapPin className="w-5 h-5 text-[#30919D] shrink-0 mt-0.5" />
                                    <span>123-124 Ispahani Centre, Nungambakkam, Chennai 600034, India</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <Phone className="w-5 h-5 text-[#30919D] shrink-0" />
                                    <span>+91-6383930215</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <Mail className="w-5 h-5 text-[#30919D] shrink-0" />
                                    <a href="mailto:hello@smaarthealthcare.com" className="hover:text-[#30919D] transition-colors">
                                        hello@smaarthealthcare.com
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* UK Office */}
                        <div>
                            <h4 className="text-[#30919D] font-semibold text-sm mb-3">United Kingdom</h4>
                            <ul className="space-y-3">
                                <li className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">Smart Health Clinics Limited</div>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <MapPin className="w-5 h-5 text-[#30919D] shrink-0 mt-0.5" />
                                    <span>53 Salisbury Road, London, United Kingdom TW4 7NW</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                    <Mail className="w-5 h-5 text-[#30919D] shrink-0" />
                                    <a href="mailto:hello@smaarthealthcare.com" className="hover:text-[#30919D] transition-colors">
                                        hello@smaarthealthcare.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        &copy; {currentYear} SMAART Healthcare. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-xs">
                        <span>Designed with</span>
                        <span className="text-red-500">♥</span>
                        <span>for Excellence</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
