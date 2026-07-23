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
  Plus,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { createGrievance } from "@/services/grievanceApi";

const GrievanceForm = ({ onSuccess, onCancel, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'other',
    isAnonymous: false
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("grievance.validation_title_required", "Title is required");
    } else if (formData.title.length < 5) {
      newErrors.title = t("grievance.validation_title_min", "Title must be at least 5 characters");
    } else if (formData.title.length > 100) {
      newErrors.title = t("grievance.validation_title_max", "Title cannot exceed 100 characters");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("grievance.validation_desc_required", "Description is required");
    } else if (formData.description.length < 10) {
      newErrors.description = t("grievance.validation_desc_min", "Description must be at least 10 characters");
    } else if (formData.description.length > 3000) {
      newErrors.description = t("grievance.validation_desc_max", "Description cannot exceed 3000 characters");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, attachments: t("grievance.validation_file_size", "File size must be less than 5MB") }));
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      setErrors(prev => ({ ...prev, attachments: t("grievance.validation_file_count", "Maximum 5 attachments allowed") }));
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
      const result = await createGrievance(formData, attachments);
      setSubmitStatus('success');

      setTimeout(() => {
        setFormData({ title: '', description: '', category: 'other', isAnonymous: false });
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
      className="space-y-6 text-slate-800 dark:text-slate-100"
    >
      {/* Success Message */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">{t("grievance.submitted_successfully", "Grievance submitted successfully")}</span>
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
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-white">
          {t("grievance.title", "Title")} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t("grievance.title_placeholder", "Brief summary of your grievance")}
          className={`w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border ${errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-white/10 focus:border-[#1a3884] focus:ring-[#1a3884]/20'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-4 transition-all`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Anonymous Submission Option */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 sm:mt-0">
            {formData.isAnonymous ? (
              <ShieldCheck className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-950 dark:text-white block">
              {t("grievance.submit_anonymously", "Submit Anonymously")}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
              {t("grievance.anonymous_hint", "If enabled, your name, email, and academic details will be completely hidden from the Admin.")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.isAnonymous ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-700'
            }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isAnonymous ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </button>
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-white">
          {t("grievance.attachments", "Attachments")}
        </label>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="grievance-attachments"
          accept="image/*, application/pdf"
        />

        {attachments.length === 0 ? (
          <label
            htmlFor="grievance-attachments"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all bg-[#fafbfc] dark:bg-transparent"
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Paperclip className="w-8 h-8 text-slate-400 mb-2 rotate-45" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-250">
                {t("grievance.upload_file", "Upload Screenshot or PDF Document")}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {t("grievance.upload_hint", "Images or PDF (Max 5MB)")}
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
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-medium"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <Paperclip className="w-6 h-6 text-[#1a3884] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-750 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title={t("grievance.remove_file", "Remove file")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {attachments.length < 5 && (
              <label
                htmlFor="grievance-attachments"
                className="flex items-center justify-center p-3 border border-dashed border-slate-250 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-xs font-semibold">{t("grievance.add_more", "Add More")}</span>
              </label>
            )}
          </div>
        )}

        {errors.attachments && (
          <p className="mt-1 text-sm text-red-500">{errors.attachments}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-white">
          {t("grievance.description", "Description")} <span className="text-rose-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t("grievance.description_placeholder", "Describe your grievance in detail...")}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border ${errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-white/10 focus:border-[#1a3884] focus:ring-[#1a3884]/20'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-4 transition-all resize-none`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Footer / Submit */}
      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-[#0f2c59] hover:bg-[#153c7a] dark:bg-[#1a3884] dark:hover:bg-[#254ea8] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("grievance.submitting", "Submitting")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("grievance.submit", "Submit Grievance")}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default GrievanceForm;
