import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Trash2, Sparkles, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VisionBoardWidget = () => {
  const [visionData, setVisionData] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadVisionBoard();
  }, []);

  const loadVisionBoard = () => {
    const saved = localStorage.getItem('myVision');
    if (saved) {
      try {
        setVisionData(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load vision board:', error);
      }
    }
  };

  const handleEdit = () => {
    navigate('/vision-board-pro/gallery');
  };

  const handleChange = () => {
    navigate('/vision-board-pro/gallery');
  };

  const handleRemove = () => {
    localStorage.removeItem('myVision');
    setVisionData(null);
    setShowRemoveConfirm(false);
    toast({
      title: "Vision Removed",
      description: "Your vision board has been removed from the dashboard.",
    });
  };

  // Curated Daily Inspirations (Gradients & Quotes)
  const dailyInspirations = [
    {
      id: 1,
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      theme: "from-blue-900 via-indigo-900 to-purple-900", // Deep Space
      icon: Sparkles,
      accent: "text-purple-400"
    },
    {
      id: 2,
      quote: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
      theme: "from-emerald-900 via-teal-900 to-cyan-900", // Ocean Depths
      icon: Star,
      accent: "text-teal-400"
    },
    {
      id: 3,
      quote: "Your time is limited, don't waste it living someone else's life.",
      author: "Steve Jobs",
      theme: "from-orange-900 via-amber-900 to-red-900", // Sunset Glow
      icon: Eye,
      accent: "text-amber-400"
    },
    {
      id: 4,
      quote: "Everything you’ve ever wanted is on the other side of fear.",
      author: "George Addair",
      theme: "from-slate-900 via-gray-900 to-zinc-900", // Urban Night
      icon: ArrowRight,
      accent: "text-white"
    },
    {
      id: 5,
      quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      theme: "from-indigo-900 via-blue-900 to-cyan-900", // Deep Blue
      icon: Star,
      accent: "text-blue-400"
    },
    {
      id: 6,
      quote: "Happiness is not something ready made. It comes from your own actions.",
      author: "Dalai Lama",
      theme: "from-pink-900 via-rose-900 to-red-900", // Passion
      icon: Sparkles,
      accent: "text-pink-400"
    },
     {
      id: 7,
      quote: "Limit your 'always' and your 'nevers'.",
      author: "Amy Poehler",
      theme: "from-violet-900 via-fuchsia-900 to-purple-900", // Creative
      icon: Eye,
      accent: "text-fuchsia-400"
    }
  ];

  // Get daily inspiration based on day of year
  const getDailyInspiration = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dailyInspirations[dayOfYear % dailyInspirations.length];
  };

  const dailyInspiration = getDailyInspiration();

  // Daily Inspiration State (Smart Empty State)
  if (!visionData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${dailyInspiration.theme} border border-white/10 shadow-2xl`}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center justify-center min-h-[220px]">
          
          {/* Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-white tracking-wider uppercase">Daily Inspiration</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto">
             <dailyInspiration.icon className={`w-10 h-10 mb-4 ${dailyInspiration.accent} opacity-80`} />
             <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 italic tracking-wide leading-relaxed">
              "{dailyInspiration.quote}"
            </h3>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-8">
              — {dailyInspiration.author}
            </p>
          </div>

          <Button
            onClick={() => navigate('/vision-board-pro/gallery')}
            className="group relative overflow-hidden rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10 flex items-center gap-2 px-4 py-1">
              <Star className="w-4 h-4 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
              Set Your Personal Vision
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </div>
      </motion.div>
    );
  }

  // Active Vision Board Display
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-effect rounded-xl overflow-hidden border-2 border-[#daa520]/30 shadow-[0_0_30px_rgba(218,165,32,0.2)]"
      >
        {/* Active Vision Badge */}
        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#daa520] to-[#FFD700] text-[#002147] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3" />
          Active Vision
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button
            size="sm"
            onClick={handleChange}
            className="bg-white/90 hover:bg-white text-[#002147] shadow-lg backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            Change
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowRemoveConfirm(true)}
            className="bg-red-500/90 hover:bg-red-600 text-white shadow-lg backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Vision Board Image */}
        <div className="relative aspect-video sm:aspect-[21/9] bg-gradient-to-br from-[#002147] to-[#001a38]">
          {visionData.image ? (
            <img
              src={visionData.image}
              alt={visionData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-[#30919D]/30" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/90 via-[#002147]/40 to-transparent" />

          {/* Motivational Quote */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {visionData.title}
              </h3>
              <p className="text-[#daa520] text-sm sm:text-base font-medium drop-shadow-md">
                {visionData.quote || "Chase your dreams"}
              </p>
              <p className="text-white/60 text-xs mt-2">
                Set on {new Date(visionData.setAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRemoveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#001a38] rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#30919D]/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-white">
                Remove Vision Board?
              </h3>
              <p className="text-center mb-6 text-gray-300">
                Are you sure you want to remove "{visionData.title}" from your dashboard? 
                You can set it again anytime from the gallery.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#30919D]/50 text-white hover:bg-[#30919D]/20"
                  onClick={() => setShowRemoveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisionBoardWidget;
