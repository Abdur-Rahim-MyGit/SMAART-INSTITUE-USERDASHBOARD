import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCall } from '@/services/api';
import useUser from '@/hooks/useUser';

const CollegeBanners = () => {
  const { user } = useUser();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      console.log('[CollegeBanners] User data:', user);
      // Both user.college and user.collegeId are checked just in case
      const collegeId = user?.college?._id || user?.college || user?.collegeId;
      console.log('[CollegeBanners] College ID:', collegeId);
      if (!collegeId) {
        console.log('[CollegeBanners] No college ID found, skipping banner fetch');
        setLoading(false);
        return;
      }

      try {
        console.log('[CollegeBanners] Fetching banners for college:', collegeId);
        const response = await apiCall(`/colleges/${collegeId}/banners`);
        console.log('[CollegeBanners] Banners response:', response);
        if (response?.success && response.data?.length > 0) {
          setBanners(response.data);
          console.log('[CollegeBanners] Banners loaded:', response.data.length);
        } else {
          console.log('[CollegeBanners] No banners found');
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl mb-4 shadow-sm group bg-white dark:bg-[#002147] border border-[#C0C0C0] dark:border-white/8"
      >
        <div className="relative aspect-[24/8] sm:aspect-[36/9] lg:aspect-[48/9] w-full bg-slate-100 dark:bg-[#002A5C]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {banners[currentIndex].resourceType === "video" ? (
                <video
                  src={banners[currentIndex].image}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={banners[currentIndex].image}
                  alt="College Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 lg:p-8">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-sm sm:text-lg md:text-2xl font-bold font-sans max-w-4xl leading-snug drop-shadow-md pr-4 sm:pr-12"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/80'
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
