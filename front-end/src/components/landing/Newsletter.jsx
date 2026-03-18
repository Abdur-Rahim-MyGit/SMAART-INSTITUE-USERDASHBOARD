import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Newsletter = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setEmail("");
        toast.always("Subscribed!", { description: "You've been added to our insider list." });
    };

    return (
        <section className="py-20 bg-[#002147] border-t border-white/5">
            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#001835] to-[#001226] rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">

                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a3884]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C0C0C0]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                Stay Ahead of the Curve
                            </h3>
                            <p className="text-gray-400">
                                Get exclusive Future of Work insights, career trends, and capability building strategies delivered to your inbox.
                            </p>
                        </div>

                        <div className="w-full md:w-auto min-w-[320px]">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C0C0C0]/50 focus:ring-[#C0C0C0]/20 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#C0C0C0] hover:bg-[#A8A8A8] text-[#1a3884] font-bold"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Subscribe Now
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-gray-600">
                                    No spam, unsubscribe anytime.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;

