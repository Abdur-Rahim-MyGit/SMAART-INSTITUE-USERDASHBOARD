import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Clock,
  Tag,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Send,
  Download,
  User,
  Loader2,
  CheckCircle
} from "lucide-react";
import { updateTicket } from "@/services/ticketApi";

const STATUS_CONFIG = {
  'open': {
    label: 'Open',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  'resolved': {
    label: 'Resolved',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  'closed': {
    label: 'Closed',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
};

const PRIORITY_CONFIG = {
  'low': { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10' },
  'medium': { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'high': { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10' }
};

const CATEGORY_CONFIG = {
  'technical': { label: 'Technical Issue' },
  'account': { label: 'Account' },
  'content': { label: 'Course Content' },
  'billing': { label: 'Billing' },
  'feedback': { label: 'Feedback' },
  'other': { label: 'Other' }
};

const TicketDetail = ({ ticket, onClose, onUpdate, isAdmin = false }) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['open'];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG['medium'];
  const categoryConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG['other'];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmitReply = async () => {
    if (!replyMessage.trim() && selectedStatus === ticket.status) return;

    setIsSubmitting(true);
    try {
      const updates = {};
      if (replyMessage.trim()) {
        updates.response = replyMessage.trim();
      }
      if (selectedStatus !== ticket.status) {
        updates.status = selectedStatus;
      }

      const result = await updateTicket(ticket._id, updates);
      setSubmitSuccess(true);
      setReplyMessage('');

      setTimeout(() => {
        setSubmitSuccess(false);
        if (onUpdate) onUpdate(result.data);
      }, 1000);
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#001229] border border-[#1a3884]/30 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#1a3884]/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm text-gray-500 font-mono">{ticket.ticketId}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{ticket.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Meta Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-[#002147] border border-[#1a3884]/20">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Tag className="w-3 h-3" />
                Category
              </div>
              <span className="text-white text-sm font-medium">{categoryConfig.label}</span>
            </div>
            <div className={`p-3 rounded-xl ${priorityConfig.bg} border border-[#1a3884]/20`}>
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <AlertTriangle className="w-3 h-3" />
                Priority
              </div>
              <span className={`text-sm font-medium ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#002147] border border-[#1a3884]/20">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Created
              </div>
              <span className="text-white text-sm font-medium">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#002147] border border-[#1a3884]/20">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <User className="w-3 h-3" />
                Submitted by
              </div>
              <span className="text-white text-sm font-medium">
                {ticket.userId?.fullName || 'User'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <div className="p-4 rounded-xl bg-[#002147] border border-[#1a3884]/20">
              <p className="text-white whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((file, index) => (
                  <a
                    key={index}
                    href={file.path}
                    download={file.originalName}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#002147] border border-[#1a3884]/30 hover:border-[#1a3884] transition-colors group"
                  >
                    <Paperclip className="w-4 h-4 text-[#1a3884]" />
                    <span className="text-sm text-gray-300 max-w-[150px] truncate">
                      {file.originalName || file.filename}
                    </span>
                    <Download className="w-4 h-4 text-gray-500 group-hover:text-[#1a3884] transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Responses */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Responses ({ticket.responses?.length || 0})
            </h3>
            <div className="space-y-3">
              {ticket.responses?.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#002147]/50 border border-dashed border-[#1a3884]/20 text-center">
                  <p className="text-gray-500 text-sm">No responses yet</p>
                </div>
              ) : (
                ticket.responses?.map((response, index) => (
                  <motion.div
                    key={response._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-[#1a3884]/10 border border-[#1a3884]/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a3884]/30 flex items-center justify-center">
                        <span className="text-[10px] text-[#1a3884] font-medium">
                          {response.respondedBy?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <span className="text-sm text-white font-medium">
                        {response.respondedBy?.fullName || 'Support Team'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(response.respondedAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap pl-8">
                      {response.message}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Admin Reply Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-[#1a3884]/20">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Admin Actions</h3>

              {/* Status Update */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-2 block">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStatus(key)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        selectedStatus === key
                          ? config.color
                          : 'border-[#1a3884]/30 text-gray-400 hover:border-[#1a3884]/50'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Input */}
              <div className="relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#002147] border border-[#1a3884]/30 text-white placeholder-gray-500 focus:border-[#1a3884] focus:outline-none transition-colors resize-none"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || (!replyMessage.trim() && selectedStatus === ticket.status)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#1a3884] text-white hover:bg-[#1a3884]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : submitSuccess ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a3884]/20 bg-[#002147]/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Last updated: {formatDate(ticket.updatedAt)}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#1a3884]/50 text-gray-400 hover:text-white hover:border-[#1a3884] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TicketDetail;

