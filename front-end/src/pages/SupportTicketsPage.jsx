import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LifeBuoy, MessageSquare, History, Plus, Loader2, Clock, CheckCircle2, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import TicketForm from '@/components/tickets/TicketForm';
import TicketDetail from '@/components/tickets/TicketDetail';
import { getMyTickets } from '@/services/ticketApi';

const SupportTicketsPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const conversationData = location.state;
  const [initialDescription, setInitialDescription] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'
  const [tickets, setTickets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Format chatbot conversation if present
  useEffect(() => {
    if (conversationData?.messages) {
      // ... (existing logic)
      const conversationText = conversationData.messages
        .map((msg) => {
          const role = msg.role === 'user' ? 'You' : 'Support Bot';
          return `**${role}:** ${msg.content}`;
        })
        .join('\n\n');

      setInitialDescription(
        `**Previous Chat Conversation:**\n\n${conversationText}\n\n---\n\n**Additional Information:**\n\n`
      );
    }
  }, [conversationData]);

  // Fetch History on Tab Change
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTickets();
    }
  }, [activeTab, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoadingHistory(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const response = await getMyTickets(filters);
      if (response.success) {
        setTickets(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [successTicket, setSuccessTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleSuccess = (ticket) => {
    setSuccessTicket(ticket);
    setActiveTab('history');
    fetchTickets(); // Refresh list
  };

  const statusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'in-progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'open': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
      <div className="pt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-300 hover:text-[#1a3884] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("support_tickets_page.back")}
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#1a3884] to-[#132c6b] flex items-center justify-center shadow-lg shadow-[#1a3884]/20 flex-shrink-0">
                  <LifeBuoy className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t("support_tickets_page.support_center")}</h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-0.5 sm:mt-1">
                    {t("support_tickets_page.we_are_here_to_help")}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex w-full md:w-auto gap-1 p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 md:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'create'
                    ? 'bg-[#1a3884] text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Plus size={15} /> {t("support_tickets_page.new_ticket")}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 md:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'history'
                    ? 'bg-[#1a3884] text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <History size={15} /> {t("support_tickets_page.history")}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* ITSM Success Banner */}
                {successTicket?.itsmTicketNumber && (
                  <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-400">
                        {t("support_tickets_page.ticket_submitted_success")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {t("support_tickets_page.itsm_reference_prefix")}{' '}
                      <span className="font-mono text-indigo-400 font-bold">{successTicket.itsmTicketNumber}</span>
                      {t("support_tickets_page.itsm_reference_suffix")}
                    </p>
                  </div>
                )}

                {/* Chat Conversation Preview */}
                {conversationData?.messages && (
                  <div className="mb-6 p-4 rounded-xl bg-[#1a3884]/5 dark:bg-[#1a3884]/10 border border-[#1a3884]/20 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-[#1a3884]" />
                      <span className="text-sm font-semibold text-[#1a3884]">
                        {t("support_tickets_page.chat_included")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {t("support_tickets_page.chat_history_automatic")}
                    </p>
                  </div>
                )}

                <div className="bg-white dark:bg-dark-card/50 rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <TicketForm
                    onSuccess={handleSuccess}
                    onCancel={() => navigate(-1)}
                    initialData={initialDescription ? { description: initialDescription } : undefined}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${showFilters || statusFilter
                        ? "border-[#1a3884] text-[#1a3884]"
                        : "border-[#1a3884]/30 text-gray-400"
                        }`}
                    >
                      <Filter className="w-4 h-4" />
                      {t("support_tickets_page.filters")}
                      {statusFilter && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[#1a3884]/20">1</span>
                      )}
                    </button>
                    <button
                      onClick={fetchTickets}
                      disabled={loadingHistory}
                      className="p-2 rounded-xl border border-[#1a3884]/30 text-gray-400 hover:text-white hover:border-[#1a3884] transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t("support_tickets_page.new_ticket")}
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
                      <div className="p-4 rounded-xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-gray-400 mr-2">{t("support_tickets_page.status")}:</span>
                          {['', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={`px-3 py-1 text-sm rounded-lg transition-colors ${statusFilter === status
                                  ? "bg-[#1a3884] text-white"
                                  : "bg-gray-100 dark:bg-[#002147] text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                              {status ? t("support_tickets_page.status_" + status.replace('-', '_')) : t("support_tickets_page.all")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {loadingHistory ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#1a3884]" />
                    <p>{t("support_tickets_page.loading_tickets")}</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LifeBuoy className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t("support_tickets_page.no_tickets_yet")}</h3>
                    <p className="text-slate-500 dark:text-slate-300 mb-6">{t("support_tickets_page.no_tickets_desc")}</p>
                    <button onClick={() => setActiveTab('create')} className="px-6 py-2 bg-[#1a3884] text-white rounded-lg font-bold shadow-lg shadow-[#1a3884]/20 hover:scale-105 transition-transform">{t("support_tickets_page.create_ticket")}</button>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket._id} onClick={() => setSelectedTicket(ticket)} className="bg-white dark:bg-white/5 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#1a3884]/50 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group cursor-pointer">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">#{ticket.ticketId || ticket._id.slice(-6)}</span>
                            {ticket.itsmTicketNumber && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                                {ticket.itsmTicketNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#1a3884] transition-colors">{ticket.title}</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${statusColor(ticket.status)} capitalize shadow-sm flex-shrink-0`}>
                          {t("support_tickets_page.status_" + ticket.status.replace('-', '_'))}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.responses?.length > 0 && (
                          <span className="flex items-center gap-1 text-[#1a3884]">
                            <MessageSquare size={14} /> {ticket.responses.length} {t("support_tickets_page.responses")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdate={(updatedTicket) => {
              setTickets(prev => prev.map(t =>
                t._id === updatedTicket._id ? updatedTicket : t
              ));
              setSelectedTicket(updatedTicket);
            }}
            isAdmin={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTicketsPage;


