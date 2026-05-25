import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const translations = {
  en: {
    title: "We value your privacy",
    description: "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.",
    preferences: "Preferences",
    acceptAll: "Accept All"
  },
  hi: {
    title: "हम आपकी गोपनीयता का सम्मान करते हैं",
    description: "हम आपके ब्राउज़िंग अनुभव को बेहतर बनाने, व्यक्तिगत सामग्री प्रदर्शित करने और हमारे ट्रैफ़िक का विश्लेषण करने के लिए कुकीज़ का उपयोग करते हैं। \"सभी स्वीकार करें\" पर क्लिक करके, आप कुकीज़ के हमारे उपयोग के लिए सहमति देते हैं।",
    preferences: "प्राथमिकताएं",
    acceptAll: "सभी स्वीकार करें"
  },
  ta: {
    title: "உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்",
    description: "உங்கள் உலாவல் அனுபவத்தை மேம்படுத்தவும், தனிப்பயனாக்கப்பட்ட உள்ளடக்கத்தை வழங்கவும், எங்கள் வருகை புள்ளிவிவரங்களை பகுப்பாய்வு செய்யவும் நாங்கள் குக்கீகளைப் பயன்படுத்துகிறோம்। \"அனைத்தையும் ஏற்றுக்கொள்\" என்பதைக் கிளிக் செய்வதன் மூலம், குக்கீகளைப் பயன்படுத்த ஒப்புக்கொள்கிறீர்கள்.",
    preferences: "முன்னுரிமைகள்",
    acceptAll: "அனைத்தையும் ஏற்றுக்கொள்"
  },
  ur: {
    title: "ہم آپ کی رازداری کی قدر کرتے ہیں",
    description: "ہم آپ کے براؤزنگ کے تجربے کو بہتر بنانے، ذاتی نوعیت کا مواد پیش کرنے اور ہمارے ٹریفک کا تجزیہ کرنے کے لیے کوکیز کا استعمال کرتے ہیں۔ \"تمام قبول کریں\" پر کلک کر کے، آپ کوکیز کے ہمارے استعمال سے اتفاق کرتے ہیں۔",
    preferences: "ترجیحات",
    acceptAll: "تمام قبول کریں"
  },
  fr: {
    title: "Nous respectons votre vie privée",
    description: "Nous utilisons des cookies pour améliorer votre expérience de navigation, vous présenter des contenus personnalisés et analyser notre trafic. En cliquant sur « Tout accepter », vous consentez à notre utilisation des cookies.",
    preferences: "Préférences",
    acceptAll: "Tout accepter"
  }
};

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const currentLang = i18n.language || "en";
    const tDict = translations[currentLang] || translations.en;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-white/95 dark:bg-[#002147]/95 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-white transition-colors"
                        aria-label="Close cookie consent banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-4 pr-0 sm:pr-4">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#1a3884] dark:text-blue-400 shrink-0">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-gray-900 dark:text-white font-bold text-base leading-tight">
                                {tDict.title}
                            </h4>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-normal">
                                {tDict.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end shrink-0">
                        <Button
                            variant="outline"
                            onClick={acceptCookies}
                            className="w-1/2 sm:w-auto h-10 px-5 rounded-xl text-xs md:text-sm font-semibold bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 shadow-sm"
                        >
                            {tDict.preferences}
                        </Button>
                        <Button
                            onClick={acceptCookies}
                            className="w-1/2 sm:w-auto h-10 px-5 rounded-xl text-xs md:text-sm font-semibold bg-[#1a3884] hover:bg-[#132c6b] dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 dark:shadow-blue-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {tDict.acceptAll}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
