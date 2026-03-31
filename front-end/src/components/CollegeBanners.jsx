import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { apiCall } from '@/services/api';
import useUser from '@/hooks/useUser';

const CollegeBanners = () => {
  const { user } = useUser();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      // Both user.college and user.collegeId are checked just in case
      const collegeId = user?.college?._id || user?.college || user?.collegeId;
      if (!collegeId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiCall(`/colleges/${collegeId}/banners`);
        if (response?.success && response.data?.length > 0) {
          setBanners(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch college banners", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [user]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isMinimized) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] w-72 sm:w-80 shadow-2xl rounded-none overflow-hidden bg-white dark:bg-slate-900 border border-[#C0C0C0] dark:border-slate-800"
        >
          <div 
            className="relative aspect-[21/9] w-full bg-slate-100 dark:bg-slate-800 group cursor-pointer" 
            onClick={() => setIsMinimized(false)}
          >
            <img
              src={banners[currentIndex].image}
              alt="College Banner Thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
               <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md transform group-hover:scale-110 duration-200" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
               <p className="text-white text-[11px] sm:text-xs font-bold truncate drop-shadow-md">
                 {banners[currentIndex].message}
               </p>
            </div>
            
            <button 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
               className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition backdrop-blur-sm z-10"
               title="Maximize Banner"
            >
               <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-none mb-4 shadow-sm group bg-white dark:bg-slate-900 border border-[#C0C0C0] dark:border-slate-800"
      >
        <button 
           onClick={() => setIsMinimized(true)}
           className="absolute top-3 right-3 z-[60] w-9 h-9 rounded-none bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
           title="Minimize to Corner"
        >
           <Minimize2 className="w-4.5 h-4.5" />
        </button>

        <div className="relative aspect-[21/9] sm:aspect-[32/9] lg:aspect-[40/9] w-full bg-slate-100 dark:bg-slate-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={banners[currentIndex].image}
                alt="College Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 lg:p-8">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-lg sm:text-2xl font-bold font-sans max-w-4xl leading-snug drop-shadow-md pr-12"
                >
                  {banners[currentIndex].message}
                </motion.h2>
              </div>
            </motion.div>
          </AnimatePresence>

          {banners.length > 1 && (
            <>
              <button
                onClick={prevBanner}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-none bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-none bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-none transition-all duration-300 ${
                      idx === currentIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CollegeBanners;
