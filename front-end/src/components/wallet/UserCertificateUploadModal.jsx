import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, Loader2, Link as LinkIcon, QrCode, Shield } from 'lucide-react';
import { userCertificateApi } from '@/services/userCertificateApi';
import { toast } from 'sonner';

const UserCertificateUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    verificationUrl: '',
    qrCodeIdentifier: '',
    category: 'Professional'
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !formData.title) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('issuer', formData.issuer);
      data.append('issueDate', formData.issueDate);
      data.append('expiryDate', formData.expiryDate);
      data.append('verificationUrl', formData.verificationUrl);
      data.append('qrCodeIdentifier', formData.qrCodeIdentifier);
      data.append('category', formData.category);
      if (file) {
        data.append('file', file);
      }

      const response = await userCertificateApi.upload(data);
      
      if (response.success) {
        toast.success('Certificate uploaded successfully!');
        if (onUploadSuccess) onUploadSuccess(response.data);
        onClose();
        // Reset form
        setFormData({
          title: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          verificationUrl: '',
          qrCodeIdentifier: '',
          category: 'Professional'
        });
        setFile(null);
      } else {
        toast.error(response.message || 'Failed to upload certificate');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#002147] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/8"
        >
          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100 dark:border-white/8 flex items-center justify-between bg-white dark:bg-[#002147]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-[#4F46E5] dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Certificate</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Add a new credential to your vault</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              type="button"
              className="p-2 hover:bg-slate-100 dark:hover:bg-[#002A5C] rounded-full transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Certificate Title</label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. AWS Solutions Architect"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Issuing Organization</label>
                  <input
                    required
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Issue Date</label>
                    <input
                      required
                      type="date"
                      name="issueDate"
                      value={formData.issueDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Expiry (Optional)</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Verification URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      name="verificationUrl"
                      value={formData.verificationUrl}
                      onChange={handleChange}
                      placeholder="https://verify.example.com/..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Verification Code / QR ID</label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="qrCodeIdentifier"
                      value={formData.qrCodeIdentifier}
                      onChange={handleChange}
                      placeholder="e.g. ABC-123-XYZ"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: File Upload */}
              <div className="flex flex-col h-full">
                <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Certificate File (PDF/Image)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex-1 min-h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-all ${
                    dragActive
                      ? "border-[#859DF4] bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#001E3D] hover:border-[#859DF4] dark:hover:border-[#859DF4]/50"
                  }`}
                >
                  {file ? (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/30">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-1 truncate max-w-[220px]">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="mt-5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-7 h-7 text-[#4F46E5] dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Drag and drop file here</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 font-medium">PDF, JPG, PNG or WEBP (Max 10MB)</p>
                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all shadow-sm">
                        Browse Files
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/8 flex justify-end gap-4 bg-white dark:bg-[#002147]">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!file && !formData.title)}
                className="px-8 py-3 rounded-xl bg-[#859DF4] hover:bg-[#728BE8] text-white text-sm font-bold shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Shield className="w-4.5 h-4.5" />
                    Save Credential
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserCertificateUploadModal;
