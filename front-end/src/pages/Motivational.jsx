import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Star, Quote } from "lucide-react";

const Motivational = () => {
    const navigate = useNavigate();

    const quotes = [
        {
            text: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt"
        },
        {
            text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
            author: "Malcolm X"
        },
        {
            text: "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.",
            author: "Albert Schweitzer"
        }
    ];

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden selection:bg-teal/30 text-white font-sans">
            {/* Abstract Background Elements matching HeroSection */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-teal/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-navy-light blur-[100px]" />
            </div>

            <div className="max-w-5xl w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="inline-block p-4 rounded-full bg-teal/10 mb-6 border border-teal/20 shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-pulse-slow">
                        <Rocket className="w-12 h-12 text-teal" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Ready for <span className="text-teal">Takeoff!</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                        You've taken the first step towards unlocking your full potential. Your personalized learning journey awaits.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {quotes.map((quote, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (index * 0.1) }}
                            className="bg-navy-light/20 backdrop-blur-xl p-6 rounded-2xl shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden group hover:border-teal/30 hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                            <Quote className="absolute top-4 right-4 w-8 h-8 text-teal/20 group-hover:text-teal/40 transition-colors duration-300" />
                            <p className="text-white/80 italic mb-4 relative z-10 text-base leading-relaxed">"{quote.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-1 bg-teal/50 rounded-full" />
                                <p className="text-teal font-semibold text-xs relative z-10 uppercase tracking-wider">{quote.author}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                >
                    <Button
                        onClick={() => navigate("/dashboard")}
                        className="h-14 px-10 text-lg bg-teal hover:bg-teal-600 text-white shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:shadow-[0_0_50px_rgba(20,184,166,0.6)] hover:scale-105 transition-all duration-300 rounded-xl font-bold group"
                    >
                        <Star className="w-6 h-6 mr-2 fill-current group-hover:rotate-180 transition-transform duration-500" />
                        Start Your Journey Here!
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default Motivational;
