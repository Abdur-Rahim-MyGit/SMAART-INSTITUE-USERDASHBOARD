import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LoginCard from "@/components/LoginCard";
import { Play } from "lucide-react";

const videoUrl = "https://player.cloudinary.com/embed/?cloud_name=dlpmrdcqp&public_id=videoplayback_xt7in8";

const Institution = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-300"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #eef1f8 40%, #f7f8fa 100%)" }}
    >
      {/* Subtle background crest watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute right-[-5%] top-[8%] w-[520px] h-[520px] opacity-[0.045]"
          style={{
            backgroundImage: "url('/smaart-crest.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            filter: "grayscale(1)",
          }}
        />
        {/* Soft radial glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-50 opacity-50 blur-[100px]" />
      </div>

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
        <div className="w-full max-w-6xl mx-auto">

          {/* Two-column grid */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center">

            {/* LEFT: Video + Welcome Section */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-0"
            >
              {/* Outer Card — sharp corners, white bg, strong shadow */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(26,56,132,0.14)",
                  boxShadow: "0 24px 64px rgba(26,56,132,0.13), 0 4px 20px rgba(0,0,0,0.07)",
                }}
              >
                {/* Navy blue border-frame around the video */}
                <div
                  className="relative"
                  style={{
                    background: "#0d2257",
                    padding: "10px",
                  }}
                >
                  {/* Founder's Message Badge */}
                  <div
                    className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3.5 py-1.5"
                    style={{
                      background: "rgba(0, 21, 46, 0.88)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(192,192,192,0.35)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C0C0C0] animate-pulse shadow-[0_0_8px_rgba(192,192,192,0.7)]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-white tracking-widest uppercase">
                      Founder's Message
                    </span>
                  </div>

                  {/* Video embed — inset inside the navy frame */}
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={videoUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title="Founder's Message"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00152e]/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Welcome text below */}
                <div
                  className="px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between gap-4"
                  style={{ background: "#ffffff", borderTop: "2px solid #0d2257" }}
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight leading-snug">
                      Welcome to{" "}
                      <span
                        className="font-extrabold"
                        style={{
                          background: "linear-gradient(90deg, #1a3884 0%, #2a5ad4 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Excellence
                      </span>
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                      Discover a world of opportunities and unlock your true
                      potential with our comprehensive learning ecosystem.
                    </p>
                  </div>
                  {/* Play button */}
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #e8eef8 0%, #d4ddf5 100%)",
                      border: "1.5px solid rgba(26,56,132,0.20)",
                      boxShadow: "0 2px 12px rgba(26,56,132,0.12)",
                    }}
                  >
                    <Play className="w-4 h-4 text-[#1a3884] fill-[#1a3884] ml-0.5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Login Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
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
