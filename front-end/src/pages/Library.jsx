import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, BookOpen, Bookmark, ArrowRight, Loader2, Star } from "lucide-react";
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
    fetchBooks("career development");
  }, []);

  /* Fallback content for when API fails or returns no results */
  const FALLBACK_BOOKS = [
    {
      id: "fb1",
      title: "Atomic Habits",
      author: "James Clear",
      category: "Psychology",
      rating: 4.8,
      image: "https://m.media-amazon.com/images/I/81wgcld4wxL.jpg",
      description: "An easy & proven way to build good habits & break bad ones.",
      link: "https://jamesclear.com/atomic-habits"
    },
    {
      id: "fb2",
      title: "Deep Work",
      author: "Cal Newport",
      category: "Productivity",
      rating: 4.6,
      image: "https://m.media-amazon.com/images/I/41-a20c+r9L._SX322_BO1,204,203,200_.jpg",
      description: "Rules for focused success in a distracted world.",
      link: "https://www.calnewport.com/books/deep-work/"
    },
    {
      id: "fb3",
      title: "Mindset",
      author: "Carol S. Dweck",
      category: "Psychology",
      rating: 4.6,
      image: "https://m.media-amazon.com/images/I/71oD1zRxGSL.jpg",
      description: "The new psychology of success.",
      link: "https://www.amazon.com/Mindset-Psychology-Carol-S-Dweck/dp/0345472322"
    },
    {
      id: "fb4",
      title: "Designing Your Life",
      author: "Bill Burnett & Dave Evans",
      category: "Career",
      rating: 4.5,
      image: "https://m.media-amazon.com/images/I/81f5f4iH+4L.jpg",
      description: "How to build a well-lived, joyful life.",
      link: "https://designingyour.life/"
    }
  ];

  const fetchBooks = async (query) => {
    setLoading(true);
    try {
      // Use Google Books API
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=12`);
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
        setBooks(FALLBACK_BOOKS);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Using offline library resources");
      setBooks(FALLBACK_BOOKS);
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
      <main className="container mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-sans font-bold text-slate-800 dark:text-white mb-2"
            >
              Knowledge Library
            </motion.h1>
            <p className="text-slate-600 dark:text-slate-400">Unlock a curated repository of knowledge. Explore essential books and articles tailored to accelerate your growth.</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
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
  );
};

export default Library;

