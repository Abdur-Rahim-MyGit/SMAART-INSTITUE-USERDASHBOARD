import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Building2 } from "lucide-react";

// Dynamic API URL based on hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const SimpleInstitutionSelector = ({ onSelect }) => {
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch colleges from API
  const fetchColleges = async (search = "") => {
    setLoading(true);
    try {
      const url = search 
        ? `${API_BASE_URL}/colleges?search=${encodeURIComponent(search)}&limit=20`
        : `${API_BASE_URL}/colleges?limit=20`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setColleges(data.data);
      } else {
        console.error('Failed to fetch colleges:', data.error);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial colleges
  useEffect(() => {
    fetchColleges();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        fetchColleges(searchTerm);
      } else {
        fetchColleges();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelect = (college) => {
    setSelectedInstitution(college);
    setShowDropdown(false);
    // Store selected institution in sessionStorage
    sessionStorage.setItem("selectedInstitution", JSON.stringify({
      id: college._id,
      name: college.name,
      code: college.code,
      location: college.location
    }));
    
    // Call the callback if provided, otherwise navigate
    if (onSelect) {
      onSelect(college);
    } else {
      navigate(`/institution/${college._id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-0"
    >
      <div className="bg-gradient-to-br from-[#1a3884] to-[#2a5db8] rounded-2xl shadow-2xl p-6 sm:p-8">
        <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 text-center">
          Select Your Institution
        </h3>
        <p className="text-blue-100 text-sm text-center mb-6">
          Find your college to access your personalized career dashboard.
        </p>

        <div className="relative">
          <div
            className="w-full h-14 sm:h-16 text-sm sm:text-base bg-white/95 border-2 border-white/30 text-slate-800 hover:bg-white transition-all duration-300 rounded-xl font-medium cursor-pointer flex items-center px-4 shadow-lg"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {selectedInstitution ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#1a3884] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold truncate">{selectedInstitution.name}</div>
                  <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{selectedInstitution.location.city}, {selectedInstitution.location.state}</span>
                    <span className="ml-1 sm:ml-2 text-xs bg-[#1a3884]/10 text-[#1a3884] px-1 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex-shrink-0">
                      {selectedInstitution.code}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 text-slate-500">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate text-sm sm:text-base">Search and select your institution...</span>
              </div>
            )}
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search institutions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3884] focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Searching...</div>
                ) : colleges.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No institutions found.</div>
                ) : (
                  colleges.map((college) => (
                    <div
                      key={college._id}
                      onClick={() => handleSelect(college)}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0"
                    >
                      <Building2 className="h-5 w-5 text-[#1a3884] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {college.name}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {college.location.city}, {college.location.state}
                          </span>
                          <span className="text-xs bg-[#1a3884]/10 text-[#1a3884] px-2 py-1 rounded font-medium flex-shrink-0">
                            {college.code}
                          </span>
                        </div>
                        {college.type && (
                          <div className="text-xs text-slate-500 mt-1 capitalize">
                            {college.type}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SimpleInstitutionSelector;
