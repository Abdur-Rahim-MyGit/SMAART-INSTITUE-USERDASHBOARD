import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ArrowRight, Loader2, Star, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const FALLBACK_BOOKS = [
  {
    id: "fb1", title: "Atomic Habits", author: "James Clear", category: "Psychology", rating: 4.8,
    image: "https://m.media-amazon.com/images/I/81wgcld4wxL.jpg",
    description: "An easy & proven way to build good habits & break bad ones.",
    link: "https://jamesclear.com/atomic-habits"
  },
  {
    id: "fb2", title: "Deep Work", author: "Cal Newport", category: "Productivity", rating: 4.6,
    image: "https://m.media-amazon.com/images/I/41-a20c+r9L._SX322_BO1,204,203,200_.jpg",
    description: "Rules for focused success in a distracted world.",
    link: "https://www.calnewport.com/books/deep-work/"
  },
  {
    id: "fb3", title: "Mindset", author: "Carol S. Dweck", category: "Psychology", rating: 4.6,
    image: "https://m.media-amazon.com/images/I/71oD1zRxGSL.jpg",
    description: "The new psychology of success.",
    link: "https://www.amazon.com/Mindset-Psychology-Carol-S-Dweck/dp/0345472322"
  },
  {
    id: "fb4", title: "Designing Your Life", author: "Bill Burnett & Dave Evans", category: "Career", rating: 4.5,
    image: "https://m.media-amazon.com/images/I/81f5f4iH+4L.jpg",
    description: "How to build a well-lived, joyful life.",
    link: "https://designingyour.life/"
  },
  {
    id: "fb5", title: "The Lean Startup", author: "Eric Ries", category: "Business", rating: 4.5,
    image: "https://m.media-amazon.com/images/I/81-QB7nDh4L.jpg",
    description: "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
    link: "https://theleanstartup.com/"
  },
  {
    id: "fb6", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Psychology", rating: 4.7,
    image: "https://m.media-amazon.com/images/I/71wvKXWCMBL.jpg",
    description: "A groundbreaking tour of the mind and the two systems that drive the way we think.",
    link: "https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555"
  },
];

const CATEGORIES = [
  { id: "all", label: "All Books" },
  { id: "business", label: "Business" },
  { id: "psychology", label: "Psychology" },
  { id: "technology", label: "Technology" },
  { id: "career", label: "Career" },
];

const Library = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");

  useEffect(() => { fetchBooks("career development"); }, []);

  const fetchBooks = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=12`);
      const data = await res.json();
      if (data.items) {
        setBooks(data.items.map(item => ({
          id: item.id,
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors?.[0] || "Unknown Author",
          category: item.volumeInfo.categories?.[0] || "General",
          rating: item.volumeInfo.averageRating || 4.5,
          image: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") || "https://placehold.co/400x600?text=No+Cover",
          description: item.volumeInfo.description,
          link: item.volumeInfo.previewLink,
        })));
      } else {
        setBooks(FALLBACK_BOOKS);
      }
    } catch {
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
    : books.filter(b => b.category.toLowerCase().includes(category));

  return (
    <div className="min-h-screen bg-[#F5F8FF] dark:bg-[#00152E] pb-12 pt-3 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate("/dashboard/smaart-toolkit")}
          className="group mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/70 transition-all hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-slate-200"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:shadow-md dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          Back to Toolkit
        </motion.button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1a3884]/15 bg-[#eef4ff] px-2.5 py-0.5 dark:border-[#1a3884]/40 dark:bg-[#1a3884]/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1a3884] dark:bg-blue-400" />
            <span className="text-[9.5px] font-black uppercase tracking-[0.22em] text-[#1a3884] dark:text-blue-400">Knowledge Hub</span>
          </div>
          <h1 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
            Knowledge <span className="text-[#1a3884] dark:text-blue-300">Library</span>
          </h1>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Curated books &amp; resources to accelerate your learning and career growth.
          </p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or topic…"
                className="w-full rounded-xl border border-[#d8e6f7] bg-white py-2 pl-11 pr-4 text-[13px] font-medium text-[#0d1f4e] shadow-[0_2px_8px_rgba(26,56,132,0.06)] outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#1a3884] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition-all hover:bg-[#132c6b] active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-all ${
                  category === cat.id
                    ? "bg-[#1a3884] text-white shadow-sm"
                    : "border border-[#d8e6f7] bg-white text-slate-500 hover:border-[#1a3884]/30 hover:text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-slate-400 dark:hover:text-blue-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Book Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-[#d8e6f7] bg-white dark:border-[#1a3884]/20 dark:bg-[#001a3d]" />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <AnimatePresence>
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_8px_rgba(26,56,132,0.05)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(26,56,132,0.13)] hover:-translate-y-0.5 dark:border-[#1a3884]/20 dark:bg-[#001a3d]"
                >
                  {/* Cover */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-[#001630]">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#0d1f4e]/90 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <a
                        href={book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/15 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25"
                      >
                        Preview <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-400 truncate max-w-[80%]">
                        {book.category}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{book.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-[12.5px] font-bold leading-tight text-[#0d1f4e] line-clamp-2 dark:text-white group-hover:text-[#1a3884] dark:group-hover:text-blue-300 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
              <BookOpen className="h-8 w-8 text-[#1a3884] dark:text-blue-400" />
            </div>
            <h3 className="text-[15px] font-bold text-[#0d1f4e] dark:text-white">No books found</h3>
            <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
