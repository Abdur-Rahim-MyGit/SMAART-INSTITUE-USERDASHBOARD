import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Building2, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

import { apiCall } from "@/services/api";

const InstitutionSelector = ({ onSelect }) => {
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();

  // Fetch colleges from colleges collection
  const fetchColleges = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = search
        ? `/colleges?search=${encodeURIComponent(search)}&limit=20`
        : `/colleges?limit=20`;

      const data = await apiCall(endpoint);

      if (data.success) {
        setColleges(data.data || []);
      } else {
        setError(data.error || 'Failed to load institutions');
        setColleges([]);
      }
    } catch (err) {
      console.error('Fetch colleges detail error:', err);
      setError(err.message || 'Unable to load institutions. Please check your connection.');
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial colleges - REMOVED per user request to only show on search
  // useEffect(() => {
  //   fetchColleges();
  // }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchColleges(searchTerm);
        setFocusedIndex(-1); // Reset focus when search results change
      } else {
        setColleges([]); // Clear results if search is empty
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setOpen(true);
    if (e.target.value === "") {
      setSelectedInstitution(null);
      setColleges([]);
    }
  };

  const handleSelect = (institution) => {
    setSelectedInstitution(institution);
    setSearchTerm(institution.name);
    setOpen(false);

    sessionStorage.setItem("selectedInstitution", JSON.stringify({
      name: institution.name,
      code: institution.code,
      studentCount: institution.studentCount,
      location: institution.location
    }));

    if (onSelect) {
      onSelect(institution);
    } else {
      navigate(`/institution/${encodeURIComponent(institution.name)}`);
    }
  };

  const handleRetry = () => {
    fetchColleges(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (!open || colleges.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev < colleges.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < colleges.length) {
        const college = colleges[focusedIndex];
        handleSelect({
          name: college.collegeName,
          code: college.collegeCode,
          studentCount: 0,
          location: college.address
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="w-full relative"
    >
      <div className="relative z-50">

        {/* Ambient background glow for the selector area */}
        <div className="absolute -inset-4 bg-[#30919D]/5 dark:bg-[#30919D]/10 rounded-[2rem] blur-2xl pointer-events-none -z-10" />

        {/* Results List - Above Input with premium styling */}
        <AnimatePresence>
          {open && colleges.length > 0 && searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="mb-3 bg-white/90 dark:bg-[#001c3d]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
            >
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 mb-1">Matching Institutions</p>
                <div className="space-y-1">
                  {colleges.map((college, index) => (
                    <motion.div
                      key={`${college.collegeName}-${index}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect({
                          name: college.collegeName,
                          code: college.collegeCode,
                          studentCount: 0,
                          location: college.address
                        });
                      }}
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-4 p-3 cursor-pointer rounded-xl transition-all duration-200 group border ${index === focusedIndex
                        ? "bg-[#30919D]/10 border-[#30919D]/20 shadow-sm"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-inner ${index === focusedIndex ? "bg-[#30919D] text-white" : "bg-gray-100 dark:bg-white/5 text-[#30919D]"
                        }`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#002147] dark:text-white truncate group-hover:text-[#30919D] transition-colors text-sm sm:text-base">
                          {college.collegeName}
                        </div>
                        {college.address && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {college.address.city}, {college.address.state}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading/Error States */}
        {open && searchTerm && (loading || error || (colleges.length === 0 && !loading)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-3 bg-white/80 dark:bg-[#001c3d]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-5 text-center"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-6 w-6 text-[#30919D] animate-spin" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Searching global database...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <p className="text-sm text-red-500 font-medium">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-xs font-bold text-[#002147] dark:text-white transition-colors border border-gray-200 dark:border-white/10"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Building2 className="h-6 w-6 text-gray-300 dark:text-gray-600 mb-1" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No partner institution found.</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Verify the name and try again</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Input Wrapper */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#30919D] to-[#daa520] rounded-2xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-500" />

          <div className="relative flex items-center">
            <div className="absolute left-4 z-20 pointer-events-none">
              <Search className={`h-5 w-5 transition-colors duration-300 ${searchTerm ? 'text-[#30919D]' : 'text-gray-400'}`} />
            </div>

            <Input
              type="text"
              placeholder="Search your University or College..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="w-full h-14 sm:h-16 pl-12 pr-12 text-base sm:text-lg bg-white/80 dark:bg-[#002147]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-[#002147] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#30919D] focus:ring-4 focus:ring-[#30919D]/10 rounded-2xl font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300"
            />

            {loading && (
              <div className="absolute right-4 z-20">
                <div className="w-5 h-5 border-2 border-[#30919D]/30 border-t-[#30919D] rounded-full animate-spin" />
              </div>
            )}

            {searchTerm && !loading && (
              <button
                onClick={() => { setSearchTerm(""); setColleges([]); }}
                className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                title="Clear search"
              >
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                  <span className="text-[10px]">&times;</span>
                </div>
              </button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default InstitutionSelector;
