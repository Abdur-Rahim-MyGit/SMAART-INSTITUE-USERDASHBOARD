import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Send,
  Paperclip,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  Plus
} from "@/components/icons";
import { createTicket } from "@/services/ticketApi";

const TicketForm = ({ onSuccess, onCancel, initialData, isGuest = false }) => {
  const { t } = useTranslation();

  const CATEGORIES = [
    {
      value: 'technical',
      label: t("support_tickets_page.cat_technical", "Technical Issue"),
      description: t("support_tickets_page.cat_technical_desc", "Hardware, software, device connection, system bugs")
    },
    {
      value: 'account',
      label: t("support_tickets_page.cat_account", "Account Issue"),
      description: t("support_tickets_page.cat_account_desc", "Login, access, permissions")
    },
    {
      value: 'course',
      label: t("support_tickets_page.cat_course", "Course Issue"),
      description: t("support_tickets_page.cat_course_desc", "Course content, videos, modules access")
    },
    {
      value: 'assessment',
      label: t("support_tickets_page.cat_assessment", "Assessment Issue"),
      description: t("support_tickets_page.cat_assessment_desc", "Test access, submission errors, grading")
    },
    {
      value: 'career Direction',
      label: t("support_tickets_page.cat_career_direction", "Career Direction Issue"),
      description: t("support_tickets_page.cat_career_direction_desc", "Career Direction guidance and support")
    },
    {
      value: 'placement issue',
      label: t("support_tickets_page.cat_placement", "Placement Issue"),
      description: t("support_tickets_page.cat_placement_desc", "Job application, placement drive, resume upload")
    },
    {
      value: 'certificates & badges issue',
      label: t("support_tickets_page.cat_certificates_badges", "Certificates & Badges Issue"),
      description: t("support_tickets_page.cat_certificates_badges_desc", "Certificate generation, badge unlock, sharing")
    },
    {
      value: 'other',
      label: t("support_tickets_page.cat_other", "Others Issue"),
      description: t("support_tickets_page.cat_other_desc", "General IT inquiries")
    }
  ];


  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    priority: initialData?.priority || 'medium',
    contactName: '',
    contactEmail: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {};

    if (isGuest) {
      if (!formData.contactName.trim()) {
        newErrors.contactName = t("support_tickets_page.validation_name_required", "Name is required");
      }
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = t("support_tickets_page.validation_email_required", "Email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = t("support_tickets_page.validation_email_invalid", "Invalid email format");
      }
    }

    if (!formData.title.trim()) {
      newErrors.title = t("support_tickets_page.validation_title_required", "Title is required");
    } else if (formData.title.length < 5) {
      newErrors.title = t("support_tickets_page.validation_title_min", "Title must be at least 5 characters");
    } else if (formData.title.length > 100) {
      newErrors.title = t("support_tickets_page.validation_title_max", "Title cannot exceed 100 characters");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("support_tickets_page.validation_desc_required", "Description is required");
    } else if (formData.description.length < 10) {
      newErrors.description = t("support_tickets_page.validation_desc_min", "Description must be at least 10 characters");
    } else if (formData.description.length > 2000) {
      newErrors.description = t("support_tickets_page.validation_desc_max", "Description cannot exceed 2000 characters");
    }

    if (!formData.category) {
      newErrors.category = t("support_tickets_page.validation_category_required", "Category is required");
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
        setErrors(prev => ({ ...prev, attachments: t("support_tickets_page.validation_file_size", "File size must be less than 5MB") }));
        return false;
      }
      return true;
    });

    // Max 20 files
    if (attachments.length + validFiles.length > 20) {
      setErrors(prev => ({ ...prev, attachments: t("support_tickets_page.validation_file_count", "Maximum 20 attachments allowed") }));
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
        setFormData({ title: '', description: '', category: '', priority: 'medium', contactName: '', contactEmail: '' });
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
      className="space-y-6 text-[#072036] dark:text-slate-100"
    >
      {/* Success Message */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-[#045C9A]/20 bg-[#EAF7FD] p-4 dark:border-[#045C9A]/40 dark:bg-[#045C9A]/15"
        >
          <CheckCircle className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
          <span className="text-[#072036] dark:text-white font-bold text-sm">{t("support_tickets_page.ticket_submitted_successfully", "Ticket submitted successfully")}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <span className="text-rose-600 dark:text-rose-400">{errors.submit}</span>
        </motion.div>
      )}

      {/* Guest Fields (Name & Email) */}
      {isGuest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
              {t("support_tickets_page.name", "Name")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder={t("support_tickets_page.name_placeholder", "Your Full Name")}
              className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-[#072036] border ${errors.contactName ? 'border-rose-400 focus:ring-rose-400/20' : 'border-[#d7ebf5] dark:border-white/10 focus:border-[#045C9A] focus:ring-[#045C9A]/20'
                } text-[#072036] dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
            />
            {errors.contactName && (
              <p className="mt-1 text-sm text-rose-600">{errors.contactName}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
              {t("support_tickets_page.email", "Email")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder={t("support_tickets_page.email_placeholder", "Your Email Address")}
              className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-[#072036] border ${errors.contactEmail ? 'border-rose-400 focus:ring-rose-400/20' : 'border-[#d7ebf5] dark:border-white/10 focus:border-[#045C9A] focus:ring-[#045C9A]/20'
                } text-[#072036] dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-rose-600">{errors.contactEmail}</p>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
          {t("support_tickets_page.title", "Title")} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t("support_tickets_page.title_placeholder", "Brief summary of your issue")}
          className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-[#072036] border ${errors.title ? 'border-rose-400 focus:ring-rose-400/20' : 'border-[#d7ebf5] dark:border-white/10 focus:border-[#045C9A] focus:ring-[#045C9A]/20'
            } text-[#072036] dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-rose-600">{errors.title}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
          {t("support_tickets_page.category", "Category")} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const isSelected = formData.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, category: cat.value }));
                  if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                }}
                aria-pressed={isSelected}
                className={`relative rounded-xl border p-3.5 pr-8 text-left transition-colors ${isSelected
                  ? 'border-[#045C9A] bg-[#EAF7FD] dark:border-[#A6D7E8] dark:bg-[#045C9A]/20'
                  : 'border-[#d7ebf5] bg-white hover:border-[#045C9A]/40 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#072036]/60 dark:hover:border-[#A6D7E8]/40'
                  }`}
              >
                {isSelected && <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />}
                <span className={`block text-[13px] font-extrabold leading-snug ${isSelected ? 'text-[#045C9A] dark:text-[#A6D7E8]' : 'text-[#072036] dark:text-white'}`}>{cat.label}</span>
                <p className="mt-1 text-[11px] leading-normal text-[#35566b] dark:text-slate-400">{cat.description}</p>
              </button>
            );
          })}
        </div>
        {errors.category && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.category}</p>
        )}
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
          {t("support_tickets_page.attachments", "Attachments")}
        </label>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="attachments-upload"
          accept="image/png, image/jpeg, image/webp"
        />

        {attachments.length === 0 ? (
          <label
            htmlFor="attachments-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-2xl cursor-pointer hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition-all bg-[#F1F5F9] dark:bg-transparent"
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Paperclip className="w-8 h-8 text-slate-400 mb-2 " />
              <span className="text-sm font-semibold text-[#072036] dark:text-slate-300">
                {t("support_tickets_page.upload_screenshot", "Upload Screenshot")}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {t("support_tickets_page.upload_hint", "PNG, JPG, WEBP (Max 5MB)")}
              </span>
            </div>
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {attachments.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#F1F5F9] dark:bg-white/5 border border-[#d7ebf5] dark:border-white/10 rounded-xl font-medium"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded-lg border border-[#d7ebf5] flex-shrink-0"
                      />
                    ) : (
                      <Paperclip className="w-6 h-6 text-[#045C9A] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#072036] dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title={t("support_tickets_page.remove_file", "Remove file")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {attachments.length < 20 && (
              <label
                htmlFor="attachments-upload"
                className="flex items-center justify-center p-3 border border-dashed border-[#d7ebf5] dark:border-white/10 rounded-xl cursor-pointer hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition-all text-[#35566b]"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-xs font-semibold">{t("support_tickets_page.add_more", "Add More")}</span>
              </label>
            )}
          </div>
        )}

        {errors.attachments && (
          <p className="mt-1 text-sm text-rose-600">{errors.attachments}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
          {t("support_tickets_page.description", "Description")} <span className="text-rose-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t("support_tickets_page.description_placeholder", "Describe your issue in detail...")}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-[#072036] border ${errors.description ? 'border-rose-400 focus:ring-rose-400/20' : 'border-[#d7ebf5] dark:border-white/10 focus:border-[#045C9A] focus:ring-[#045C9A]/20'
            } text-[#072036] dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-rose-600">{errors.description}</p>
        )}
      </div>

      {/* Footer / Submit */}
      <div className="flex justify-end pt-4 border-t border-[#d7ebf5] dark:border-white/5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("support_tickets_page.submitting", "Submitting")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("support_tickets_page.submit_ticket", "Submit Ticket")}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default TicketForm;
