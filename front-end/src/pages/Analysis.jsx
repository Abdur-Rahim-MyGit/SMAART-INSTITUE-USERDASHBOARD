import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, CheckCircle, BarChart2, BrainCircuit } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

const Analysis = () => {
    const navigate = useNavigate();

    const handleDownload = () => {
        // Mock download functionality
        const element = document.createElement("a");
        const file = new Blob(["Student Analysis Report\n\nCompatibility: High\nRecommended Roles: Software Engineer, Data Scientist"], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = "analysis_report.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="h-screen flex flex-col bg-navy relative overflow-hidden selection:bg-teal/30 text-white font-sans">
            <DashboardSidebar />
            <div className="flex-1 overflow-y-auto transition-all duration-300">
                <DashboardHeader />
                
                {/* Abstract Background Elements matching HeroSection */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-teal/5 blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-navy-light blur-[100px]" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10 pt-12 pb-12 px-4">
                    <div className="text-center mb-12">
                        <p className="text-white/60 text-lg max-w-2xl mx-auto font-light tracking-wide">
                            Based on your profile and academic history, we've generated a comprehensive analysis of your potential career paths.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Compatibility Score Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-navy-light/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden group hover:border-teal/30 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center border border-teal/20 group-hover:scale-110 transition-transform duration-300">
                                    <BarChart2 className="w-6 h-6 text-teal" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Role Compatibility</h2>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-white/80">Software Engineering</span>
                                        <span className="text-teal font-bold">92%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "92%" }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full bg-teal shadow-[0_0_10px_rgba(26,56,132,0.5)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-white/80">Data Science</span>
                                        <span className="text-teal font-bold">85%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "85%" }}
                                            transition={{ duration: 1, delay: 0.7 }}
                                            className="h-full bg-teal shadow-[0_0_10px_rgba(26,56,132,0.5)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-white/80">Product Management</span>
                                        <span className="text-teal font-bold">78%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "78%" }}
                                            transition={{ duration: 1, delay: 0.9 }}
                                            className="h-full bg-teal shadow-[0_0_10px_rgba(26,56,132,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Suggestions Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-navy-light/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden group hover:border-teal/30 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <BrainCircuit className="w-6 h-6 text-amber-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Key Suggestions</h2>
                            </div>

                            <ul className="space-y-4 relative z-10">
                                <li className="flex gap-3 items-start">
                                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                                    <p className="text-white/60 text-sm leading-relaxed">Focus on advanced algorithms and data structures to boost your engineering profile.</p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                                    <p className="text-white/60 text-sm leading-relaxed">Consider taking a certification in Cloud Computing (AWS/Azure) to expand your skillset.</p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                                    <p className="text-white/60 text-sm leading-relaxed">Participate in hackathons to gain practical experience and network with peers.</p>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="h-12 px-8 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 hover:border-white/20 backdrop-blur-md rounded-xl text-lg font-medium transition-all duration-300"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                        </Button>

                        <Button
                            onClick={() => navigate("/motivational")}
                            className="h-12 px-8 bg-teal hover:bg-teal-600 text-white font-bold shadow-lg hover:shadow-teal/20 transition-all duration-300 rounded-xl text-lg"
                        >
                            Continue Journey
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
