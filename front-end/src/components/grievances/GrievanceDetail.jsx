import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X,
  Clock,
  Tag,
  Paperclip,
  MessageSquare,
  Send,
  Download,
  Loader2,
  CheckCircle,
  ShieldCheck,
  ShieldAlert
} from "@/components/icons";
import { addGrievanceResponse } from "@/services/grievanceApi";
import { getBackendUrl } from "@/services/api";

const STATUS_CONFIG = {
  'pending': {
    label: 'Pending',
    color: 'bg-[#045C9A]/10 text-[#045C9A] border-[#045C9A]/20 dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] dark:border-[#045C9A]/40'
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-[#045C9A]/10 text-[#045C9A] border-[#045C9A]/20 dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] dark:border-[#045C9A]/40'
  },
  'resolved': {
    label: 'Resolved',
    color: 'bg-[#F1F5F9] text-[#35566b] border-[#d7ebf5] dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
  },
  'closed': {
    label: 'Closed',
    color: 'bg-[#F1F5F9] text-[#35566b] border-[#d7ebf5] dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
  }
};

const CATEGORY_CONFIG = {
  'placement': { label: 'Placement' },
  'course': { label: 'Course' },
  'assessment': { label: 'Assessment' },
  'badges': { label: 'Badges' },
  'certificate': { label: 'Certificate' },
  'career-direction': { label: 'Career Direction' },
  'skill-passport': { label: 'Skill Passport' },
  'other': { label: 'Other' }
};

const GrievanceDetail = ({ grievance, onClose, onUpdate, currentUser = null }) => {
  const { t } = useTranslation();
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const statusConfig = STATUS_CONFIG[grievance.status] || STATUS_CONFIG['pending'];
  const categoryConfig = CATEGORY_CONFIG[grievance.category] || CATEGORY_CONFIG['other'];

  const isImageFile = (file) => {
    const name = file.originalName || file.filename || '';
    const ext = name.split('.').pop().toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    return imageExtensions.includes(ext) || file.mimetype?.startsWith('image/');
  };

  const getAttachmentUrl = (file) => {
    if (!file) return '#';
    const url = file.url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    if (url && url.startsWith('/')) {
      return `${getBackendUrl()}${url}`;
    }
    return `${getBackendUrl()}/uploads/${file.filename}`;
  };

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

  const getSenderName = (response) => {
    if (response.respondedBy?.fullName) return response.respondedBy.fullName;
    
    // Check if reply is from the student
    const responderId = response.respondedBy?._id || response.respondedBy;
    const studentId = currentUser?._id || currentUser?.id || grievance.student?._id || grievance.student;
    
    if (responderId && studentId && responderId.toString() === studentId.toString()) {
      return grievance.isAnonymous ? t("grievance.you_anonymous", "You (Anonymous)") : t("grievance.you", "You");
    }
    
    // If not, it is an Admin response
    return t("grievance.admin_team", "Admin Team");
  };

  const getSenderInitial = (response) => {
    const name = getSenderName(response);
    return name.charAt(0).toUpperCase();
  };

  const isOwnMessage = (response) => {
    const responderId = response.respondedBy?._id || response.respondedBy;
    const studentId = currentUser?._id || currentUser?.id || grievance.student?._id || grievance.student;
    return responderId && studentId && responderId.toString() === studentId.toString();
  };

  const handleSubmitReply = async () => {
    if (!replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addGrievanceResponse(grievance._id, replyMessage.trim());
      setSubmitSuccess(true);
      setReplyMessage('');

      setTimeout(() => {
        setSubmitSuccess(false);
        if (onUpdate) onUpdate(result.data);
      }, 1500);
    } catch (error) {
      console.error('Error replying to grievance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[94vh] sm:max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 flex flex-col my-auto shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#d7ebf5] dark:border-white/5 bg-[#F1F5F9] dark:bg-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{grievance.grievanceId}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {grievance.isAnonymous && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border bg-[#045C9A]/10 border-[#045C9A]/20 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] dark:border-[#045C9A]/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t("grievance.anonymous", "Anonymous")}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#072036] dark:text-white leading-tight">{grievance.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#072036] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Meta Info */}
          <div className="p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 dark:text-gray-400 text-xs mb-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Submitted
            </div>
            <span className="text-[#072036] dark:text-white text-[13.5px] font-bold block leading-tight">
              {formatDate(grievance.createdAt)}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grievance Description</h3>
            <div className="p-4 rounded-xl bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/5">
              <p className="text-[#072036] dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{grievance.description}</p>
            </div>
          </div>

          {/* Attachments */}
          {grievance.attachments?.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments ({grievance.attachments.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {grievance.attachments.map((file, index) => {
                  const isImg = isImageFile(file);
                  const url = getAttachmentUrl(file);
                  return (
                    <div 
                      key={index}
                      className="group relative rounded-xl border border-[#d7ebf5] dark:border-white/5 bg-[#F1F5F9] dark:bg-[#072036] overflow-hidden flex flex-col"
                    >
                      {isImg ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                          <img 
                            src={url} 
                            alt={file.originalName || file.filename} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                          >
                            <span>View Image</span>
                          </a>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-2">
                          <Paperclip className="w-8 h-8 text-[#045C9A] mb-1" />
                          <span className="text-[10px] font-semibold text-center truncate max-w-full">
                            {file.originalName || file.filename}
                          </span>
                        </div>
                      )}
                      
                      <div className="p-2.5 flex items-center justify-between gap-1.5 border-t border-[#d7ebf5] dark:border-white/5 bg-white dark:bg-[#0d3a5f]/30">
                        <span className="text-xs font-semibold text-[#072036] dark:text-gray-300 truncate max-w-[120px]" title={file.originalName || file.filename}>
                          {file.originalName || file.filename}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#072036] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            title="View"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-[#045C9A]" />
                          </a>
                          <a
                            href={url}
                            download={file.originalName}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#072036] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Responses */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Response Feed ({grievance.responses?.length || 0})
            </h3>
            <div className="space-y-3.5">
              {grievance.responses?.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[#d7ebf5] dark:border-white/5 text-center bg-[#F1F5F9] dark:bg-transparent">
                  <p className="text-slate-400 text-sm font-medium">No responses yet from the Admin team.</p>
                </div>
              ) : (
                grievance.responses?.map((response, index) => {
                  const own = isOwnMessage(response);
                  return (
                    <motion.div
                      key={response._id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${own
                        ? 'bg-[#EAF7FD] border-[#045C9A]/20 dark:bg-[#045C9A]/20 dark:border-[#045C9A]/40'
                        : 'bg-[#F1F5F9] border-[#d7ebf5] dark:bg-[#045C9A]/10 dark:border-[#045C9A]/20'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200 text-[#072036] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]`}>
                          <span className="text-[10px] font-bold">
                            {getSenderInitial(response)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#072036] dark:text-white">
                          {getSenderName(response)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(response.respondedAt)}
                        </span>
                      </div>
                      <p className="text-[#072036] dark:text-slate-300 text-sm whitespace-pre-wrap pl-8 leading-relaxed font-medium">
                        {response.message}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* User Reply Input */}
          {grievance.status !== 'closed' && grievance.status !== 'resolved' && (
            <div className="pt-4 border-t border-[#d7ebf5] dark:border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Add Message or Reply
              </h3>
              <div className="relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a message or response details..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 text-[#072036] dark:text-white placeholder-slate-400 focus:border-[#045C9A] focus:outline-none transition-colors resize-none pr-14"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyMessage.trim()}
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-[#045C9A] text-white hover:bg-[#0d3a5f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
              <p className="text-[11px] text-slate-400 font-medium">
                Your response will be forwarded directly to the Admin support feed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#d7ebf5] dark:border-white/5 bg-[#F1F5F9] dark:bg-[#072036]/50 flex justify-between items-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Last updated: {formatDate(grievance.updatedAt)}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl border border-[#d7ebf5] dark:border-[#045C9A]/50 text-[#35566b] dark:text-gray-400 hover:text-[#072036] dark:hover:text-white hover:border-[#045C9A]/40 dark:hover:border-[#045C9A] transition-colors bg-white dark:bg-transparent"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GrievanceDetail;
