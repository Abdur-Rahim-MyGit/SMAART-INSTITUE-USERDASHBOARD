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
      location: institution.location,
      logo: institution.logo
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
          location: college.address,
          logo: college.logo
        });
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="w-full max-w-full relative"
    >
      <div className="relative">

        {/* Input Wrapper */}
        <div className="relative group z-20">
          <div className="relative flex items-center">
            <div className="absolute left-4 z-20 pointer-events-none">
              <Search className={`h-5 w-5 transition-colors duration-300 ${searchTerm ? 'text-[#1a3884]' : 'text-slate-400'}`} />
            </div>

            <Input
              type="text"
              placeholder="Search your University or College..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 300)}
              className="w-full h-12 pl-11 pr-11 text-sm bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#1a3884] rounded-xl font-medium shadow-md group-hover:shadow-lg transition-all duration-300"
            />

            {loading && (
              <div className="absolute right-4 z-20">
                <div className="w-5 h-5 border-2 border-[#1a3884]/30 border-t-[#1a3884] rounded-full animate-spin" />
              </div>
            )}

            {searchTerm && !loading && (
              <button
                onClick={() => { setSearchTerm(""); setColleges([]); }}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100">
                  <span className="text-[10px]">&times;</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Results List - Flow below input instead of absolute */}
        <div className="relative">
          <AnimatePresence>
            {open && searchTerm && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="mt-3 z-[100] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar"
              >
                {colleges.length > 0 ? (
                  <div className="p-2 sm:p-3">
                    <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                      Matching Institutions
                    </p>
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
                              location: college.address,
                              logo: college.logo
                            });
                          }}
                          className={`flex items-center gap-2.5 p-2 cursor-pointer rounded-xl transition-all duration-200 group border ${index === focusedIndex
                            ? "bg-[#1a3884]/5 border-[#1a3884]/20 shadow-sm"
                            : "border-transparent hover:bg-gray-50 hover:border-gray-100"
                            }`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border overflow-hidden shrink-0 ${index === focusedIndex ? "bg-[#1a3884] text-white border-[#1a3884]" : "bg-white text-[#1a3884] border-[#1a3884]/10 group-hover:border-[#1a3884]/30"
                            }`}>
                            {college.logo ? (
                              <motion.img 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={college.logo} 
                                alt={college.collegeName}
                                className="w-full h-full object-contain p-1.5"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path><path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"></path><path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"></path></svg>`;
                                }}
                              />
                            ) : (
                              <Building2 className={`h-5 w-5 transition-transform duration-300 ${index === focusedIndex ? "scale-110" : "group-hover:scale-110"}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#112b6b] truncate group-hover:text-[#1a3884] transition-colors text-sm sm:text-base">
                              {college.collegeName}
                            </div>
                            {college.address && (
                              <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1.5 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00a3e0]/30 group-hover:bg-[#00a3e0] transition-colors" />
                                {college.address.city}, {college.address.state}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : loading ? (
                  <div className="p-8 text-center bg-white dark:bg-[#001c3d]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-6 w-6 text-[#1a3884] animate-spin" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Searching...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center bg-white dark:bg-[#001c3d]">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 px-4 py-1.5 bg-[#1a3884] hover:bg-[#1a3884]/90 rounded-full text-xs font-bold text-white transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-[#001c3d]">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-6 w-6 text-gray-300 dark:text-gray-600 mb-1" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No partner institution found.</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Verify the name and try again</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default InstitutionSelector;


