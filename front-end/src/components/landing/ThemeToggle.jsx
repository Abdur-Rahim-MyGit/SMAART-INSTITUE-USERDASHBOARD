import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const checkVisibility = () => {
            // Check for splash screen by specific class
            const splashScreen = document.querySelector('.global-splash-screen');
            // Check for the standard page loader in AnimatedRoutes
            const pageLoader = document.querySelector('.min-h-screen.bg-navy.flex.items-center.justify-center');

            // Only hide if these elements are currently visible/in DOM
            const shouldHide = !!(splashScreen || pageLoader);
            setIsVisible(!shouldHide);
        };

        checkVisibility();
        // Use a slight delay to ensure dynamic elements are in DOM
        const timeout = setTimeout(checkVisibility, 100);

        const observer = new MutationObserver(checkVisibility);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        console.log('Switching theme to:', newTheme);
        setTheme(newTheme);
    };

    if (!isVisible) return null;

    return (
        <motion.button
            onClick={toggleTheme}
            className="fixed top-24 right-6 z-[9999] p-3 rounded-2xl bg-white/80 dark:bg-[#002147]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl hover:shadow-[#30919D]/20 transition-all duration-500 group overflow-hidden"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            aria-label="Toggle theme"
        >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#30919D]/5 to-[#daa520]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
                {theme === 'dark' ? (
                    <Sun className="w-6 h-6 text-yellow-500 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                ) : (
                    <Moon className="w-6 h-6 text-[#002147] group-hover:-rotate-12 transition-transform duration-500 ease-in-out" />
                )}
            </div>
        </motion.button>
    );
};

export default ThemeToggle;
