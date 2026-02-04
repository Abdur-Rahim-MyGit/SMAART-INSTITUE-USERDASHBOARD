import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

const Library = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const libraryCategories = [
    {
      id: 1,
      title: "Your Saved Library",
      description: "Access your personal collection",
      color: "from-amber-700 to-amber-900",
      icon: "📚",
      count: "24 items"
    },
    {
      id: 2,
      title: "Mindful Practices",
      description: "Meditation and wellness resources",
      color: "from-rose-600 to-rose-800",
      icon: "🧘",
      count: "18 items"
    },
    {
      id: 3,
      title: "Library of Things",
      description: "Tools and resources collection",
      color: "from-[#30919D] to-[#002147]",
      icon: "🔧",
      count: "42 items"
    },
    {
      id: 4,
      title: "Library Bag",
      description: "Quick access favorites",
      color: "from-emerald-600 to-emerald-800",
      icon: "🎒",
      count: "15 items"
    }
  ];

  return (
    <div className="min-h-screen">
      <DashboardSidebar />

      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

        <main className="container mx-auto px-4 md:px-6 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Library
            </h1>
            <p className="text-gray-600">Explore and manage your learning resources</p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm sm:text-base"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filter
            </motion.button>
          </motion.div>

          {/* Library Categories Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {libraryCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.1 }}
                whileHover={{ y: -8, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="group cursor-pointer"
              >
                {/* Card Container */}
                <div className={`relative h-56 sm:h-64 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${category.color}`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-pattern"></div>
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 text-white">
                    {/* Icon */}
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 group-hover:translate-x-2 transition-transform duration-300">
                        {category.title}
                      </h3>
                      <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold bg-white/20 px-2.5 sm:px-3 py-1 rounded-full">
                          {category.count}
                        </span>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="text-white/70 group-hover:text-white transition-colors text-lg sm:text-xl"
                        >
                          →
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Overlay on Hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-gray-800 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                      Explore
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10 md:mt-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Recently Added</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + item * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl md:text-4xl">📄</span>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-sm sm:text-base">Resource {item}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Learning material</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Library;
