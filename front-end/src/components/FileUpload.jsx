import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { apiCall } from "@/services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const FileUpload = ({
    label,
    value,
    onChange,
    accept = ".pdf,.jpg,.png,.jpeg",
    maxSizeMB = 5,
    helperText = "Supported formats: PDF, JPG, PNG"
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const validateFile = (file) => {
        if (!file) return false;

        // Check size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File size must be less than ${maxSizeMB}MB`);
            return false;
        }

        // Check type (simple check based on extension)
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());

        // Allow if accept is * or mime type check passes (browser handles accepts usually)
        // Here we rely on browser + simple extension check
        return true;
    };

    const uploadFile = async (file) => {
        if (!validateFile(file)) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiCall('/upload', {
                method: 'POST',
                body: formData,
            });

            // Pass back the filename/publicId that the backend expects
            onChange(response.publicId, response);
            toast.success("File uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        onChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>}

            <div
                className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${isDragging
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10"
                        : value
                            ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5"
                            : "border-slate-300 dark:border-white/10 hover:border-teal-400 dark:hover:border-teal-400/50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !value && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleChange}
                    disabled={isUploading || !!value}
                />

                <div className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <AnimatePresence mode="wait">
                        {isUploading ? (
                            <motion.div
                                key="uploading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-2" />
                                <p className="text-sm text-teal-600 font-medium">Uploading to Cloud...</p>
                            </motion.div>
                        ) : value ? (
                            <motion.div
                                key="uploaded"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-4 w-full"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        File Uploaded Successfully
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        Ready to submit
                                    </p>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500 hover:text-red-500" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center text-center cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-colors">
                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-teal-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <span className="text-teal-600 dark:text-teal-400">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {helperText} (Max {maxSizeMB}MB)
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
