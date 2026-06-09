import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Edit2,
  Mail,
  Phone,
  Building,
  GraduationCap,
  BookOpen,
  Award,
  FileText,
  User,
  Users,
  Briefcase,

  Plus,
  X,
  Camera,
  Save,
  Loader2,
  Rocket,
  Trash2,
  Trash,
  MapPinHouse,
  Upload,
  Shield,
  QrCode,
  CheckCircle2,
  Link as LinkIcon,
  ArrowLeft
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl } from "@/services/api";
import useUser from "@/hooks/useUser";
import useAvatar from "@/hooks/useAvatar";

import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import BadgeGallery from "@/components/badges/BadgeGallery";
import PageTransition from "@/components/PageTransition";
import ImageCropperModal from "@/components/ImageCropperModal";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: userLoading, refreshUser } = useUser();
  const { avatarData } = useAvatar();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    yearOfStudy: "",
    department: "",
    studentId: "",
    dateOfBirth: "",
    street: "",
    city: "",
    state: "",
    country: "",
    address: "",
    // New Comprehensive Fields
    gender: "",
    educationLevel: "",
    nickname: "",
    tenthDetails: null,
    twelfthDetails: null,
    higherEducation: null,
    jobPreferences: null,
    sectorPreferences: null,
    careerGoals: null,
    personalDevelopmentGoals: null,
    workExperience: [],
    projects: [],
    certificates: [],
    extracurricular: []
  });

  const getPreviewUrl = (url) => {
    if (!url) return "#";
    // Check if it's a Cloudinary URL
    if (url.includes("cloudinary.com") && url.includes("/upload/fl_attachment/")) {
      // Remove fl_attachment flag to allow browser display
      return url.replace("/upload/fl_attachment/", "/upload/");
    }
    return url;
  };

  const [activeTab, setActiveTab] = useState("info"); // 'info' or 'badges'

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [memberSince, setMemberSince] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", profilePhoto: null });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const fileInputRef = useRef(null);

  // Section Editing State
  const [activeEditSection, setActiveEditSection] = useState(null); // e.g., 'personal', 'address', 'education', etc.
  const [editFormData, setEditFormData] = useState({});
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Certificate Specific Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState(null);
  const [certFormData, setCertFormData] = useState({
    title: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    verificationUrl: "",
    qrCodeIdentifier: "",
    certificateFile: "",
  });
  const [certDragActive, setCertDragActive] = useState(false);
  const [uploadingCertFile, setUploadingCertFile] = useState(false);

  const handleOpenCertificateModal = (index = null) => {
    if (index !== null) {
      setEditingCertIndex(index);
      const cert = formData.certificates[index];
      setCertFormData({
        title: cert.title || "",
        issuer: cert.issuer || cert.issuingOrg || "",
        issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : "",
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : "",
        verificationUrl: cert.verificationUrl || cert.link || "",
        qrCodeIdentifier: cert.qrCodeIdentifier || cert.id || "",
        certificateFile: cert.certificateFile || cert.link || "",
      });
    } else {
      setEditingCertIndex(null);
      setCertFormData({
        title: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        verificationUrl: "",
        qrCodeIdentifier: "",
        certificateFile: "",
      });
    }
    setShowCertModal(true);
  };

  const handleSaveCertificate = async (e) => {
    if (e) e.preventDefault();
    if (!certFormData.title) {
      toast.error("Certificate Title is required");
      return;
    }

    setSavingProfile(true);
    try {
      const updatedCerts = [...formData.certificates];
      const certPayload = {
        id: certFormData.qrCodeIdentifier || Math.random().toString(36).substr(2, 9),
        title: certFormData.title,
        issuer: certFormData.issuer,
        issuingOrg: certFormData.issuer,
        issueDate: certFormData.issueDate,
        expiryDate: certFormData.expiryDate,
        verificationUrl: certFormData.verificationUrl,
        link: certFormData.verificationUrl || certFormData.certificateFile,
        qrCodeIdentifier: certFormData.qrCodeIdentifier,
        certificateFile: certFormData.certificateFile,
      };

      if (editingCertIndex !== null) {
        updatedCerts[editingCertIndex] = certPayload;
      } else {
        updatedCerts.push(certPayload);
      }

      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'certificates',
          data: updatedCerts
        })
      });

      if (response.ok) {
        toast.success(editingCertIndex !== null ? "Certificate updated successfully" : "Certificate added successfully");
        await refreshUser();
        setShowCertModal(false);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to save certificate");
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteCertificate = async (index) => {
    if (!window.confirm("Are you sure you want to remove this certificate?")) return;

    setSavingProfile(true);
    try {
      const updatedCerts = formData.certificates.filter((_, idx) => idx !== index);

      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'certificates',
          data: updatedCerts
        })
      });

      if (response.ok) {
        toast.success("Certificate removed successfully");
        await refreshUser();
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to delete certificate");
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCertDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCertDragActive(true);
    } else if (e.type === "dragleave") {
      setCertDragActive(false);
    }
  };

  const handleCertDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCertDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleCertFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCertFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleCertFileUpload(e.target.files[0]);
    }
  };

  const handleCertFileUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setUploadingCertFile(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();
      if (data.url) {
        setCertFormData(prev => ({ ...prev, certificateFile: data.url }));
        toast.success('Certificate file uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading certificate file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingCertFile(false);
    }
  };

  // Force refresh user details on mount to get latest badges/progress
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!userLoading && !user) {
        navigate("/");
        return;
      }

      if (user) {
        try {
          // Fetch full registration details if email is available
          let registrationData = {};
          if (user.email) {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              registrationData = await response.json();
            }
          }

          // Helper to extract string from potential JSON object for institution
          const parseInstitution = (inst) => {
            try {
              if (typeof inst === 'string' && inst.trim().startsWith('{')) {
                const parsed = JSON.parse(inst);
                return parsed.name || inst;
              }
              return inst;
            } catch (e) {
              return inst;
            }
          };

          // Combine user data with registration data
          // Registration data takes precedence for detailed fields
          const reg = registrationData || user.otherDetails || {};

          const newFormData = {
            name: user.fullName || reg.fullName || "",
            email: user.email || reg.email || "",
            phone: user.mobileNumber || reg.mobileNumber || "",
            institution: parseInstitution(user.institution || reg.institution) || "",
            yearOfStudy: user.yearOfStudy || user.yearSemester || reg.yearOfStudy || reg.yearSemester || "",
            department: user.department || reg.department || "",
            studentId: user.studentId || reg.studentId || "",
            dateOfBirth: (user.dob || reg.dob) ? new Date(user.dob || reg.dob).toISOString().split('T')[0] : "",
            street: (user.address || reg.address)?.street || "",
            city: (user.address || reg.address)?.city || "",
            state: (user.address || reg.address)?.state || "",
            country: (user.address || reg.address)?.country || "",
            address: (user.address || reg.address) ?
              `${(user.address || reg.address).city || ""}`
                .replace(new RegExp("^,\\s*"), '')
                .replace(new RegExp(",\\s*$"), '')
                .replace(new RegExp("(,\\s*)+", "g"), ', ')
              : "",

            // New Comprehensive Fields
            gender: user.gender || reg.gender || "",
            educationLevel: reg.educationLevel || "",
            nickname: reg.nickname || "",
            tenthDetails: reg.tenthDetails || null,
            twelfthDetails: reg.twelfthDetails || null,
            higherEducation: reg.higherEducation || null,
            jobPreferences: reg.jobPreferences || null,
            sectorPreferences: reg.sectorPreferences || null,
            careerGoals: reg.careerGoals || null,
            personalDevelopmentGoals: reg.personalDevelopmentGoals || null,
            workExperience: Array.isArray(reg.workExperience) ? reg.workExperience : [],
            projects: Array.isArray(reg.projects) ? reg.projects : [],
            certificates: Array.isArray(reg.certificates) ? reg.certificates : [],
            extracurricular: Array.isArray(reg.extracurricular) ? reg.extracurricular : []
          };

          setFormData(newFormData);

          if (user.createdAt) {
            const date = new Date(user.createdAt);
            setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            // Check if account is less than 30 days old
            const daysSinceCreation = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
            setIsNewUser(daysSinceCreation < 30);
          }

          // Profile photo: check root level first (new structure), then fallback to otherDetails
          const photoPath = user.profilePhoto || user.profileImage || user.otherDetails?.profilePhoto || user.otherDetails?.profileImage || registrationData.profilePhoto;
          if (photoPath) {
            // If it's already a full URL (Cloudinary), use it directly; otherwise prepend backend URL
            const fullUrl = photoPath.startsWith('http') ? photoPath : `${getBackendUrl()}/${photoPath}`;
            setProfilePhoto(fullUrl);
          }

          // Fetch enrolled courses
          fetchEnrolledCourses(user._id || user.id);
        } catch (error) {
          console.error("Error loading profile data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfileData();
  }, [user, userLoading, navigate]);

  const fetchEnrolledCourses = async (userId) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!userId || !token) return;
      const response = await fetch(
        API_BASE_URL.replace('/api', '') + `/api/courseEnrollments/student/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setEnrolledCourses(data.data);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  // Handle profile photo upload selection (pre-crop)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset so the same file can be selected again
  };

  // Handle cropped image upload and save to profile
  const handleCroppedPhotoUpload = async (croppedBlob) => {
    setUploadingPhoto(true);
    const formDataUpload = new FormData();
    const file = new File([croppedBlob], "profile-photo.jpg", { type: "image/jpeg" });
    formDataUpload.append('file', file);

    try {
      // 1. Upload the cropped image blob
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();
      
      if (data.url) {
        // 2. Save the uploaded photo path directly to the user profile
        const saveResponse = await fetch(`${API_BASE_URL}/users/register-section`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            section: 'profilePhoto',
            data: {
              profilePhoto: data.url
            }
          })
        });

        if (saveResponse.ok) {
          const fullUrl = data.url.startsWith('http') ? data.url : `${getBackendUrl()}/${data.url}`;
          setProfilePhoto(fullUrl);
          await refreshUser();
          setCropperOpen(false);
          setShowEditModal(false);
          toast.success('Profile photo updated successfully');
        } else {
          toast.error('Failed to save profile photo');
        }
      } else {
        toast.error('Failed to upload cropped photo');
      }
    } catch (error) {
      console.error('Error uploading cropped photo:', error);
      toast.error('Failed to upload cropped photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();
      if (data.url) {
        setEditData(prev => ({ ...prev, profilePhoto: data.url }));
        toast.success('Photo uploaded successfully');
      } else {
        toast.error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save profile changes (Photo only)
  const handleSaveProfile = async () => {
    if (!user?.email || !editData.profilePhoto) return;

    setSavingProfile(true);
    try {
      // 1. Update Profile Photo in Registration Data
      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'profilePhoto',
          data: {
            // Only update profile photo, preserve existing name
            profilePhoto: editData.profilePhoto
          }
        })
      });

      if (response.ok) {
        const fullUrl = editData.profilePhoto.startsWith('http') ? editData.profilePhoto : `${getBackendUrl()}/${editData.profilePhoto}`;
        setProfilePhoto(fullUrl);
        await refreshUser();
        toast.success('Profile photo updated successfully');
        setShowEditModal(false);
      } else {
        toast.error('Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile photo');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenEditModal = (section, initialData) => {
    setActiveEditSection(section);
    setEditFormData(JSON.parse(JSON.stringify(initialData))); // Deep clone
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    if (!user?.email || !activeEditSection) return;

    setSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: activeEditSection,
          data: editFormData
        })
      });

      if (response.ok) {
        toast.success(`${activeEditSection.charAt(0).toUpperCase() + activeEditSection.slice(1)} updated successfully`);
        await refreshUser();
        setShowSectionModal(false);
      } else {
        const err = await response.json();
        toast.error(err.message || `Failed to update ${activeEditSection}`);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatSectionTitle = (title) => {
    if (!title) return "";
    return title
      .replace(new RegExp("([A-Z])", "g"), ' $1')
      .replace(new RegExp("^."), str => str.toUpperCase())
      .trim();
  };

  // Profile.jsx

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] pb-12 transition-colors duration-300">
          {loading ? (
            <ProfileSkeleton />
          ) : (
            <main className="container mx-auto px-4 py-6 max-w-6xl">
              {/* Back Button - Mobile Only */}
              <div className="mb-4 md:hidden">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </button>
              </div>

              {/* Header section with page title */}
              <div className="mb-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t("profile_page.my_profile")}</h1>
              </div>

              {/* Profile Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#002147] rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8 flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 mb-6"
              >
                <div className="relative group flex-shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-4 border-white dark:border-white/8 shadow-lg">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        {getInitials(formData.name)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 bg-[#1a3884] dark:bg-[#1a3884] rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                <div className="text-center md:text-left flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-center md:items-end gap-2 md:gap-4 mb-2 flex-wrap justify-center md:justify-start">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate max-w-full">
                      {formData.name || t("profile_page.student")}
                    </h2>

                     {/* Active Status Badge - Responsive next to name */}
                    <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 px-2.5 py-1 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">{t("profile_page.active")}</span>
                    </div>
                  </div>
                  <p className="font-medium text-lg text-slate-500 dark:text-slate-400">
                    {t("profile_page.student")}
                  </p>

                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 mt-4">
                    <div className="flex items-center gap-1.5 text-center md:text-left min-w-0">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{formData.address || t("profile_page.not_specified")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-center md:text-left min-w-0">
                      <Building className="w-4 h-4 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{formData.institution || t("profile_page.institution_not_set")}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Personal Information Card */}
                  <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.personal_information")}</h3>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal('personalDetails', {
                          fullName: formData.name,
                          nickname: formData.nickname,
                          mobileNumber: formData.phone,
                          dob: formData.dateOfBirth,
                          gender: formData.gender,
                          educationLevel: formData.educationLevel,
                          department: formData.department
                        })}
                        className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                      >
                        {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <hr className="my-6 border-gray-200 dark:border-white/10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                      <InfoField label={t("profile_page.full_name")} value={formData.name} />
                      <InfoField label={t("profile_page.email_address")} value={formData.email} />
                      <InfoField label={t("profile_page.phone_number")} value={formData.phone || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.date_of_birth")} value={formatDate(formData.dateOfBirth)} />
                      <InfoField label={t("profile_page.gender")} value={formData.gender || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.user_role")} value={t("profile_page.student")} />
                      <InfoField label={t("profile_page.member_since")} value={memberSince || t("profile_page.not_available")} />
                      <InfoField label={t("profile_page.education_level")} value={formData.educationLevel || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.department")} value={formData.department || t("profile_page.not_set")} />
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                          <MapPinHouse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.address")}</h3>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal('address', {
                          street: formData.street,
                          city: formData.city,
                          state: formData.state,
                          country: formData.country
                        })}
                        className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                      >
                        {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <hr className="my-6 border-gray-200 dark:border-white/10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                      <InfoField label={t("profile_page.street")} value={formData.street || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.city")} value={formData.city || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.state")} value={formData.state || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.country")} value={formData.country || t("profile_page.not_specified")} />
                    </div>
                  </div>

                  {/* Education Card */}
                  {(formData.higherEducation?.length > 0 || formData.tenthDetails || formData.twelfthDetails) && (
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex justify-between items-center mb-8">
                        <div className="flex gap-2 items-center">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.educational_history")}</h3>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {formData.higherEducation && formData.higherEducation.length > 0 ? (
                          formData.higherEducation.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8 w-full">
                              <div className="flex-1">
                                <div className="flex flex-col gap-1 mb-2">
                                  <h5 className="font-bold text-gray-900 dark:text-white">{t("profile_page.higher_education")}</h5>
                                  <hr className="my-3 border-gray-200 dark:border-white/10" />
                                  <h6 className="font-semibold text-gray-900 dark:text-white">
                                    {edu.institutionName} {edu.location && <span className="text-gray-400 font-normal">| {edu.location}</span>}
                                  </h6>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-300">
                                  {edu.degreeFullName || edu.degree} {edu.specialization && <span>• {edu.specialization}</span>}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{t("profile_page.passing_year")}: {edu.yearOfPassing} • {t("profile_page.grade")}: {edu.cgpaPercentage}%</p>
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('higherEducation', formData.higherEducation)}
                                className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/8 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-gray-500 dark:text-slate-300 mb-3">{t("profile_page.no_higher_education")}</p>
                            <button
                              onClick={() => handleOpenEditModal('higherEducation', [])}
                              className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm"
                            >
                              <Plus className="w-4 h-4" /> {t("profile_page.add_higher_education")}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.twelfthDetails && (
                            <div className="flex justify-between items-start p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8 w-full">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white">{t("profile_page.twelfth_standard")}</h4>
                                <hr className="my-3 border-gray-200 dark:border-white/10" />
                                <p className="text-sm text-gray-500 dark:text-slate-300">{formData.twelfthDetails.schoolName}</p>
                                <p className="text-xs text-gray-400 mt-1">{formData.twelfthDetails.percentage}% • {formData.twelfthDetails.yearOfPassing}</p>
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('twelfthDetails', formData.twelfthDetails)}
                                className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {formData.tenthDetails && (
                            <div className="flex justify-between items-start p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8 w-full">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white">{t("profile_page.tenth_standard")}</h4>
                                <hr className="w-full my-3 border-gray-200 dark:border-white/10" />
                                <p className="text-sm text-gray-500 dark:text-slate-300">{formData.tenthDetails.schoolName}</p>
                                <p className="text-xs text-gray-400 mt-1">{formData.tenthDetails.percentage}% • {formData.tenthDetails.yearOfPassing}</p>
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('tenthDetails', formData.tenthDetails)}
                                className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Experience & Achievements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Work Experience */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.work_experience")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('workExperience', formData.workExperience)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.workExperience && formData.workExperience.length > 0 ? (
                          formData.workExperience.map((exp, idx) => (
                            <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8">
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {exp.companyName || exp.organization} {exp.location && <span className="text-gray-400 font-normal text-xs ml-1">| {exp.location}</span>}
                              </h4>
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{exp.role || exp.title}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{exp.duration || t("profile_page.not_set")}</span>
                              </div>
                              {exp.description && (
                                <p className="text-xs text-gray-600 dark:text-slate-300 mt-2 line-clamp-2">{exp.description}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_work_experience")}</p>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.projects")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('projects', formData.projects)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.projects && formData.projects.length > 0 ? (
                          formData.projects.map((project, idx) => (
                            <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8">
                              <h4 className="font-bold text-gray-900 dark:text-white">{project.title}</h4>
                              {project.link && (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1">
                                  {t("profile_page.view_project")} <Plus className="w-2 h-2" />
                                </a>
                              )}
                              <p className="text-xs text-gray-600 dark:text-slate-300 mt-2">{project.description}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_projects")}</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.certifications")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenCertificateModal()}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-[#859DF4] px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.add")} <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formData.certificates && formData.certificates.length > 0 ? (
                          formData.certificates.map((cert, idx) => (
                            <div key={idx} className="p-5 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8 relative group transition-all hover:shadow-sm">
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenCertificateModal(idx)}
                                  className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:scale-105 transition-transform"
                                  title={t("profile_page.edit_certificate")}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCertificate(idx)}
                                  className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg hover:scale-105 transition-transform"
                                  title="Delete Certificate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm pr-12 truncate">{cert.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{cert.issuer || cert.issuingOrg}</p>

                              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-400">
                                {cert.issueDate && (
                                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {t("profile_page.issued")}: {new Date(cert.issueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {cert.qrCodeIdentifier && (
                                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {t("profile_page.id")}: {cert.qrCodeIdentifier}
                                  </span>
                                )}
                              </div>

                              {(cert.certificateFile || cert.link) && (
                                <a href={getPreviewUrl(cert.certificateFile || cert.link)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 inline-block hover:underline">
                                  {t("profile_page.view_certificate")}
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic col-span-2">{t("profile_page.no_certificates")}</p>
                        )}
                      </div>
                    </div>

                    {/* Extracurricular & Others */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex-shrink-0">
                            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{t("profile_page.extracurricular")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('extracurricular', formData.extracurricular)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors shadow-sm flex-shrink-0"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        {formData.extracurricular && formData.extracurricular.length > 0 ? (
                          formData.extracurricular.map((item, idx) => (
                            <div key={idx} className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                  {typeof item === 'string' ? item : item.activityType}
                                </h4>
                                {item.level && (
                                  <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                    {item.level}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              {item.achievements && (
                                <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-2 font-medium italic">
                                  🏆 {item.achievements}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_extracurricular")}</p>
                        )}
                      </div>
                    </div>

                    {/* Career Preferences */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.career_preferences")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('jobPreferences', formData.jobPreferences)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.jobPreferences && formData.jobPreferences.length > 0 ? (
                          formData.jobPreferences.map((job, idx) => (
                            <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8">
                              <h4 className="font-bold text-gray-900 dark:text-white">{job.preferredRole}</h4>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t("profile_page.job_type")}</p>
                                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-100">{job.jobType}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t("profile_page.preferred_location")}</p>
                                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-100">{job.preferredLocation}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_job_preferences")}</p>
                        )}
                      </div>
                    </div>

                    {/* Goals */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl">
                            <Rocket className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.career_goals")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('careerGoals', formData.careerGoals)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.careerGoals ? (
                          <>
                            <GoalItem label={t("profile_page.short_term")} value={formData.careerGoals.shortTerm} />
                            <GoalItem label={t("profile_page.medium_term")} value={formData.careerGoals.mediumTerm} />
                            <GoalItem label={t("profile_page.long_term")} value={formData.careerGoals.longTerm} />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Profile Photo Modal */}
              <AnimatePresence>
                {showEditModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                    onClick={() => setShowEditModal(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-[#002147] rounded-3xl shadow-2xl max-w-md w-full p-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.change_profile_photo")}</h3>
                        <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#002A5C] transition-colors">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-4 border-white dark:border-white/8 shadow-xl">
                            {editData.profilePhoto ? (
                              <img 
                                src={editData.profilePhoto.startsWith('http') ? editData.profilePhoto : `${getBackendUrl()}/${editData.profilePhoto}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-4xl font-bold text-white">{getInitials(editData.name)}</span>
                            )}
                          </div>
                          <label className="absolute bottom-1 right-1 w-10 h-10 bg-[#1a3884] dark:bg-[#1a3884] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                            {uploadingPhoto ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" disabled={uploadingPhoto} />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-700 dark:text-slate-200 font-bold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-colors">{t("profile_page.cancel")}</button>
                        <button onClick={handleSaveProfile} disabled={savingProfile || uploadingPhoto || !editData.profilePhoto} className="flex-1 py-3 px-4 bg-[#1a3884] text-white rounded-2xl font-bold hover:bg-[#277a84] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("profile_page.save")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image Cropper Modal */}
              <ImageCropperModal
                isOpen={cropperOpen}
                imageSrc={cropperImageSrc}
                onClose={() => setCropperOpen(false)}
                onCrop={handleCroppedPhotoUpload}
                isSaving={uploadingPhoto}
              />

              {/* Global Section Edit Modal */}
              <AnimatePresence>
                {showSectionModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4 overflow-y-auto"
                    onClick={() => setShowSectionModal(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-[#002147] rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-2xl w-full p-5 sm:p-6 md:p-8 max-h-[92vh] overflow-y-auto scrollbar-thin my-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-[#002147] z-10 pb-3 border-b border-gray-100 dark:border-white/8">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t("profile_page.edit")} {formatSectionTitle(activeEditSection)}</h3>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Keep your profile up to date for better opportunities</p>
                        </div>
                        <button onClick={() => setShowSectionModal(false)} className="p-2 sm:p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#002A5C] transition-colors">
                          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </button>
                      </div>

                      <div className="space-y-5 sm:space-y-6">
                        {activeEditSection === 'personalDetails' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput label="Full Name" value={editFormData.fullName} onChange={(val) => setEditFormData({ ...editFormData, fullName: val })} />
                            <ModalInput label="Nick Name" value={editFormData.nickname} onChange={(val) => setEditFormData({ ...editFormData, nickname: val })} />
                            <ModalInput label="Phone Number" value={editFormData.mobileNumber} onChange={(val) => setEditFormData({ ...editFormData, mobileNumber: val })} />
                            <ModalInput label="Date of Birth" type="date" value={editFormData.dob} onChange={(val) => setEditFormData({ ...editFormData, dob: val })} />
                            <ModalSelect label="Gender" value={editFormData.gender} options={['Male', 'Female', 'Other']} onChange={(val) => setEditFormData({ ...editFormData, gender: val })} />
                            <ModalInput label="Department" value={editFormData.department} onChange={(val) => setEditFormData({ ...editFormData, department: val })} />
                          </div>
                        )}
                        {activeEditSection === 'address' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput label="Street" value={editFormData.street} onChange={(val) => setEditFormData({ ...editFormData, street: val })} />
                            <ModalInput label="City" value={editFormData.city} onChange={(val) => setEditFormData({ ...editFormData, city: val })} />
                            <ModalInput label="State" value={editFormData.state} onChange={(val) => setEditFormData({ ...editFormData, state: val })} />
                            <ModalInput label="Country" value={editFormData.country} onChange={(val) => setEditFormData({ ...editFormData, country: val })} />
                          </div>
                        )}
                        {activeEditSection === 'twelfthDetails' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput label="School Name" value={editFormData.schoolName} onChange={(val) => setEditFormData({ ...editFormData, schoolName: val })} />
                            <ModalInput label="Board" value={editFormData.board} onChange={(val) => setEditFormData({ ...editFormData, board: val })} />
                            <ModalInput label="Percentage" value={editFormData.percentage} onChange={(val) => setEditFormData({ ...editFormData, percentage: val })} />
                            <ModalInput label="Year of Passing" value={editFormData.yearOfPassing} onChange={(val) => setEditFormData({ ...editFormData, yearOfPassing: val })} />
                          </div>
                        )}
                        {activeEditSection === 'tenthDetails' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput label="School Name" value={editFormData.schoolName} onChange={(val) => setEditFormData({ ...editFormData, schoolName: val })} />
                            <ModalInput label="Board" value={editFormData.board} onChange={(val) => setEditFormData({ ...editFormData, board: val })} />
                            <ModalInput label="Percentage" value={editFormData.percentage} onChange={(val) => setEditFormData({ ...editFormData, percentage: val })} />
                            <ModalInput label="Year of Passing" value={editFormData.yearOfPassing} onChange={(val) => setEditFormData({ ...editFormData, yearOfPassing: val })} />
                          </div>
                        )}
                        {activeEditSection === 'careerGoals' && (
                          <div className="space-y-5 sm:space-y-6">
                            <ModalTextarea label="Short Term Goal" value={editFormData.shortTerm} onChange={(val) => setEditFormData({ ...editFormData, shortTerm: val })} />
                            <ModalTextarea label="Medium Term Goal" value={editFormData.mediumTerm} onChange={(val) => setEditFormData({ ...editFormData, mediumTerm: val })} />
                            <ModalTextarea label="Long Term Goal" value={editFormData.longTerm} onChange={(val) => setEditFormData({ ...editFormData, longTerm: val })} />
                          </div>
                        )}
                        {['higherEducation', 'workExperience', 'projects', 'jobPreferences', 'extracurricular'].includes(activeEditSection) && (
                          <div className="space-y-6 sm:space-y-8">
                            {Array.isArray(editFormData) && editFormData.map((item, idx) => (
                              <div key={idx} className="p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#002A5C] rounded-[20px] sm:rounded-3xl border border-gray-100 dark:border-white/10 relative">
                                <button onClick={() => { const newArr = [...editFormData]; newArr.splice(idx, 1); setEditFormData(newArr); }} className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-900 text-red-500 rounded-xl transition-opacity">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {activeEditSection === 'higherEducation' && (
                                    <>
                                      <ModalInput label="Institution" value={item.institutionName} onChange={(v) => { const n = [...editFormData]; n[idx].institutionName = v; setEditFormData(n); }} />
                                      <ModalInput label="Location" value={item.location} onChange={(v) => { const n = [...editFormData]; n[idx].location = v; setEditFormData(n); }} />
                                      <ModalInput label="Degree" value={item.degreeFullName} onChange={(v) => { const n = [...editFormData]; n[idx].degreeFullName = v; setEditFormData(n); }} />
                                      <ModalInput label="Specialization" value={item.specialization} onChange={(v) => { const n = [...editFormData]; n[idx].specialization = v; setEditFormData(n); }} />
                                      <ModalInput label="Year" value={item.yearOfPassing} onChange={(v) => { const n = [...editFormData]; n[idx].yearOfPassing = v; setEditFormData(n); }} />
                                      <ModalInput label="CGPA or Score" value={item.cgpaPercentage} onChange={(v) => { const n = [...editFormData]; n[idx].cgpaPercentage = v; setEditFormData(n); }} />
                                    </>
                                  )}
                                  {activeEditSection === 'workExperience' && (
                                    <>
                                      <ModalInput label="Company" value={item.companyName || item.organization} onChange={(v) => { const n = [...editFormData]; n[idx].companyName = v; setEditFormData(n); }} />
                                      <ModalInput label="Role" value={item.role || item.title} onChange={(v) => { const n = [...editFormData]; n[idx].role = v; setEditFormData(n); }} />
                                      <ModalInput label="Location" value={item.location} onChange={(v) => { const n = [...editFormData]; n[idx].location = v; setEditFormData(n); }} />
                                      <ModalInput label="Duration" value={item.duration} onChange={(v) => { const n = [...editFormData]; n[idx].duration = v; setEditFormData(n); }} />
                                      <div className="md:col-span-2"><ModalTextarea label="Description" value={item.description} onChange={(v) => { const n = [...editFormData]; n[idx].description = v; setEditFormData(n); }} /></div>
                                    </>
                                  )}
                                  {activeEditSection === 'projects' && (
                                    <>
                                      <ModalInput label="Project Title" value={item.title} onChange={(v) => { const n = [...editFormData]; n[idx].title = v; setEditFormData(n); }} />
                                      <ModalInput label="Link" value={item.link} onChange={(v) => { const n = [...editFormData]; n[idx].link = v; setEditFormData(n); }} />
                                      <div className="md:col-span-2"><ModalTextarea label="Description" value={item.description} onChange={(v) => { const n = [...editFormData]; n[idx].description = v; setEditFormData(n); }} /></div>
                                    </>
                                  )}
                                  {activeEditSection === 'extracurricular' && (
                                    <>
                                      <ModalInput label="Activity Type" value={typeof item === 'string' ? item : item.activityType} onChange={(v) => { const n = [...editFormData]; n[idx] = typeof item === 'string' ? v : { ...item, activityType: v }; setEditFormData(n); }} />
                                      <ModalInput label="Level" value={item.level} onChange={(v) => { const n = [...editFormData]; n[idx].level = v; setEditFormData(n); }} />
                                      <div className="md:col-span-2"><ModalTextarea label="Description" value={item.description} onChange={(v) => { const n = [...editFormData]; n[idx].description = v; setEditFormData(n); }} /></div>
                                    </>
                                  )}
                                  {activeEditSection === 'jobPreferences' && (
                                    <>
                                      <ModalInput label="Preferred Role" value={item.preferredRole} onChange={(v) => { const n = [...editFormData]; n[idx].preferredRole = v; setEditFormData(n); }} />
                                      <ModalInput label="Location" value={item.preferredLocation || item.preferredLocation1} onChange={(v) => { const n = [...editFormData]; n[idx].preferredLocation = v; setEditFormData(n); }} />
                                      <ModalSelect label="Job Type" value={item.jobType} options={['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote']} onChange={(v) => { const n = [...editFormData]; n[idx].jobType = v; setEditFormData(n); }} />
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newItem = activeEditSection === 'extracurricular' ? { activityType: "", level: "", description: "" }
                                  : activeEditSection === 'workExperience' ? { companyName: "", role: "", duration: "", description: "" }
                                    : activeEditSection === 'projects' ? { title: "", link: "", description: "" }
                                      : activeEditSection === 'jobPreferences' ? { preferredRole: "", preferredLocation: "", jobType: "" }
                                        : { institutionName: "", degreeFullName: "", yearOfPassing: "", cgpaPercentage: "" };
                                setEditFormData([...(Array.isArray(editFormData) ? editFormData : []), newItem]);
                              }}
                              className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/8 rounded-[20px] sm:rounded-[24px] text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                            >
                              <Plus className="w-5 h-5" /> {t("profile_page.add_another_item")}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-8 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white dark:bg-[#002147] pt-3 border-t border-gray-100 dark:border-white/8">
                        <button onClick={() => setShowSectionModal(false)} className="py-3 px-6 rounded-[16px] font-black text-slate-500 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all text-sm order-2 sm:order-1">{t("profile_page.cancel")}</button>
                        <button onClick={handleSaveSection} disabled={savingProfile} className="flex-1 py-3 px-6 bg-[#1a3884] text-white rounded-[16px] font-black hover:bg-[#132c6b] transition-all shadow-xl flex items-center justify-center gap-2 text-sm order-1 sm:order-2">{savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {t("profile_page.save_changes")}</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Premium Certificate Upload Modal */}
              <AnimatePresence>
                {showCertModal && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setShowCertModal(false)}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-[#002147] rounded-[24px] sm:rounded-[32px] w-full max-w-3xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-white/8 scrollbar-thin my-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="px-5 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-white/8 flex items-center justify-between bg-white dark:bg-[#002147] sticky top-0 z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EEF4FF] dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-[#859DF4] dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                              {editingCertIndex !== null ? t("profile_page.edit_certificate") : t("profile_page.upload_certificate")}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">{t("profile_page.add_credential_vault")}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCertModal(false)}
                          type="button"
                          className="p-2 hover:bg-slate-100 dark:hover:bg-[#002A5C] rounded-full transition-colors text-slate-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveCertificate} className="p-5 sm:p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
                          {/* Left Column: Form Fields */}
                          <div className="space-y-4 sm:space-y-5">
                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.certificate_title")}</label>
                              <input
                                required
                                type="text"
                                value={certFormData.title}
                                onChange={(e) => setCertFormData({ ...certFormData, title: e.target.value })}
                                placeholder="e.g. AWS Solutions Architect"
                                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.issuer")}</label>
                              <input
                                required
                                type="text"
                                value={certFormData.issuer}
                                onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value })}
                                placeholder="e.g. Amazon Web Services"
                                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.issue_date")}</label>
                                <input
                                  required
                                  type="date"
                                  value={certFormData.issueDate}
                                  onChange={(e) => setCertFormData({ ...certFormData, issueDate: e.target.value })}
                                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.expiry_optional")}</label>
                                <input
                                  type="date"
                                  value={certFormData.expiryDate}
                                  onChange={(e) => setCertFormData({ ...certFormData, expiryDate: e.target.value })}
                                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.verification_url")}</label>
                              <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="url"
                                  value={certFormData.verificationUrl}
                                  onChange={(e) => setCertFormData({ ...certFormData, verificationUrl: e.target.value })}
                                  placeholder="https://verify.example.com/..."
                                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.verification_code_qr")}</label>
                              <div className="relative">
                                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={certFormData.qrCodeIdentifier}
                                  onChange={(e) => setCertFormData({ ...certFormData, qrCodeIdentifier: e.target.value })}
                                  placeholder="e.g. ABC-123-XYZ"
                                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Column: File Upload */}
                          <div className="flex flex-col h-full">
                            <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.certificate_file_pdf")}</label>
                            <div
                              onDragEnter={handleCertDrag}
                              onDragLeave={handleCertDrag}
                              onDragOver={handleCertDrag}
                              onDrop={handleCertDrop}
                              className={`relative flex-1 min-h-[160px] sm:min-h-[220px] md:min-h-[300px] border-2 border-dashed rounded-[20px] sm:rounded-3xl flex flex-col items-center justify-center p-5 sm:p-6 transition-all ${certDragActive
                                  ? "border-[#859DF4] bg-blue-50/50 dark:bg-blue-900/10"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#001E3D] hover:border-[#859DF4] dark:hover:border-[#859DF4]/50"
                                }`}
                            >
                              {certFormData.certificateFile ? (
                                <div className="text-center p-4">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-emerald-100 dark:border-emerald-800/30">
                                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                                  </div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-1 truncate max-w-[180px] sm:max-w-[220px]">
                                    {certFormData.certificateFile.split('/').pop()}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">{t("profile_page.file_attached_success")}</p>
                                  <button
                                    type="button"
                                    onClick={() => setCertFormData({ ...certFormData, certificateFile: "" })}
                                    className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg"
                                  >
                                    {t("profile_page.remove_file")}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center flex flex-col items-center justify-center h-full">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#EEF4FF] dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    {uploadingCertFile ? (
                                      <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#859DF4] animate-spin" />
                                    ) : (
                                      <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-[#859DF4] dark:text-blue-400" />
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                    {uploadingCertFile ? "Uploading certificate..." : t("profile_page.drag_drop_file")}
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 sm:mb-5 font-medium">PDF, JPG, PNG or WEBP (Max 10MB)</p>
                                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all shadow-sm">
                                    {t("profile_page.browse_files")}
                                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleCertFileSelect} disabled={uploadingCertFile} />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-white dark:bg-[#002147] sticky bottom-0 z-10">
                          <button
                            type="button"
                            onClick={() => setShowCertModal(false)}
                            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all order-2 sm:order-1"
                          >
                            {t("profile_page.cancel")}
                          </button>
                          <button
                            type="submit"
                            disabled={uploadingCertFile || (!certFormData.title)}
                            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-[#859DF4] hover:bg-[#728BE8] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none order-1 sm:order-2"
                          >
                            {savingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("profile_page.saving")}
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                {t("profile_page.save_credential")}
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </main>
          )}
        </div>
      </PageTransition>
    </>
  );
};

// Helper Components for the redesigned layout
const InfoField = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-gray-400 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider mb-1">{label}</span>
      <span className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold break-words" title={value}>
        {value || t("profile_page.not_set")}
      </span>
    </div>
  );
};

const GoalItem = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8">
      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className="text-xs font-semibold text-gray-700 dark:text-slate-100 leading-relaxed">{value || t("profile_page.no_goal_set")}</p>
    </div>
  );
};

const ModalInput = ({ label, value, onChange, type = "text" }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
        placeholder={`${t("profile_page.enter")} ${label}`}
      />
    </div>
  );
};

const ModalSelect = ({ label, value, options, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none appearance-none"
      >
        <option value="">{t("profile_page.select")} {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

const ModalTextarea = ({ label, value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none resize-none"
        placeholder={`${t("profile_page.enter_your")} ${label}...`}
      />
    </div>
  );
};

export default Profile;
