import { motion } from "framer-motion";
import { Clock, MessageSquare, Paperclip, ChevronRight } from "lucide-react";

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
  'low': { label: 'Low', color: 'text-green-400' },
  'medium': { label: 'Medium', color: 'text-yellow-400' },
  'high': { label: 'High', color: 'text-red-400' }
};

const CATEGORY_CONFIG = {
  'technical': { label: 'Technical', color: 'bg-purple-500/20 text-purple-400' },
  'account': { label: 'Account', color: 'bg-blue-500/20 text-blue-400' },
  'content': { label: 'Content', color: 'bg-cyan-500/20 text-cyan-400' },
  'billing': { label: 'Billing', color: 'bg-orange-500/20 text-orange-400' },
  'feedback': { label: 'Feedback', color: 'bg-pink-500/20 text-pink-400' },
  'other': { label: 'Other', color: 'bg-gray-500/20 text-gray-400' }
};

const TicketCard = ({ ticket, onClick, showUser = false }) => {
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['open'];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG['medium'];
  const categoryConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG['other'];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick?.(ticket)}
      className="p-4 rounded-xl bg-[#002147] border border-[#1a3884]/30 hover:border-[#1a3884] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Ticket ID and Status */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-gray-500 font-mono">{ticket.ticketId}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-white font-medium mb-1 truncate group-hover:text-[#1a3884] transition-colors">
            {ticket.title}
          </h3>

          {/* Description preview */}
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {ticket.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(ticket.createdAt)}
            </span>
            <span className={`flex items-center gap-1 ${priorityConfig.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {priorityConfig.label} Priority
            </span>
            {ticket.responses?.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {ticket.responses.length} response{ticket.responses.length > 1 ? 's' : ''}
              </span>
            )}
            {ticket.attachments?.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {ticket.attachments.length} file{ticket.attachments.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* User info (for admin view) */}
          {showUser && ticket.userId && (
            <div className="mt-3 pt-3 border-t border-[#1a3884]/10">
              <div className="flex items-center gap-2">
                {ticket.userId.profileImage ? (
                  <img 
                    src={ticket.userId.profileImage} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1a3884]/20 flex items-center justify-center">
                    <span className="text-[10px] text-[#1a3884] font-medium">
                      {ticket.userId.fullName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-400">{ticket.userId.fullName}</span>
                <span className="text-xs text-gray-500">({ticket.userId.userId})</span>
              </div>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#1a3884] transition-colors flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default TicketCard;

