import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Send,
  Paperclip,
  X,
  AlertCircle,
  Loader2,
  CheckCircle
} from "lucide-react";
import { createTicket } from "@/services/ticketApi";

const TicketForm = ({ onSuccess, onCancel, initialData }) => {
  const { t } = useTranslation();

  const CATEGORIES = [
    { value: 'technical', label: t("support_tickets_page.cat_technical"), description: t("support_tickets_page.cat_technical_desc") },
    { value: 'account', label: t("support_tickets_page.cat_account"), description: t("support_tickets_page.cat_account_desc") },
    { value: 'content', label: t("support_tickets_page.cat_content"), description: t("support_tickets_page.cat_content_desc") },
    { value: 'billing', label: t("support_tickets_page.cat_billing"), description: t("support_tickets_page.cat_billing_desc") },
    { value: 'feedback', label: t("support_tickets_page.cat_feedback"), description: t("support_tickets_page.cat_feedback_desc") },
    { value: 'other', label: t("support_tickets_page.cat_other"), description: t("support_tickets_page.cat_other_desc") }
  ];

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    priority: initialData?.priority || 'medium'
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("support_tickets_page.validation_title_required");
    } else if (formData.title.length < 5) {
      newErrors.title = t("support_tickets_page.validation_title_min");
    } else if (formData.title.length > 100) {
      newErrors.title = t("support_tickets_page.validation_title_max");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("support_tickets_page.validation_desc_required");
    } else if (formData.description.length < 10) {
      newErrors.description = t("support_tickets_page.validation_desc_min");
    } else if (formData.description.length > 2000) {
      newErrors.description = t("support_tickets_page.validation_desc_max");
    }

    if (!formData.category) {
      newErrors.category = t("support_tickets_page.validation_category_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, attachments: t("support_tickets_page.validation_file_size") }));
        return false;
      }
      return true;
    });

    // Max 3 files
    if (attachments.length + validFiles.length > 3) {
      setErrors(prev => ({ ...prev, attachments: t("support_tickets_page.validation_file_count") }));
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachments: null }));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await createTicket(formData, attachments);
      setSubmitStatus('success');

      // Reset form after short delay
      setTimeout(() => {
        setFormData({ title: '', description: '', category: '', priority: 'medium' });
        setAttachments([]);
        if (onSuccess) onSuccess(result.data);
      }, 1500);
    } catch (error) {
      setSubmitStatus('error');
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Success Message */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">{t("support_tickets_page.ticket_submitted_successfully")}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{errors.submit}</span>
        </motion.div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
          {t("support_tickets_page.title")} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t("support_tickets_page.title_placeholder")}
          className={`w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border ${errors.title ? 'border-red-500' : 'border-slate-200 dark:border-white/10'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">{formData.title.length}/100 {t("support_tickets_page.characters")}</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
          {t("support_tickets_page.category")} <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, category: cat.value }));
                if (errors.category) setErrors(prev => ({ ...prev, category: null }));
              }}
              className={`p-3 rounded-xl border text-left transition-all ${formData.category === cat.value
                ? 'border-[#1a3884] bg-[#1a3884]/10 dark:bg-[#1a3884]/20'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#1a3884]/50'
                }`}
            >
              <span className={`font-medium text-sm ${formData.category === cat.value ? 'text-[#1a3884]' : 'text-slate-900 dark:text-white'}`}>{cat.label}</span>
              <p className="text-slate-500 dark:text-slate-300 text-xs mt-0.5">{cat.description}</p>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="mt-2 text-sm text-red-400">{errors.category}</p>
        )}
      </div>

      {/* Priority */}
      {/* <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
          Priority
        </label>
        <div className="flex gap-3">
          {PRIORITIES.map((pri) => (
            <button
              key={pri.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority: pri.value }))}
              className={`px-4 py-2 rounded-xl border transition-all ${formData.priority === pri.value
                  ? pri.color
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:border-[#1a3884]/50'
                }`}
            >
              {pri.label}
            </button>
          ))}
        </div>
      </div> */}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
          {t("support_tickets_page.description")} <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t("support_tickets_page.description_placeholder")}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border ${errors.description ? 'border-red-500' : 'border-slate-200 dark:border-white/10'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors resize-none`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">{formData.description.length}/2000 {t("support_tickets_page.characters")}</p>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
          {t("support_tickets_page.attachments")}
        </label>
        <div className="flex flex-wrap gap-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#002147] border border-slate-200 dark:border-white/10"
            >
              <Paperclip className="w-4 h-4 text-[#1a3884]" />
              <span className="text-sm text-slate-700 dark:text-slate-200 max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {attachments.length < 3 && (
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 dark:border-white/10 cursor-pointer hover:border-[#1a3884]/50 transition-colors bg-white dark:bg-transparent">
              <Paperclip className="w-4 h-4 text-slate-400 dark:text-slate-300" />
              <span className="text-sm text-slate-500 dark:text-slate-300">{t("support_tickets_page.add_file")}</span>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </label>
          )}
        </div>
        {errors.attachments && (
          <p className="mt-2 text-sm text-red-500">{errors.attachments}</p>
        )}
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-400">{t("support_tickets_page.attachments_hint")}</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-[#1a3884]/50 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-[#1a3884] transition-colors"
          >
            {t("support_tickets_page.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-[#1a3884] text-white hover:bg-[#132c6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("support_tickets_page.submitting")}
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              {t("support_tickets_page.submit_ticket")}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default TicketForm;

