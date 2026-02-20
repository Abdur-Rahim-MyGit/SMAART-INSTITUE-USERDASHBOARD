import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Show after a small delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-[#002147]/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-white font-bold mb-2">We value your privacy</h4>
                        <p className="text-sm text-gray-300">
                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                            By clicking "Accept All", you consent to our use of cookies.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={acceptCookies}
                            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
                        >
                            Preferences
                        </Button>
                        <Button
                            onClick={acceptCookies}
                            className="bg-[#1a3884] hover:bg-[#132c6b] text-white"
                        >
                            Accept All
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white sm:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;


