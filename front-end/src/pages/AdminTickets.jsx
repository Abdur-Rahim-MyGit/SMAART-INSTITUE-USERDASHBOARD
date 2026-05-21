import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Inbox,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown
} from "lucide-react";
import TicketCard from "@/components/tickets/TicketCard";
import TicketDetail from "@/components/tickets/TicketDetail";
import { getAllTickets } from "@/services/ticketApi";

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status', icon: null },
  { value: 'open', label: 'Open', icon: AlertCircle, color: 'text-blue-400' },
  { value: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-yellow-400' },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-400' },
  { value: 'closed', label: 'Closed', icon: XCircle, color: 'text-gray-400' }
];

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' }
];

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'content', label: 'Content' },
  { value: 'billing', label: 'Billing' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' }
];

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, 'in-progress': 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch tickets
  const fetchTickets = async (resetPage = false) => {
    setIsLoading(true);
    try {
      const queryFilters = {
        ...filters,
        search: searchQuery,
        page: resetPage ? 1 : pagination.page,
        limit: pagination.limit
      };

      // Remove empty filters
      Object.keys(queryFilters).forEach(key => {
        if (!queryFilters[key]) delete queryFilters[key];
      });

      const response = await getAllTickets(queryFilters);
      setTickets(response.data || []);
      setStats(response.stats || { open: 0, 'in-progress': 0, resolved: 0, closed: 0 });
      setPagination(prev => ({
        ...prev,
        ...response.pagination,
        page: resetPage ? 1 : response.pagination.page
      }));
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets(true);
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    // Refresh stats
    fetchTickets();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '' });
    setSearchQuery('');
  };

  const totalTickets = stats.open + stats['in-progress'] + stats.resolved + stats.closed;
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#00152E]">
      <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[#1a3884]/20">
                  <Ticket className="w-6 h-6 text-[#1a3884]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Ticket Management</h1>
              </div>
              <p className="text-gray-400">View and manage all support tickets</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-[#002147] border border-blue-500/30"
              >
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Open</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.open}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-[#002147] border border-yellow-500/30"
              >
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats['in-progress']}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-[#002147] border border-green-500/30"
              >
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Resolved</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.resolved}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-4 rounded-xl bg-[#002147] border border-gray-500/30"
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Total</span>
                </div>
                <span className="text-2xl font-bold text-white">{totalTickets}</span>
              </motion.div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex-1 min-w-[250px] relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticket ID or title..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#002147] border border-[#1a3884]/30 text-white placeholder-gray-500 focus:border-[#1a3884] focus:outline-none transition-colors"
                  />
                </form>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    showFilters || activeFiltersCount
                      ? "border-[#1a3884] text-[#1a3884]"
                      : "border-[#1a3884]/30 text-gray-400 hover:text-white"
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#1a3884]/20">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => fetchTickets()}
                  disabled={isLoading}
                  className="p-3 rounded-xl border border-[#1a3884]/30 text-gray-400 hover:text-white hover:border-[#1a3884] transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-[#002147] border border-[#1a3884]/30 space-y-4">
                      {/* Status Filter */}
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">Status</label>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_FILTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleFilterChange('status', option.value)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                filters.status === option.value
                                  ? "bg-[#1a3884] text-white"
                                  : "bg-[#00152E] text-gray-400 hover:text-white"
                              }`}
                            >
                              {option.icon && <option.icon className={`w-3.5 h-3.5 ${option.color}`} />}
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">Priority</label>
                        <div className="flex flex-wrap gap-2">
                          {PRIORITY_FILTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleFilterChange('priority', option.value)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                filters.priority === option.value
                                  ? "bg-[#1a3884] text-white"
                                  : "bg-[#00152E] text-gray-400 hover:text-white"
                              }`}
                            >
                              {option.color && <span className={`w-2 h-2 rounded-full ${option.color}`} />}
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_FILTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleFilterChange('category', option.value)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                filters.category === option.value
                                  ? "bg-[#1a3884] text-white"
                                  : "bg-[#00152E] text-gray-400 hover:text-white"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-[#1a3884] hover:text-[#1a3884]/80 transition-colors"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tickets List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-[#1a3884] animate-spin mb-4" />
                <p className="text-gray-400">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-[#002147] border border-[#1a3884]/30">
                <Inbox className="w-16 h-16 text-gray-500 mb-4" />
                <h3 className="text-xl text-white font-medium mb-2">No tickets found</h3>
                <p className="text-gray-400 text-sm">
                  {activeFiltersCount > 0 || searchQuery
                    ? "Try adjusting your filters or search query"
                    : "No support tickets have been submitted yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      onClick={() => setSelectedTicket(ticket)}
                      showUser={true}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#1a3884]/20">
                    <span className="text-sm text-gray-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                          fetchTickets();
                        }}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-lg border border-[#1a3884]/30 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                          fetchTickets();
                        }}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 rounded-lg border border-[#1a3884]/30 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdate={handleTicketUpdate}
            isAdmin={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTickets;

