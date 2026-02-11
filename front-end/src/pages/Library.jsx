import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, BookOpen, Bookmark, ArrowRight, Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { toast } from "sonner";

const Library = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Books" },
    { id: "business", label: "Business" },
    { id: "psychology", label: "Psychology" },
    { id: "technology", label: "Technology" }
  ];

  // Default initial search
  useEffect(() => {
    fetchBooks("success");
  }, []);

  const fetchBooks = async (query) => {
    setLoading(true);
    try {
      // Use Google Books API
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=12&key=`);
      const data = await res.json();

      if (data.items) {
        const formatted = data.items.map(item => ({
          id: item.id,
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors?.[0] || "Unknown Author",
          category: item.volumeInfo.categories?.[0] || "General",
          rating: item.volumeInfo.averageRating || 4.5,
          image: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || "https://placehold.co/400x600?text=No+Cover",
          description: item.volumeInfo.description,
          link: item.volumeInfo.previewLink
        }));
        setBooks(formatted);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load library resources");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    fetchBooks(searchTerm);
  };

  const filteredBooks = category === "all"
    ? books
    : books.filter(book => book.category.toLowerCase().includes(category));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar />
      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

        <main className="container mx-auto px-4 md:px-6 py-8">
<<<<<<< HEAD
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-display font-bold text-slate-800 dark:text-white mb-2"
            >
              Knowledge Library
            </motion.h1>
            <p className="text-slate-600 dark:text-slate-400">Unlock a curated repository of knowledge. Explore essential books and articles tailored to accelerate your growth.</p>
          </div>
=======
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-white mb-2">
              Library
            </h1>
            <p className="text-gray-600 dark:text-slate-400">Explore and manage your learning resources</p>
          </motion.div>
>>>>>>> origin/main

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
<<<<<<< HEAD
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or topic..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </form>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${category === cat.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                >
                  {cat.label}
                </button>
=======
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-gray-700 dark:text-slate-300 text-sm sm:text-base"
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">Recently Added</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + item * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl md:text-4xl">📄</span>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Resource {item}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Learning material</p>
                  </div>
                </motion.div>
>>>>>>> origin/main
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredBooks.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="aspect-[2/3] overflow-hidden bg-slate-100 relative">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <a
                          href={book.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-white/20 backdrop-blur-md text-white py-2 rounded-lg font-medium text-center hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                        >
                          Preview <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {book.category}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          {book.rating}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {book.title}
                      </h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No books found</h3>
              <p className="text-slate-500">Try adjusting your search terms</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Library;
