import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LifeBuoy, MessageSquare, History, Plus, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TicketForm from '@/components/tickets/TicketForm';
import TicketDetail from '@/components/tickets/TicketDetail';
// import { ticketApi } from '@/services/ticketApi'; // Removed unused invalid import

const SupportTicketsPage = () => {
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
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoadingHistory(true);
      const token = sessionStorage.getItem('token'); // Or however you store it
      // Direct fetch for now if service doesn't exist, verify import later
      const response = await fetch('http://localhost:5000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#001229] transition-colors duration-300">
      <div className="pt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-[#1a3884] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3884] to-[#132c6b] flex items-center justify-center shadow-lg shadow-[#1a3884]/20">
                  <LifeBuoy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Center</h1>
                  <p className="text-slate-500 dark:text-gray-400 mt-1">
                    We're here to help you 24/7
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'create'
                    ? 'bg-[#1a3884] text-white shadow-md'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Plus size={16} /> New Ticket
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'history'
                    ? 'bg-[#1a3884] text-white shadow-md'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <History size={16} /> History
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
                        Ticket submitted successfully
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      Your ITSM reference number is{' '}
                      <span className="font-mono text-indigo-400 font-bold">{successTicket.itsmTicketNumber}</span>
                      . Use this to track your issue status.
                    </p>
                  </div>
                )}

                {/* Chat Conversation Preview */}
                {conversationData?.messages && (
                  <div className="mb-6 p-4 rounded-xl bg-[#1a3884]/5 dark:bg-[#1a3884]/10 border border-[#1a3884]/20 dark:border-[#1a3884]/30 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-[#1a3884]" />
                      <span className="text-sm font-semibold text-[#1a3884]">
                        Chat conversation included
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Your chat history will be automatically attached to this ticket.
                    </p>
                  </div>
                )}

                <div className="bg-white dark:bg-[#002147]/50 rounded-2xl border border-slate-200 dark:border-[#1a3884]/30 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
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
                {loadingHistory ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#1a3884]" />
                    <p>Loading your tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LifeBuoy className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Tickets Yet</h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-6">You haven't submitted any support requests.</p>
                    <button onClick={() => setActiveTab('create')} className="px-6 py-2 bg-[#1a3884] text-white rounded-lg font-bold shadow-lg shadow-[#1a3884]/20 hover:scale-105 transition-transform">Create Ticket</button>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket._id} onClick={() => setSelectedTicket(ticket)} className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#1a3884]/50 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">#{ticket.ticketId || ticket._id.slice(-6)}</span>
                            {ticket.itsmTicketNumber && (
                              <span className="px-2 py-0.5 text-xs rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                                {ticket.itsmTicketNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#1a3884] transition-colors">{ticket.title}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor(ticket.status)} capitalize shadow-sm`}>
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <AlertCircle size={14} /> {ticket.priority} Priority
                        </span>
                        {ticket.responses?.length > 0 && (
                          <span className="flex items-center gap-1 text-[#1a3884]">
                            <MessageSquare size={14} /> {ticket.responses.length} Responses
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


