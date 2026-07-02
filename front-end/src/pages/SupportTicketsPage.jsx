import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LifeBuoy, MessageSquare, History, Plus, Loader2, Clock } from 'lucide-react';
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

  // Format chatbot conversation if present
  useEffect(() => {
    if (conversationData?.messages) {
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
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoadingHistory(true);
      const filters = {};
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
      case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'open': return 'text-amber-600 bg-amber-50 border-amber-250 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      default: return 'text-slate-650 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  const getCategoryLabel = (cat) => {
    const config = {
      'technical': t("support_tickets_page.cat_technical", 'Technical Issue'),
      'account': t("support_tickets_page.cat_account", 'Account'),
      'course & assessment': t("support_tickets_page.cat_course_assessment", 'Course & Assessment Issue'),
      'career Direction': t("support_tickets_page.cat_career_direction", 'Career Direction Issue'),
      'content': t("support_tickets_page.cat_content", 'Course Content'),
      'billing': t("support_tickets_page.cat_billing", 'Billing'),
      'feedback': t("support_tickets_page.cat_feedback", 'Feedback'),
      'other': t("support_tickets_page.cat_other", 'Other')
    };
    return config[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 pb-24">
      <div className="pt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">

          {/* Back Button - Mobile Only */}
          <div className="mb-4 md:hidden">
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                <ArrowLeft className="h-4 w-4" />
              </div>
              {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </button>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2"
          >
            <div className="flex items-center gap-4">
              {/* Back Button */}
              {/* <button
                onClick={() => navigate("/dashboard")}
                className="hidden md:flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-slate-355 dark:hover:border-white/20 transition-all flex-shrink-0"
                title={t("support_tickets_page.back", "Back")}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-350" />
              </button> */}

              {/* Icon and Title Group */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f2c59] dark:bg-[#1a3884] shadow-md shadow-[#0f2c59]/10">
                  <LifeBuoy className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
                    {t("support_tickets_page.it_support", "IT Support")}
                  </h1>
                  <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {t("support_tickets_page.we_are_here_to_help", "Raise and track your IT support requests")}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm self-start md:self-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${activeTab === 'create'
                  ? 'bg-[#0f2c59] dark:bg-[#1a3884] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Plus size={15} /> {t("support_tickets_page.new_ticket", "New Ticket")}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${activeTab === 'history'
                  ? 'bg-[#0f2c59] dark:bg-[#1a3884] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <History size={15} /> {t("support_tickets_page.my_tickets", "My Tickets")}
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* ITSM Success Banner */}
                {successTicket?.itsmTicketNumber && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 animate-ping flex-shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-indigo-650 dark:text-indigo-400 block">
                        {t("support_tickets_page.ticket_submitted_success", "Ticket created and synced successfully!")}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        {t("support_tickets_page.itsm_reference_prefix", "Your reference number is")}{' '}
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">{successTicket.itsmTicketNumber}</span>.{' '}
                        {t("support_tickets_page.itsm_reference_suffix", "Our support agents will respond shortly.")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Chat Conversation Preview */}
                {conversationData?.messages && (
                  <div className="p-4 rounded-2xl bg-[#1a3884]/5 dark:bg-[#1a3884]/15 border border-[#1a3884]/15 dark:border-white/10 shadow-sm flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-[#1a3884] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-[#1a3884] dark:text-blue-300 block">
                        {t("support_tickets_page.chat_included", "Chat Transcript Attached")}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        {t("support_tickets_page.chat_history_automatic", "Your recent conversation with the Support Bot has been pre-filled below to speed up diagnosis.")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Form Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                  <TicketForm
                    onSuccess={handleSuccess}
                    onCancel={() => navigate("/dashboard")}
                    initialData={initialDescription ? { description: initialDescription } : undefined}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* List Container */}
                <div className="space-y-4">
                  {loadingHistory ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#1a3884]" />
                      <p className="text-sm font-semibold">{t("support_tickets_page.loading_tickets", "Loading your ticket history...")}</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LifeBuoy className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                        {t("support_tickets_page.no_tickets_yet", "No Support Tickets Found")}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                        {t("support_tickets_page.no_tickets_desc", "You haven't submitted any support requests yet. Create a ticket if you're experiencing any issues.")}
                      </p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="px-6 py-2.5 bg-[#0f2c59] dark:bg-[#1a3884] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        {t("support_tickets_page.create_ticket", "Submit a Ticket")}
                      </button>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const dateStr = new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      const priorityLabels = {
                        low: t("support_tickets_page.priority_low_label", "Low Priority"),
                        medium: t("support_tickets_page.priority_medium_label", "Medium Priority"),
                        high: t("support_tickets_page.priority_high_label", "High Priority")
                      };

                      const priorityColors = {
                        low: 'bg-emerald-500',
                        medium: 'bg-amber-500',
                        high: 'bg-rose-500'
                      };

                      const leftBarColor = priorityColors[ticket.priority] || 'bg-slate-300';
                      const priorityLabelText = priorityLabels[ticket.priority] || 'Normal Priority';

                      return (
                        <div
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="relative bg-white dark:bg-slate-900 p-6 pl-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#1a3884]/40 hover:shadow-md hover:shadow-slate-200/10 dark:hover:shadow-none transition-all group cursor-pointer overflow-hidden"
                        >
                          {/* Priority color bar on the left */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leftBarColor}`} />

                          {/* Ticket Header (ID & Status) */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                                #{ticket.ticketId || ticket._id.slice(-6)}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(ticket.status)} capitalize shadow-sm flex-shrink-0`}>
                              {t("support_tickets_page.status_" + ticket.status.replace('-', '_'), ticket.status.replace('-', ' '))}
                            </span>
                          </div>

                          {/* Ticket Title */}
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-1.5 leading-snug">
                            {ticket.title}
                          </h3>

                          {/* Ticket Description */}
                          <p className="text-slate-550 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                            {ticket.description}
                          </p>

                          {/* Ticket Footer Info */}
                          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 font-semibold pt-1">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-400" />
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-400" />
                              {priorityLabelText}
                            </span>
                            {ticket.responses?.length > 0 && (
                              <span className="flex items-center gap-1.5 text-[#1a3884] dark:text-blue-400">
                                <MessageSquare size={14} />
                                {ticket.responses.length} {ticket.responses.length === 1 ? t("support_tickets_page.response", "Response") : t("support_tickets_page.responses", "Responses")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
