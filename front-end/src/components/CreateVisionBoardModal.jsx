import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/services/api";
import { moderateTextAsync, loadToxicityModel, moderateText } from "../features/visionBoard/utils/contentModeration";
import { useToast } from "@/hooks/use-toast";

const CreateVisionBoardModal = ({ isOpen, onClose, onSuccess, userId }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Pre-load Toxicity Model
  useEffect(() => {
    if (isOpen) {
      loadToxicityModel();
    }
  }, [isOpen]);

  const handleInstantCheck = (text, fieldName) => {
    // Use substring matching (exactMatch=false) for instant feedback while typing
    const result = moderateText(text, false); 
    if (!result.isClean) {
      toast({
        title: "Inappropriate Content",
        description: `Your ${fieldName} contains inappropriate language. Actions have been blocked for safety.`,
        variant: "destructive",
      });
      handleClose();
      return true;
    }
    return false;
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    handleInstantCheck(value, "title");
  };

  const handleTextContentChange = (e) => {
    const value = e.target.value;
    setTextContent(value);
    handleInstantCheck(value, "vision statement");
  };

  // Count sentences in text
  const countSentences = (text) => {
    if (!text || text.trim().length === 0) return 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  };

  // Compress image to reduce memory usage
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Limit preview size to reduce memory
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (selectedImages.length + files.length > 9) {
      setError(`You can only upload 9 images. Currently selected: ${selectedImages.length}`);
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setError(`${file.name} is not a valid image file`);
      }
      return isImage;
    });

    // Create compressed previews to reduce memory usage
    const newPreviews = await Promise.all(validFiles.map(file => compressImage(file)));
    
    setSelectedImages([...selectedImages, ...validFiles]);
    setPreviews([...previews, ...newPreviews]);
    setError("");
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setPreviews(newPreviews);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Synchronous Gatekeeper Check - Catch anything missed by onChange
    if (handleInstantCheck(title, "title")) return;
    if (handleInstantCheck(textContent, "vision statement")) return;

    // Validate exactly 9 images
    if (selectedImages.length !== 9) {
      setError(`Please select exactly 9 images. Currently selected: ${selectedImages.length}`);
      return;
    }

    // Validate text content (1-3 sentences if provided)
    const sentenceCount = countSentences(textContent);
    if (textContent.trim().length > 0 && (sentenceCount < 1 || sentenceCount > 3)) {
      setError(`Text content must contain between 1 and 3 sentences. Currently: ${sentenceCount} sentence(s)`);
      return;
    }

    // Validate title - auto-generate if empty
    const visionBoardTitle = title.trim() || `Vision Board - ${new Date().toLocaleDateString()}`;

    setUploading(true);
    setError("");

    try {
      // Content moderation check
      const titleCheck = await moderateTextAsync(visionBoardTitle);
      if (!titleCheck.isClean) {
        throw new Error("Your vision board title contains inappropriate content. Please revise.");
      }

      if (textContent.trim()) {
        const textCheck = await moderateTextAsync(textContent.trim());
        if (!textCheck.isClean) {
          throw new Error("Your vision statement contains inappropriate content. Please revise.");
        }
      }
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('title', visionBoardTitle);
      formData.append('textContent', textContent.trim());
      
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`${API_BASE_URL}/visionBoards`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vision board');
      }

      // Clean up previews
      previews.forEach(preview => URL.revokeObjectURL(preview));
      
      // Reset form
      setSelectedImages([]);
      setPreviews([]);
      setTitle("");
      
      // Call success callback
      onSuccess(data.visionBoard);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error creating vision board:', err);
      setError(err.message || 'Failed to create vision board');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up previews
    previews.forEach(preview => URL.revokeObjectURL(preview));
    setSelectedImages([]);
    setPreviews([]);
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Vision Board</h2>
                  <p className="text-sm text-gray-600 mt-1">Upload exactly 9 images to create your vision board</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 relative">
                {/* Upload Overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                    <div className="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f59f0a' }} />
                      <span className="font-medium text-gray-900">Creating your vision board...</span>
                    </div>
                  </div>
                )}

                {/* Title Input */}
                <div className="mb-6">
                  <label htmlFor="vision-board-title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Vision Board Title
                  </label>
                  <input
                    id="vision-board-title"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g., My 2025 Goals, Dream Life, Career Aspirations"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={uploading}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Text Content Input */}
                <div className="mb-6">
                  <label htmlFor="vision-text-content" className="block text-sm font-semibold text-gray-700 mb-2">
                    Vision Statement (Optional - 1 to 3 sentences)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    💡 Tip: Add 1-3 sentences. End each with a period (.), exclamation mark (!), or question mark (?).
                  </p>
                  <textarea
                    id="vision-text-content"
                    value={textContent}
                    onChange={handleTextContentChange}
                    placeholder="Example: I want to achieve my goals this year. I will work hard and stay focused. Success is within my reach!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    disabled={uploading}
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      countSentences(textContent) >= 1 && countSentences(textContent) <= 3 
                        ? 'text-green-600' 
                        : countSentences(textContent) > 3 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      {countSentences(textContent)} sentence(s) {
                        countSentences(textContent) >= 1 && countSentences(textContent) <= 3 
                          ? '✓' 
                          : countSentences(textContent) > 3 
                          ? '(max 3)' 
                          : '(1-3 needed)'
                      }
                    </p>
                    <p className="text-xs text-gray-500">{textContent.length}/500 characters</p>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="mb-6">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer transition-all"
                    style={{ borderColor: 'rgb(209, 213, 219)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#f59f0a';
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(209, 213, 219)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-700">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF, or WEBP (Max 5MB per image)
                      </p>
                      <p className="text-xs font-medium mt-2" style={{ color: '#f59f0a' }}>
                        {selectedImages.length} / 9 images selected
                      </p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={uploading || selectedImages.length >= 9}
                    />
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Images</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={uploading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {previews.length === 0 && (
                  <div className="text-center py-8">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No images selected yet</p>
                    <p className="text-sm text-gray-400 mt-1">Upload 9 images to create your vision board</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedImages.length !== 9 || uploading}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                    style={{ 
                      backgroundColor: selectedImages.length === 9 && !uploading ? '#f59f0a' : '#9ca3af',
                      cursor: selectedImages.length === 9 && !uploading ? 'pointer' : 'not-allowed',
                      opacity: selectedImages.length === 9 && !uploading ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (selectedImages.length === 9 && !uploading) {
                        e.currentTarget.style.backgroundColor = '#d97706';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImages.length === 9 && !uploading) {
                        e.currentTarget.style.backgroundColor = '#f59f0a';
                      }
                    }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Vision Board'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateVisionBoardModal;
