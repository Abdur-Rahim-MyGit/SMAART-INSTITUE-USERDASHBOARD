import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ChevronDown,
  BookOpen,
  FileQuestion,
  Mail,
  Phone,
  Loader2,
  RefreshCw,
  Inbox
} from "lucide-react";
import TicketForm from "@/components/tickets/TicketForm";
import TicketCard from "@/components/tickets/TicketCard";
import TicketDetail from "@/components/tickets/TicketDetail";
import { getMyTickets } from "@/services/ticketApi";

const FAQ_ITEMS = [
  {
    question: "How do I reset my password?",
    answer: "Go to Settings > Privacy & Security > Change Password. Enter your current password and your new password twice to confirm the change."
  },
  {
    question: "How can I track my course progress?",
    answer: "Visit My Courses from the sidebar to see all your enrolled courses. Each course shows a progress bar and the modules you've completed."
  },
  {
    question: "What are quotients and how do I improve them?",
    answer: "Quotients represent different aspects of your intelligence and skills. Complete assessments to discover your scores and take recommended courses to improve them."
  },
  {
    question: "How do I create a vision board?",
    answer: "Navigate to Vision Boards from the sidebar, click 'Create New', and use our editor to add images, text, and goals to visualize your aspirations."
  },
  {
    question: "Can I download my certificates?",
    answer: "Yes! Once you complete a course, go to Skills Passport where you can view and download all your earned certificates."
  },
  {
    question: "How do I contact my coach?",
    answer: "Go to Mind Care Sessions to schedule a session with your assigned coach or browse available coaches for booking."
  }
];

const Help = () => {
  const [activeTab, setActiveTab] = useState("faq"); // faq | create | mytickets
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: "faq", label: "FAQ", icon: BookOpen },
    { id: "create", label: "Create Ticket", icon: Plus },
    { id: "mytickets", label: "My Tickets", icon: MessageSquare }
  ];

  // Fetch user's tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const response = await getMyTickets(filters);
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mytickets') {
      fetchTickets();
    }
  }, [activeTab, statusFilter]);

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setActiveTab('mytickets');
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  };

  // Filter FAQs by search
  const filteredFaqs = FAQ_ITEMS.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#001229]">
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
                  <HelpCircle className="w-6 h-6 text-[#1a3884]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Get answers to common questions or raise a support ticket</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-[#1a3884] text-white"
                        : "bg-white dark:bg-[#002147] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1a3884]/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'mytickets' && tickets.length > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
                        {tickets.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {/* FAQ Tab */}
              {activeTab === "faq" && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search frequently asked questions..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#1a3884] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* FAQ List */}
                  <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
                        <FileQuestion className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No FAQs match your search</p>
                      </div>
                    ) : (
                      filteredFaqs.map((faq, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 overflow-hidden shadow-sm dark:shadow-none"
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left"
                          >
                            <span className="text-gray-900 dark:text-white font-medium pr-4">{faq.question}</span>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                expandedFaq === index ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedFaq === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[#1a3884]/20">
                          <Mail className="w-5 h-5 text-[#1a3884]" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium">Email Support</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">support@smaartminds.com</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">We respond within 24 hours</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[#1a3884]/20">
                          <Phone className="w-5 h-5 text-[#1a3884]" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium">Phone Support</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">+91 1800-123-4567</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Mon-Fri, 9AM-6PM IST</p>
                    </div>
                  </div>

                  {/* CTA to create ticket */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-[#1a3884]/10 dark:from-[#1a3884]/20 to-gray-50 dark:to-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-center">
                    <h3 className="text-gray-900 dark:text-white font-medium mb-2">Can't find what you're looking for?</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create a support ticket and our team will help you out</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Ticket
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Create Ticket Tab */}
              {activeTab === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-6 shadow-sm dark:shadow-none">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create Support Ticket</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Describe your issue and we'll get back to you as soon as possible</p>
                    </div>
                    <TicketForm
                      onSuccess={handleTicketCreated}
                      onCancel={() => setActiveTab('faq')}
                    />
                  </div>
                </motion.div>
              )}

              {/* My Tickets Tab */}
              {activeTab === "mytickets" && (
                <motion.div
                  key="mytickets"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                          showFilters || statusFilter
                            ? "border-[#1a3884] text-[#1a3884]"
                            : "border-[#1a3884]/30 text-gray-400"
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        Filters
                        {statusFilter && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-[#1a3884]/20">1</span>
                        )}
                      </button>
                      <button
                        onClick={fetchTickets}
                        disabled={isLoading}
                        className="p-2 rounded-xl border border-[#1a3884]/30 text-gray-400 hover:text-white hover:border-[#1a3884] transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Ticket
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
                        <div className="p-4 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 shadow-sm dark:shadow-none">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-gray-400 mr-2">Status:</span>
                            {['', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
                              <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                  statusFilter === status
                                    ? "bg-[#1a3884] text-white"
                                    : "bg-gray-100 dark:bg-[#001229] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                {status || 'All'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tickets List */}
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#1a3884] animate-spin mb-3" />
                      <p className="text-gray-400">Loading tickets...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 shadow-sm dark:shadow-none">
                      <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                      <h3 className="text-gray-900 dark:text-white font-medium mb-1">No tickets yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create a ticket to get help from our support team</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3884] text-white hover:bg-[#1a3884]/80 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket, index) => (
                        <TicketCard
                          key={ticket._id}
                          ticket={ticket}
                          onClick={() => setSelectedTicket(ticket)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdate={handleTicketUpdate}
            isAdmin={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Help;

