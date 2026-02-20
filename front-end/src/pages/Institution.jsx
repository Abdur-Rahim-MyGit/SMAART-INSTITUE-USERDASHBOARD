import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LoginCard from "@/components/LoginCard";
import { Play, ArrowLeft } from "lucide-react";

import videoplayback from "@/assets/videoplayback.mp4";

// Mock video URLs - replaced with local video
const institutionVideos = {
  "1": videoplayback,
  "2": videoplayback,
  "3": videoplayback,
  "4": videoplayback,
};

const Institution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Use the imported video for all IDs for now, or fallback to the specific one if we had distinct videos
  // const videoUrl = videoplayback;
  const videoUrl = "https://player.cloudinary.com/embed/?cloud_name=dlpmrdcqp&public_id=videoplayback_xt7in8";

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#002147] relative overflow-x-hidden transition-colors duration-300">
      <Navbar showLinks={false} />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#1a3884]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gray-100 dark:bg-white/5 blur-[100px]" />
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-[#daa520]/30 rounded-full animate-pulse" />
        <div className="absolute bottom-[30%] right-[20%] w-3 h-3 bg-[#1a3884]/20 rounded-full animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />

        {/* New Dynamic Blobs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#1a3884]/5 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 50, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-[#daa520]/5 rounded-full blur-[60px]"
        />
      </div>

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          {/* Back to Home Link */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 text-gray-400 hover:text-[#1a3884] transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest min-h-[44px] py-2"
            >
              <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden xs:inline">Back to Marketplace</span>
              <span className="xs:hidden">Back</span>
            </button>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center w-full max-w-full overflow-hidden">

            {/* Welcome Section (Video) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group w-full max-w-full overflow-hidden box-border"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1a3884] to-[#daa520] rounded-xl sm:rounded-2xl md:rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white dark:bg-[#00152e] backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={videoUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Institution Login Video"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00152e]/90 via-transparent to-transparent pointer-events-none" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 sm:top-6 sm:left-6 px-2.5 py-1 sm:px-4 sm:py-1.5 bg-[#002147]/80 backdrop-blur-md border border-[#white]/20 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg z-20">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#daa520] animate-pulse shadow-[0_0_10px_rgba(218,165,32,0.5)]" />
                    <span className="text-[10px] sm:text-xs font-bold text-white tracking-wider uppercase">Founder's Message</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8 relative">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 font-heading tracking-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#002147] dark:to-[#4dbdc9]">Excellence</span>
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm md:text-base font-light">
                        Discover a world of opportunities and unlock your true potential with our comprehensive learning ecosystem.
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#1a3884]/10 dark:bg-[#1a3884]/20 flex items-center justify-center border border-[#1a3884]/20 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#1a3884] fill-[#1a3884]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Login Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LoginCard />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Institution;

