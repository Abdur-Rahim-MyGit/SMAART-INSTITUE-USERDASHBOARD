import { motion } from "framer-motion";
import { Trophy, Award, Star, Compass } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import BadgeGallery from "@/components/badges/BadgeGallery";
import useUser from "@/hooks/useUser";

const Badges = () => {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1a3884] rounded-full animate-spin shadow-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">
                    
                    {/* Page Hero Header */}
                    <PageHero
                        badge="Credentials & Trophies"
                        title="My Badges"
                        subtitle="Track your scientific milestones, cognitive assessments, and certified technical achievements in one professional cabinet."
                    />

                    {/* Integrated Badge Gallery & Ecosystem */}
                    <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                        <BadgeGallery 
                            badges={user?.badges || []} 
                            userName={user?.fullName || "Student"} 
                        />
                    </div>

                    {/* Additional info footer card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/30 dark:bg-slate-800/40"
                    >
                        <div className="flex flex-col gap-6 md:flex-row md:items-start">
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#1a3884] to-[#287a84] text-white">
                                <Award className="h-8 w-8" />
                            </div>

                            <div className="flex-1 space-y-4">
                                <h4 className="text-lg font-bold tracking-tight text-[#002147] dark:text-white">Understanding Badges & Micro-Credentials</h4>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Every badge earned at SMAART represents a verified metric of your professional capability. You can share your credentials directly to LinkedIn, Facebook, and Twitter, or download printable micro-credential certificates secured by unique verification IDs and QR codes.
                                </p>
                                <div className="grid gap-6 sm:grid-cols-3 pt-2">
                                    {[
                                        { title: "CAPABILITY", desc: "Awarded for demonstrating core skills and cognitive reasoning capability.", icon: Star, color: "text-amber-500" },
                                        { title: "CAPACITY", desc: "Awarded for course completions and overall subject-matter work readiness.", icon: Trophy, color: "text-yellow-500" },
                                        { title: "LEADERSHIP", desc: "Awarded for exceptional leadership, social execution, and mentor roles.", icon: Compass, color: "text-blue-500" },
                                    ].map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={i} className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                                    <p className="text-xs font-black uppercase tracking-widest text-[#002147] dark:text-slate-200">{item.title}</p>
                                                </div>
                                                <p className="text-xs leading-normal text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </main>
        </div>
    );
};

export default Badges;
