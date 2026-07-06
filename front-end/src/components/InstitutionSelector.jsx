import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Building2, AlertCircle, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

import { apiCall } from "@/services/api";

const InstitutionSelector = ({ onSelect, onPreviewChange }) => {
  const { t } = useTranslation();
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
        setError(data.error || t('institution_select.error_load_failed', 'Failed to load institutions'));
        setColleges([]);
      }
    } catch (err) {
      console.error('Fetch colleges detail error:', err);
      setError(err.message || t('institution_select.error_unavailable', 'Unable to load institutions. Please check your connection.'));
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial colleges - REMOVED per user request to only show on search
  // useEffect(() => {
  //   fetchColleges();
  // }, []);

  const [selectingId, setSelectingId] = useState(null);

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

  // Update preview when focus or results change
  useEffect(() => {
    if (onPreviewChange) {
      if (focusedIndex >= 0 && focusedIndex < colleges.length) {
        onPreviewChange(colleges[focusedIndex]);
      } else if (searchTerm === "" || colleges.length === 0) {
        onPreviewChange(null);
      }
    }
  }, [focusedIndex, colleges, searchTerm, onPreviewChange]);

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
    setSelectingId(institution.code);
    setSelectedInstitution(institution);
    setSearchTerm(institution.name);
    
    // Delay slightly to let the user see the success animation
    setTimeout(() => {
      setOpen(false);
      setSelectingId(null);

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
    }, 600);
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
            <div className="absolute left-5 z-20 pointer-events-none">
              <Search className={`h-5 w-5 transition-colors duration-300 ${open || searchTerm ? 'text-[#1a3884] dark:text-[#00a3e0]' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>

            <Input
              type="text"
              placeholder={t("institution_select.search_placeholder", "Type to search for your college…")}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 300)}
              className="w-full h-11 sm:h-12 pl-11 pr-10 text-[13px] sm:text-sm bg-[#f8fafc] dark:bg-[#001c3d] border border-slate-200 dark:border-white/10 text-[#112b6b] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-white dark:focus-visible:bg-[#00152E] focus-visible:border-[#1a3884] dark:focus-visible:border-[#00a3e0] rounded-xl font-medium transition-all duration-300"
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
                title={t("institution_select.clear_search", "Clear search")}
              >
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
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
                className="mt-3 z-[100] bg-white dark:bg-[#001c3d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar"
              >
                {colleges.length > 0 ? (
                  <div className="p-2 sm:p-3">
                    <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/10 mb-2">
                      {t("institution_select.matching", "Matching Institutions")}
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
                          className={`flex items-center gap-2.5 p-2 cursor-pointer rounded-xl transition-all duration-300 group border relative overflow-hidden ${
                            selectingId === college.collegeCode 
                              ? "bg-[#1a3884]/10 border-[#1a3884]/30 shadow-sm"
                              : index === focusedIndex
                                ? "bg-[#1a3884]/5 dark:bg-white/5 border-[#1a3884]/20 dark:border-white/10 shadow-sm"
                                : "border-transparent hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:border-gray-100 dark:hover:border-white/10"
                          }`}
                        >
                          {/* Success background sweep animation */}
                          {selectingId === college.collegeCode && (
                            <motion.div
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a3884]/10 to-transparent pointer-events-none"
                            />
                          )}

                          <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border overflow-hidden shrink-0 ${
                            selectingId === college.collegeCode
                              ? "bg-[#1a3884] text-white border-[#1a3884] scale-105 shadow-md"
                              : index === focusedIndex 
                                ? "bg-[#1a3884] text-white border-[#1a3884]" 
                                : "bg-white dark:bg-[#00152E] text-[#1a3884] dark:text-[#00a3e0] border-[#1a3884]/10 dark:border-white/10 group-hover:border-[#1a3884]/30 dark:group-hover:border-white/20"
                          }`}>
                            {college.logo ? (
                              <motion.img 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={college.logo} 
                                alt={college.collegeName}
                                className="w-full h-full object-contain p-1.5 bg-white"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  // Find the sibling fallback icon and show it
                                  const fallback = e.target.parentElement.querySelector('.fallback-icon');
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <Building2 className={`h-5 w-5 transition-transform duration-300 fallback-icon ${college.logo ? 'hidden' : ''} ${index === focusedIndex ? "scale-110" : "group-hover:scale-110"}`} />
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className={`font-bold truncate transition-colors text-sm sm:text-base ${
                              selectingId === college.collegeCode ? "text-[#112b6b] dark:text-white" : "text-[#112b6b] dark:text-gray-200 group-hover:text-[#1a3884] dark:group-hover:text-white"
                            }`}>
                              {college.collegeName}
                            </div>
                            {college.address && (
                              <div className={`text-[10px] sm:text-[11px] mt-0.5 truncate flex items-center gap-1.5 font-medium transition-colors ${
                                selectingId === college.collegeCode ? "text-[#112b6b]/70 dark:text-slate-200" : "text-gray-500 dark:text-slate-300"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  selectingId === college.collegeCode ? "bg-[#1a3884]" : "bg-[#00a3e0]/30 group-hover:bg-[#00a3e0]"
                                }`} />
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
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-300">{t("institution_select.searching", "Searching...")}</p>
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
                        {t("institution_select.try_again", "Try Again")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-[#001c3d]">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-6 w-6 text-gray-300 dark:text-gray-600 mb-1" />
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-300">{t("institution_select.no_results", "No partner institution found.")}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t("institution_select.verify_name", "Verify the name and try again")}</p>
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


