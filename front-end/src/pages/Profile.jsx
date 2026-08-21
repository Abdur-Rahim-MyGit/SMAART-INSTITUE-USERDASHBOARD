import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  IconMapPin,
  IconCalendar,
  IconClock,
  IconChevronRight,
  IconPencil,
  IconPencil as Edit2,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBuilding as Building,
  IconSchool,
  IconSchool as GraduationCap,
  IconBook,
  IconAward,
  IconAward as Award,
  IconFileText,
  IconFileText as FileText,
  IconUser,
  IconUsers,
  IconUsers as Users,
  IconBriefcase,
  IconBriefcase as Briefcase,
  IconPlus,
  IconPlus as Plus,
  IconX,
  IconX as X,
  IconCamera,
  IconCamera as Camera,
  IconDeviceFloppy,
  IconDeviceFloppy as Save,
  IconLoader2,
  IconLoader2 as Loader2,
  IconRocket,
  IconRocket as Rocket,
  IconTrash,
  IconTrash as Trash2,
  IconMapPin as IconMapPinHouse,
  IconUpload,
  IconUpload as Upload,
  IconShield,
  IconShield as Shield,
  IconQrcode,
  IconQrcode as QrCode,
  IconCircleCheck,
  IconCircleCheck as CheckCircle2,
  IconLink,
  IconLink as LinkIcon,
  IconArrowLeft,
  IconId,
  IconGenderBigender,
  IconCertificate,
  IconTargetArrow,
} from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl, apiCall } from "@/services/api";
import useUser from "@/hooks/useUser";
import useAvatar from "@/hooks/useAvatar";
import { getStates, getDistricts, getCities, getPincodeForCity } from "@/services/indiaLocationService";

import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import BadgeGallery from "@/components/badges/BadgeGallery";
import PageTransition from "@/components/PageTransition";
import ImageCropperModal from "@/components/ImageCropperModal";

const yearOptions = Array.from({ length: 30 }, (_, i) => String(2010 + i));

const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch (e) {
    return "";
  }
};

const calculateDuration = (startDate, endDate, currentlyWorking) => {
  if (!startDate) return "";
  const start = new Date(startDate);
  const end = currentlyWorking ? new Date() : (endDate ? new Date(endDate) : new Date());
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let durationStr = "";
  if (years > 0) {
    durationStr += `${years} yr${years > 1 ? 's' : ''} `;
  }
  if (remainingMonths > 0 || years === 0) {
    durationStr += `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  }
  if (currentlyWorking) {
    durationStr += " (Present)";
  }
  return durationStr.trim();
};

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
    rollNumber: "",
    admissionDate: "",
    dateOfBirth: "",
    street: "",
    city: "",
    district: "",
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

  // Degree Options State
  const [degreeOptions, setDegreeOptions] = useState({
    levels: [],
    domains: {}, // mapped by index: [options]
    fullNames: {}, // mapped by index: [options]
    specializations: {} // mapped by index: [options]
  });

  // Generic Degree Option Fetcher
  const fetchDegreeSubOptions = async (type, params, index) => {
    try {
      let endpoint = '';
      if (type === 'domains') endpoint = '/degrees/domains';
      else if (type === 'fullNames') endpoint = '/degrees/fullNames';
      else if (type === 'specializations') endpoint = '/degrees/specializations';

      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`${endpoint}?${queryString}`);

      if (response?.success) {
        setDegreeOptions(prev => ({
          ...prev,
          [type]: { ...prev[type], [index]: response.data }
        }));
      }
    } catch (error) {
      console.error(`Error fetching degree ${type}:`, error);
    }
  };

  const fetchDegreeLevels = async () => {
    try {
      const response = await apiCall('/degrees/levels');
      if (response?.success) {
        setDegreeOptions(prev => ({ ...prev, levels: response.data }));
      }
    } catch (error) {
      console.error("Error fetching degree levels:", error);
    }
  };

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
  });

  const handleOpenCertificateModal = (index = null) => {
    if (index !== null) {
      setEditingCertIndex(index);
      const cert = formData.certificates[index];
      setCertFormData({
        title: cert.title || "",
        issuer: cert.issuer || cert.issuingOrg || "",
        issuingOrg: cert.issuingOrg || cert.issuer || "",
        yearOfCompletion: cert.yearOfCompletion || (cert.issueDate ? new Date(cert.issueDate).getFullYear().toString() : ""),
        verificationType: cert.verificationType || (cert.verificationUrl ? "url" : (cert.qrCodeIdentifier ? "qr" : "none")),
        verificationUrl: cert.verificationUrl || cert.link || "",
        qrCodeIdentifier: cert.qrCodeIdentifier || cert.id || "",
      });
    } else {
      setEditingCertIndex(null);
      setCertFormData({
        title: "",
        issuer: "",
        issuingOrg: "",
        yearOfCompletion: "",
        verificationType: "",
        verificationUrl: "",
        qrCodeIdentifier: "",
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
        issuer: certFormData.issuingOrg || certFormData.issuer,
        issuingOrg: certFormData.issuingOrg || certFormData.issuer,
        yearOfCompletion: certFormData.yearOfCompletion,
        verificationType: certFormData.verificationType,
        issueDate: certFormData.yearOfCompletion ? new Date(certFormData.yearOfCompletion, 0, 1).toISOString() : null,
        verificationUrl: certFormData.verificationType === 'url' ? certFormData.verificationUrl : "",
        link: certFormData.verificationType === 'url' ? certFormData.verificationUrl : "",
        qrCodeIdentifier: certFormData.verificationType === 'qr' ? certFormData.qrCodeIdentifier : "",
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
            department: typeof (user.department || reg.department) === 'object'
              ? ((user.department || reg.department).fullName || (user.department || reg.department).name || "")
              : (user.department || reg.department || ""),
            studentId: user.studentId || reg.studentId || "",
            rollNumber: user.rollNumber || reg.rollNumber || "",
            admissionDate: user.admissionDate || reg.admissionDate || "",
            dateOfBirth: (user.dob || reg.dob) ? new Date(user.dob || reg.dob).toISOString().split('T')[0] : "",
            street: (user.address || reg.address)?.street || "",
            city: (user.address || reg.address)?.city || "",
            district: (user.address || reg.address)?.district || "",
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
            educationLevel: reg.academic?.degreeLevel || user?.academic?.degreeLevel || reg.educationLevel || "",
            nickname: reg.nickname || "",
            tenthDetails: reg.tenthDetails || null,
            twelfthDetails: reg.twelfthDetails || null,
            higherEducation: reg.higherEducation || null,
            sectorPreferences: reg.sectorPreferences || user.sectorPreferences || null,
            careerGoals: reg.careerGoals || user.careerGoals || user.otherDetails?.careerGoals || null,
            personalDevelopmentGoals: reg.personalDevelopmentGoals || user.personalDevelopmentGoals || user.otherDetails?.personalDevelopmentGoals || null,
            workExperience: Array.isArray(reg.workExperience) && reg.workExperience.length ? reg.workExperience : (Array.isArray(user.workExperience) ? user.workExperience : []),
            projects: Array.isArray(reg.projects) && reg.projects.length ? reg.projects : (Array.isArray(user.projects) ? user.projects : []),
            certificates: Array.isArray(reg.certificates) && reg.certificates.length ? reg.certificates : (Array.isArray(user.certificates) ? user.certificates : []),
            extracurricular: Array.isArray(reg.extracurricular) && reg.extracurricular.length ? reg.extracurricular : (Array.isArray(user.extracurricular) ? user.extracurricular : [])
          };

          setFormData(newFormData);

          const admissionDateVal = newFormData.admissionDate || user.admissionDate || reg.admissionDate || user.createdAt;
          if (admissionDateVal) {
            const date = new Date(admissionDateVal);
            setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            const creationDateVal = user.createdAt || admissionDateVal;
            const daysSinceCreation = (Date.now() - new Date(creationDateVal).getTime()) / (1000 * 60 * 60 * 24);
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

  const handleOpenEditModal = async (section, initialData) => {
    setActiveEditSection(section);
    let clonedData;
    if (initialData) {
      clonedData = JSON.parse(JSON.stringify(initialData));
    } else {
      if (['careerGoals', 'personalDevelopmentGoals'].includes(section)) {
        clonedData = { shortTerm: "", mediumTerm: "", longTerm: "" };
      } else if (['workExperience', 'projects', 'extracurricular', 'higherEducation'].includes(section)) {
        clonedData = [];
      } else {
        clonedData = {};
      }
    }
    if (section === 'higherEducation' && Array.isArray(clonedData)) {
      clonedData = clonedData.map(item => ({
        ...item,
        specialization: Array.isArray(item.specialization) ? (item.specialization[0] || "") : (item.specialization || "")
      }));
    }
    setEditFormData(clonedData);
    setShowSectionModal(true);

    if (section === 'higherEducation') {
      await fetchDegreeLevels();
      if (Array.isArray(clonedData)) {
        clonedData.forEach(async (item, idx) => {
          if (item.qualificationLevel) {
            await fetchDegreeSubOptions('domains', { level: item.qualificationLevel }, idx);
          }
          if (item.qualificationLevel && item.degree) {
            await fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: item.degree }, idx);
          }
          if (item.qualificationLevel && item.degree && item.degreeFullName) {
            await fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: item.degreeFullName }, idx);
          }
        });
      }
    }
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
                    <IconArrowLeft stroke={1.5} className="h-4 w-4" />
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
                className="relative bg-white dark:bg-[#002147] rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8 flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 mb-6"
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
                    <IconCamera stroke={1.5} className="w-4 h-4" />
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
                  </div>

                  {/* Active Status Badge - Absolute top right corner */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 px-2.5 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">{t("profile_page.active")}</span>
                  </div>
                  <p className="font-medium text-lg text-slate-500 dark:text-slate-400">
                    {t("profile_page.student")}
                  </p>

                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 mt-4">
                    <div className="flex items-center gap-1.5 text-center md:text-left min-w-0">
                       <IconMapPin stroke={1.5} className="w-4 h-4 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{formData.address || t("profile_page.not_specified")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-center md:text-left min-w-0">
                       <IconBuilding stroke={1.5} className="w-4 h-4 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{formData.institution || t("profile_page.institution_not_set")}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-center md:justify-start">
                    <button
                      onClick={() => navigate('/dashboard/skills-passport')}
                      className="group flex items-center gap-2 bg-gradient-to-r from-[#1a3884] to-[#2d4fa0] hover:from-[#112b6b] hover:to-[#1a3884] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-300"
                    >
                      <IconAward stroke={1.5} className="w-4 h-4" />
                      <span>{t("profile_page.view_skills_passport", "View Skills Passport")}</span>
                      <IconChevronRight stroke={1.5} className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </button>
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
                        <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                          <IconUser stroke={1.5} className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
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
                          studentId: formData.studentId,
                          rollNumber: formData.rollNumber
                        })}
                        className="bg-[#f0f4ff] dark:bg-[#1a3884]/20 border border-[#1a3884]/20 dark:border-[#1a3884]/30 hover:bg-[#e0eaff] dark:hover:bg-[#1a3884]/30 text-[#1a3884] dark:text-blue-300 px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shadow-none"
                      >
                        {t("profile_page.edit")} <IconPencil stroke={1.5} className="w-3.5 h-3.5" />
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
                      <InfoField label={t("profile_page.student_id", "Student ID")} value={formData.studentId || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.roll_number", "Roll Number")} value={formData.rollNumber || t("profile_page.not_set")} />
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                          <IconMapPinHouse stroke={1.5} className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.address")}</h3>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal('address', {
                          street: formData.street,
                          city: formData.city,
                          district: formData.district,
                          state: formData.state,
                          country: formData.country
                        })}
                        className="bg-[#f0f4ff] dark:bg-[#1a3884]/20 border border-[#1a3884]/20 dark:border-[#1a3884]/30 hover:bg-[#e0eaff] dark:hover:bg-[#1a3884]/30 text-[#1a3884] dark:text-blue-300 px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all"
                      >
                        {t("profile_page.edit")} <IconPencil stroke={1.5} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <hr className="my-6 border-gray-200 dark:border-white/10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-12">
                      <InfoField label={t("profile_page.street")} value={formData.street || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.city")} value={formData.city || t("profile_page.not_specified")} />
                      {formData.district && formData.district.trim() !== "" && (
                        <InfoField label={t("profile_page.district", "District")} value={formData.district} />
                      )}
                      <InfoField label={t("profile_page.state")} value={formData.state || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.country")} value={formData.country || t("profile_page.not_specified")} />
                    </div>
                  </div>

                  {/* Education Card */}
                  {(formData.higherEducation?.length > 0 || formData.tenthDetails || formData.twelfthDetails) && (
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex justify-between items-center mb-8">
                        <div className="flex gap-2 items-center">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
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
                                  <h6 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                    <span>{edu.institutionName}</span>
                                    {edu.location && <span className="text-gray-400 font-normal">| {edu.location}</span>}
                                    {edu.degreeStatus && String(edu.degreeStatus).toLowerCase() === 'pursuing' && (
                                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 rounded-full ml-1">
                                        {t("profile_page.pursuing", "Pursuing")}
                                      </span>
                                    )}
                                  </h6>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-300">
                                  {edu.qualificationLevel && <span>{edu.qualificationLevel} • </span>}
                                  {edu.degreeFullName || edu.degree} {edu.specialization && <span>• {edu.specialization}</span>}
                                </p>
                                {(!edu.degreeStatus || String(edu.degreeStatus).toLowerCase() !== 'pursuing') && (
                                  <p className="text-xs text-gray-400 mt-1">{t("profile_page.passing_year")}: {edu.yearOfPassing} • {t("profile_page.grade")}: {edu.cgpaPercentage}%</p>
                                )}
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
                                 <p className="text-xs text-gray-400 mt-1">
                                    {formData.twelfthDetails.stream && <span>{formData.twelfthDetails.stream} • </span>}
                                    {formData.twelfthDetails.percentage}% • {formData.twelfthDetails.yearOfPassing}
                                 </p>
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

                  {/* Academic Performance / CGPA Tracking */}
                  {user?.academic?.semesterPerformances && user.academic.semesterPerformances.length > 0 && (
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2 items-center">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <Rocket stroke={1.5} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Performance</h3>
                        </div>
                        <button
                          onClick={() => navigate('/dashboard/cgpa-calculator')}
                          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm shrink-0"
                        >
                          Update CGPA <IconChevronRight stroke={1.5} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[...user.academic.semesterPerformances]
                          .sort((a, b) => a.semesterNumber - b.semesterNumber)
                          .map((rec, idx) => (
                          <div key={idx} className="border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 bg-emerald-50/30 dark:bg-emerald-900/10 space-y-3 relative overflow-hidden group">
                            <div className="flex justify-between items-center relative z-10">
                              <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Semester {rec.semesterNumber}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
                              <div className="bg-white dark:bg-[#00152E]/80 p-2 rounded-xl border border-gray-100 dark:border-white/5 text-center shadow-sm">
                                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-0.5">SGPA</p>
                                <p className="text-base font-bold text-[#1a3884] dark:text-blue-400">{rec.sgpa ? Number(rec.sgpa).toFixed(2) : '0.00'}</p>
                              </div>
                              <div className="bg-white dark:bg-[#00152E]/80 p-2 rounded-xl border border-gray-100 dark:border-white/5 text-center shadow-sm">
                                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-0.5">Cum. CGPA</p>
                                <p className="text-base font-bold text-purple-700 dark:text-purple-400">{rec.cgpa ? Number(rec.cgpa).toFixed(2) : '0.00'}</p>
                              </div>
                            </div>
                            {rec.creditsEarned && (
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold text-center mt-2 relative z-10">
                                Credits Earned: <span className="text-gray-700 dark:text-slate-200">{rec.creditsEarned}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Experience & Achievements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Work Experience */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <Briefcase className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
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
                          formData.workExperience.map((exp, idx) => {
                            const company = exp.organizationName || exp.companyName || exp.organization || t("profile_page.not_set");
                            const designation = exp.jobTitle || exp.role || exp.title || t("profile_page.not_set");
                            const durationText = exp.duration || calculateDuration(exp.startDate, exp.endDate, exp.currentlyWorking) || (exp.startDate ? `${new Date(exp.startDate).getFullYear()} - ${exp.currentlyWorking ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '')}` : t("profile_page.not_set"));
                            return (
                              <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/8">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                      {company} {exp.location && <span className="text-gray-400 font-normal text-xs ml-1">| {exp.location}</span>}
                                    </h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{designation}</p>
                                  </div>
                                  {exp.experienceType && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                      {exp.experienceType}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <IconClock stroke={1.5} className="w-3.5 h-3.5" />
                                    <span>{durationText}</span>
                                  </div>
                                  {exp.industry && (
                                    <span className="text-gray-400">| {exp.industry}</span>
                                  )}
                                </div>
                                {(exp.description || exp.keyResponsibilities) && (
                                  <p className="text-xs text-gray-600 dark:text-slate-300 mt-2 line-clamp-2">{exp.description || exp.keyResponsibilities}</p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_work_experience")}</p>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <FileText className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
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
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <Award className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.certifications")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenCertificateModal()}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-black dark:text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
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
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl flex-shrink-0">
                            <Users className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
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

                    {/* Career Goals */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <Rocket className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.career_goals", "Career Goals")}</h3>
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
                            <GoalItem label={t("profile_page.short_term", "Short term (0–1 year)")} value={formData.careerGoals.shortTerm} />
                            <GoalItem label={t("profile_page.medium_term", "Medium term (1–5 years)")} value={formData.careerGoals.mediumTerm} />
                            <GoalItem label={t("profile_page.long_term", "Long term (5+ years)")} value={formData.careerGoals.longTerm} />
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_goals_set", "No goals set")}</p>
                        )}
                      </div>
                    </div>

                    {/* Personal Development Goals */}
                    <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/8">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1a3884]/10 dark:bg-[#1a3884]/20 rounded-xl">
                            <Users className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile_page.personal_development_goals", "Personal Development Goals")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('personalDevelopmentGoals', formData.personalDevelopmentGoals)}
                          className="bg-white dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-gray-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.personalDevelopmentGoals ? (
                          <>
                            <GoalItem label={t("profile_page.short_term", "Short term (0–1 year)")} value={formData.personalDevelopmentGoals.shortTerm} />
                            <GoalItem label={t("profile_page.medium_term", "Medium term (1–5 years)")} value={formData.personalDevelopmentGoals.mediumTerm} />
                            <GoalItem label={t("profile_page.long_term", "Long term (5+ years)")} value={formData.personalDevelopmentGoals.longTerm} />
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">{t("profile_page.no_goals_set", "No goals set")}</p>
                        )}
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
                            <ModalInput label="Phone Number" value={editFormData.mobileNumber} onChange={(val) => setEditFormData({ ...editFormData, mobileNumber: val })} />
                            <ModalInput label="Date of Birth" type="date" value={editFormData.dob} onChange={(val) => setEditFormData({ ...editFormData, dob: val })} />
                            <ModalSelect label="Gender" value={editFormData.gender} options={['Male', 'Female', 'Other']} onChange={(val) => setEditFormData({ ...editFormData, gender: val })} />
                          </div>
                        )}
                        {activeEditSection === 'address' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalLocationSelect
                              label="Country"
                              value={editFormData.country}
                              options={["India", "Afghanistan", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "Others"]}
                              onChange={(val) => setEditFormData({
                                ...editFormData,
                                country: val,
                                state: "",
                                district: "",
                                city: ""
                              })}
                            />
                            {editFormData.country === "India" ? (
                              <ModalLocationSelect
                                label="State"
                                value={editFormData.state}
                                options={getStates()}
                                onChange={(val) => setEditFormData({
                                  ...editFormData,
                                  state: val,
                                  district: "",
                                  city: ""
                                })}
                              />
                            ) : (
                              <ModalInput
                                label="State"
                                value={editFormData.state}
                                onChange={(val) => setEditFormData({ ...editFormData, state: val })}
                              />
                            )}
                            {editFormData.country === "India" ? (
                              <ModalLocationSelect
                                label="District"
                                value={editFormData.district}
                                options={editFormData.state ? getDistricts(editFormData.state) : []}
                                disabled={!editFormData.state}
                                onChange={(val) => setEditFormData({
                                  ...editFormData,
                                  district: val,
                                  city: ""
                                })}
                              />
                            ) : (
                              <ModalInput
                                label="District"
                                value={editFormData.district}
                                onChange={(val) => setEditFormData({ ...editFormData, district: val })}
                              />
                            )}
                            {editFormData.country === "India" ? (
                              <ModalLocationSelect
                                label="City"
                                value={editFormData.city}
                                options={editFormData.state && editFormData.district ? Array.from(new Set(getCities(editFormData.state, editFormData.district).map(c => c.city))).sort() : []}
                                disabled={!editFormData.district}
                                onChange={(val) => setEditFormData({
                                  ...editFormData,
                                  city: val
                                })}
                              />
                            ) : (
                              <ModalInput
                                label="City"
                                value={editFormData.city}
                                onChange={(val) => setEditFormData({ ...editFormData, city: val })}
                              />
                            )}
                            <ModalInput
                              label="Street"
                              value={editFormData.street}
                              onChange={(val) => setEditFormData({ ...editFormData, street: val })}
                            />
                          </div>
                        )}
                        {activeEditSection === 'twelfthDetails' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput
                              label="School/College Name"
                              value={editFormData.schoolName}
                              onChange={(val) => setEditFormData({ ...editFormData, schoolName: val })}
                            />
                            <ModalLocationSelect
                              label="Board"
                              value={editFormData.board}
                              options={["State Board", "CBSE", "ISC", "IB", "Others"]}
                              onChange={(val) => setEditFormData({ ...editFormData, board: val })}
                            />
                            <ModalLocationSelect
                              label="Group"
                              value={["Science", "Commerce", "Arts"].includes(editFormData.stream) ? editFormData.stream : (editFormData.stream ? "Others" : "")}
                              options={["Science", "Commerce", "Arts", "Others"]}
                              onChange={(val) => {
                                if (val === "Others") {
                                  setEditFormData({ ...editFormData, stream: "Others" });
                                } else {
                                  setEditFormData({ ...editFormData, stream: val });
                                }
                              }}
                            />
                            {(!["Science", "Commerce", "Arts"].includes(editFormData.stream) || editFormData.stream === "Others") && (
                              <ModalInput
                                label="Specify Group"
                                value={editFormData.stream === "Others" ? "" : editFormData.stream}
                                onChange={(val) => setEditFormData({ ...editFormData, stream: val })}
                              />
                            )}
                            <ModalLocationSelect
                              label="Year of Passing"
                              value={editFormData.yearOfPassing}
                              options={yearOptions}
                              onChange={(val) => setEditFormData({ ...editFormData, yearOfPassing: val })}
                            />
                            <ModalInput
                              label="Percentage / CGPA"
                              type="number"
                              value={editFormData.percentage}
                              onChange={(val) => setEditFormData({ ...editFormData, percentage: val })}
                            />
                          </div>
                        )}
                        {activeEditSection === 'tenthDetails' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <ModalInput
                              label="School Name"
                              value={editFormData.schoolName}
                              onChange={(val) => setEditFormData({ ...editFormData, schoolName: val })}
                            />
                            <ModalLocationSelect
                              label="Board"
                              value={editFormData.board}
                              options={["State Board", "CBSE", "ICSE", "IB", "Others"]}
                              onChange={(val) => setEditFormData({ ...editFormData, board: val })}
                            />
                            <ModalLocationSelect
                              label="Year of Passing"
                              value={editFormData.yearOfPassing}
                              options={yearOptions}
                              onChange={(val) => setEditFormData({ ...editFormData, yearOfPassing: val })}
                            />
                            <ModalInput
                              label="Percentage / CGPA"
                              type="number"
                              value={editFormData.percentage}
                              onChange={(val) => setEditFormData({ ...editFormData, percentage: val })}
                            />
                          </div>
                        )}
                        {activeEditSection === 'careerGoals' && (
                          <div className="space-y-5 sm:space-y-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.short_term_career_desc", "Short-term Goal (0-1 year)")}</label>
                              <ModalTextarea label="Short Term Goal" value={editFormData.shortTerm} onChange={(val) => setEditFormData({ ...editFormData, shortTerm: val })} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.medium_term_career_desc", "Medium-term Goal (1-5 years)")}</label>
                              <ModalTextarea label="Medium Term Goal" value={editFormData.mediumTerm} onChange={(val) => setEditFormData({ ...editFormData, mediumTerm: val })} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.long_term_career_desc", "Long-term Goal (5+ years)")}</label>
                              <ModalTextarea label="Long Term Goal" value={editFormData.longTerm} onChange={(val) => setEditFormData({ ...editFormData, longTerm: val })} />
                            </div>
                          </div>
                        )}
                        {activeEditSection === 'personalDevelopmentGoals' && (
                          <div className="space-y-5 sm:space-y-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.short_term_personal_desc", "Short term (0–1 year)")}</label>
                              <ModalTextarea label="Short Term Goal" value={editFormData.shortTerm} onChange={(val) => setEditFormData({ ...editFormData, shortTerm: val })} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.medium_term_personal_desc", "Medium term (1–5 years)")}</label>
                              <ModalTextarea label="Medium Term Goal" value={editFormData.mediumTerm} onChange={(val) => setEditFormData({ ...editFormData, mediumTerm: val })} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1 mb-1.5">{t("profile_page.long_term_personal_desc", "Long term (5+ years)")}</label>
                              <ModalTextarea label="Long Term Goal" value={editFormData.longTerm} onChange={(val) => setEditFormData({ ...editFormData, longTerm: val })} />
                            </div>
                          </div>
                        )}
                        {['higherEducation', 'workExperience', 'projects', 'extracurricular'].includes(activeEditSection) && (
                          <div className="space-y-6 sm:space-y-8">
                            {Array.isArray(editFormData) && editFormData.map((item, idx) => (
                              <div key={idx} className="p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#002A5C] rounded-[20px] sm:rounded-3xl border border-gray-100 dark:border-white/10 relative">
                                <button onClick={() => { const newArr = [...editFormData]; newArr.splice(idx, 1); setEditFormData(newArr); }} className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-900 text-red-500 rounded-xl transition-opacity">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {activeEditSection === 'higherEducation' && (
                                    <>
                                      <ModalLocationSelect
                                        label="Degree Level"
                                        value={item.qualificationLevel}
                                        options={degreeOptions.levels}
                                        onChange={(val) => {
                                          const n = [...editFormData];
                                          n[idx].qualificationLevel = val;
                                          n[idx].degree = "";
                                          n[idx].degreeFullName = "";
                                          n[idx].specialization = "";
                                          setEditFormData(n);
                                          if (val) fetchDegreeSubOptions('domains', { level: val }, idx);
                                        }}
                                      />
                                      <ModalLocationSelect
                                        label="Domain Field"
                                        value={item.degree}
                                        disabled={!item.qualificationLevel}
                                        options={degreeOptions.domains[idx] || []}
                                        onChange={(val) => {
                                          const n = [...editFormData];
                                          n[idx].degree = val;
                                          n[idx].degreeFullName = "";
                                          n[idx].specialization = "";
                                          setEditFormData(n);
                                          if (val) fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: val }, idx);
                                        }}
                                      />
                                      <ModalLocationSelect
                                        label="Degree Full Name"
                                        value={item.degreeFullName}
                                        disabled={!item.degree}
                                        options={degreeOptions.fullNames[idx] || []}
                                        onChange={(val) => {
                                          const n = [...editFormData];
                                          n[idx].degreeFullName = val;
                                          n[idx].specialization = "";
                                          setEditFormData(n);
                                          if (val) fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: val }, idx);
                                        }}
                                      />
                                      <ModalLocationSelect
                                        label="Specialization"
                                        value={item.specialization}
                                        disabled={!item.degreeFullName}
                                        options={degreeOptions.specializations[idx] || []}
                                        onChange={(val) => {
                                          const n = [...editFormData];
                                          n[idx].specialization = val;
                                          setEditFormData(n);
                                        }}
                                      />
                                      <ModalInput
                                        label="Institution"
                                        value={item.institutionName}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].institutionName = v;
                                          setEditFormData(n);
                                        }}
                                      />
                                      <ModalLocationSelect
                                        label="Status"
                                        value={item.degreeStatus ? item.degreeStatus.charAt(0).toUpperCase() + item.degreeStatus.slice(1) : ""}
                                        options={["Pursuing", "Completed"]}
                                        onChange={(val) => {
                                          const n = [...editFormData];
                                          n[idx].degreeStatus = val.toLowerCase();
                                          if (val.toLowerCase() === 'pursuing') {
                                            n[idx].cgpaPercentage = '';
                                          }
                                          setEditFormData(n);
                                        }}
                                      />
                                      {item.degreeStatus !== 'pursuing' && (
                                        <ModalInput
                                          label="CGPA or Score"
                                          value={item.cgpaPercentage}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].cgpaPercentage = v;
                                            setEditFormData(n);
                                          }}
                                        />
                                      )}
                                    </>
                                  )}
                                  {activeEditSection === 'workExperience' && (
                                    <>
                                      <ModalLocationSelect
                                        label="Experience Type"
                                        value={item.experienceType ? item.experienceType.charAt(0).toUpperCase() + item.experienceType.slice(1) : ""}
                                        options={["Full-Time", "Part-Time", "Internship", "Freelance", "Volunteering"]}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].experienceType = v.toLowerCase();
                                          setEditFormData(n);
                                        }}
                                      />
                                      <ModalInput
                                        label="Organization / Company Name"
                                        value={item.organizationName || item.companyName}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].organizationName = v;
                                          n[idx].companyName = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. Google, Startup Inc"
                                      />
                                      <ModalInput
                                        label="Designation / Role"
                                        value={item.jobTitle || item.role}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].jobTitle = v;
                                          n[idx].role = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. Software Engineer"
                                      />
                                      <ModalInput
                                        label="Industry / Sector"
                                        value={item.industry}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].industry = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. IT, Healthcare"
                                      />
                                      <ModalInput
                                        label="Location"
                                        value={item.location}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].location = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. Remote, City Name"
                                      />
                                      <ModalInput
                                        label="Start Date"
                                        type="date"
                                        value={formatDateForInput(item.startDate)}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].startDate = v;
                                          n[idx].duration = calculateDuration(v, n[idx].endDate, n[idx].currentlyWorking);
                                          setEditFormData(n);
                                        }}
                                      />
                                      {!item.currentlyWorking && (
                                        <ModalInput
                                          label="End Date"
                                          type="date"
                                          value={formatDateForInput(item.endDate)}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].endDate = v;
                                            n[idx].duration = calculateDuration(n[idx].startDate, v, n[idx].currentlyWorking);
                                            setEditFormData(n);
                                          }}
                                        />
                                      )}
                                      <div className="md:col-span-2 flex items-center gap-2 py-2">
                                        <input
                                          type="checkbox"
                                          id={`current-${idx}`}
                                          checked={!!item.currentlyWorking}
                                          onChange={(e) => {
                                            const n = [...editFormData];
                                            n[idx].currentlyWorking = e.target.checked;
                                            if (e.target.checked) {
                                              n[idx].endDate = "";
                                              n[idx].keyResponsibilities = "";
                                              n[idx].significantAccomplishments = "";
                                            }
                                            n[idx].duration = calculateDuration(n[idx].startDate, n[idx].endDate, e.target.checked);
                                            setEditFormData(n);
                                          }}
                                          className="w-4 h-4 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884] dark:bg-slate-800"
                                        />
                                        <label htmlFor={`current-${idx}`} className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                                          Currently working here
                                        </label>
                                      </div>
                                      {!item.currentlyWorking && (
                                        <>
                                          <div className="md:col-span-2">
                                            <ModalTextarea
                                              label="Key Responsibilities"
                                              value={item.keyResponsibilities || item.description}
                                              onChange={(v) => {
                                                const n = [...editFormData];
                                                n[idx].keyResponsibilities = v;
                                                n[idx].description = v;
                                                setEditFormData(n);
                                              }}
                                              placeholder="Outline your primary duties and the scope of your work in this role."
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <ModalTextarea
                                              label="Significant Accomplishments"
                                              value={item.significantAccomplishments}
                                              onChange={(v) => {
                                                const n = [...editFormData];
                                                n[idx].significantAccomplishments = v;
                                                setEditFormData(n);
                                              }}
                                              placeholder="Highlight major achievements, contributions, or impacts you made during your tenure."
                                            />
                                          </div>
                                        </>
                                      )}
                                      {item.currentlyWorking && (
                                        <div className="md:col-span-2">
                                          <ModalTextarea
                                            label="Description"
                                            value={item.description}
                                            onChange={(v) => {
                                              const n = [...editFormData];
                                              n[idx].description = v;
                                              setEditFormData(n);
                                            }}
                                            placeholder="Describe your role and activities here."
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {activeEditSection === 'projects' && (
                                    <>
                                      <ModalInput
                                        label="Project Title"
                                        value={item.title}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].title = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. E-commerce Website"
                                      />
                                      <ModalLocationSelect
                                        label="Project developed in"
                                        value={item.doneIn}
                                        options={["Institution", "Organization", "Others"]}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].doneIn = v;
                                          if (v !== 'Institution') n[idx].institution = "";
                                          if (v !== 'Organization') n[idx].companyName = "";
                                          setEditFormData(n);
                                        }}
                                      />
                                      {item.doneIn === 'Institution' && (
                                        <ModalInput
                                          label="College / University Name"
                                          value={item.institution}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].institution = v;
                                            setEditFormData(n);
                                          }}
                                          placeholder="e.g. Stanford University"
                                        />
                                      )}
                                      {item.doneIn === 'Organization' && (
                                        <ModalInput
                                          label="Company / Organization Name"
                                          value={item.companyName}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].companyName = v;
                                            setEditFormData(n);
                                          }}
                                          placeholder="e.g. Acme Corp"
                                        />
                                      )}
                                      <ModalLocationSelect
                                        label="Team Type"
                                        value={item.teamType}
                                        options={["Individual", "Team"]}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].teamType = v;
                                          setEditFormData(n);
                                        }}
                                      />
                                      <ModalInput
                                        label="Start Date"
                                        type="date"
                                        value={formatDateForInput(item.startDate)}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].startDate = v;
                                          setEditFormData(n);
                                        }}
                                      />
                                      {!item.currentlyWorking && (
                                        <ModalInput
                                          label="End Date"
                                          type="date"
                                          value={formatDateForInput(item.endDate)}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].endDate = v;
                                            setEditFormData(n);
                                          }}
                                        />
                                      )}
                                      <div className="md:col-span-2 flex items-center gap-2 py-2">
                                        <input
                                          type="checkbox"
                                          id={`proj-current-${idx}`}
                                          checked={!!item.currentlyWorking}
                                          onChange={(e) => {
                                            const n = [...editFormData];
                                            n[idx].currentlyWorking = e.target.checked;
                                            if (e.target.checked) {
                                              n[idx].endDate = "";
                                              n[idx].description = "";
                                              n[idx].significantAchievements = "";
                                              n[idx].projectUrl = "";
                                              n[idx].link = "";
                                            }
                                            setEditFormData(n);
                                          }}
                                          className="w-4 h-4 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884] dark:bg-slate-800"
                                        />
                                        <label htmlFor={`proj-current-${idx}`} className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                                          Currently working on project
                                        </label>
                                      </div>
                                      {!item.currentlyWorking && (
                                        <>
                                          <div className="md:col-span-2">
                                            <ModalTextarea
                                              label="Project Description"
                                              value={item.description}
                                              onChange={(v) => {
                                                const n = [...editFormData];
                                                n[idx].description = v;
                                                setEditFormData(n);
                                              }}
                                              placeholder="Describe your role and the technologies used..."
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <ModalTextarea
                                              label="Significant Achievements"
                                              value={item.significantAchievements}
                                              onChange={(v) => {
                                                const n = [...editFormData];
                                                n[idx].significantAchievements = v;
                                                setEditFormData(n);
                                              }}
                                              placeholder="Highlight key results, performance wins, or unique contributions..."
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <ModalInput
                                              label="Professional Project Link (GitHub / Google Docs Link Only)"
                                              value={item.projectUrl || item.link}
                                              onChange={(v) => {
                                                const n = [...editFormData];
                                                n[idx].projectUrl = v;
                                                n[idx].link = v;
                                                setEditFormData(n);
                                              }}
                                              placeholder="e.g. github.com/username/repo"
                                            />
                                          </div>
                                        </>
                                      )}
                                      {item.currentlyWorking && (
                                        <div className="md:col-span-2">
                                          <ModalTextarea
                                            label="Project Description"
                                            value={item.description}
                                            onChange={(v) => {
                                              const n = [...editFormData];
                                              n[idx].description = v;
                                              setEditFormData(n);
                                            }}
                                            placeholder="Describe your project here."
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {activeEditSection === 'extracurricular' && (
                                    <>
                                      <ModalLocationSelect
                                        label="Activity Type"
                                        value={item.activityType || ""}
                                        options={["Sports", "Arts", "Volunteering", "Leadership roles", "Others"]}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].activityType = v;
                                          if (v !== 'Others') n[idx].customActivityType = "";
                                          setEditFormData(n);
                                        }}
                                      />
                                      {item.activityType === 'Others' && (
                                        <ModalInput
                                          label="Specify Activity Type"
                                          value={item.customActivityType || ""}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].customActivityType = v;
                                            setEditFormData(n);
                                          }}
                                          placeholder="e.g. Coding Club"
                                        />
                                      )}
                                      <ModalLocationSelect
                                        label="Level"
                                        value={item.level || ""}
                                        options={["School", "College", "District", "State", "National", "International"]}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].level = v;
                                          setEditFormData(n);
                                        }}
                                      />
                                      <ModalInput
                                        label="Achievements"
                                        value={item.achievements || ""}
                                        onChange={(v) => {
                                          const n = [...editFormData];
                                          n[idx].achievements = v;
                                          setEditFormData(n);
                                        }}
                                        placeholder="e.g. Won Gold Medal, Team Captain"
                                      />
                                      <div className="md:col-span-2">
                                        <ModalTextarea
                                          label="Description"
                                          value={item.description || ""}
                                          onChange={(v) => {
                                            const n = [...editFormData];
                                            n[idx].description = v;
                                            setEditFormData(n);
                                          }}
                                          placeholder="Describe your role and what you did..."
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newItem = activeEditSection === 'extracurricular' ? { id: String(Date.now()), activityType: "", customActivityType: "", level: "", achievements: "", description: "" }
                                  : activeEditSection === 'workExperience' ? { id: String(Date.now()), experienceType: "", organizationName: "", companyName: "", jobTitle: "", role: "", duration: "", industry: "", location: "", startDate: "", endDate: "", currentlyWorking: false, keyResponsibilities: "", significantAccomplishments: "", description: "" }
                                    : activeEditSection === 'projects' ? { id: String(Date.now()), title: "", doneIn: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", significantAchievements: "", projectUrl: "", link: "" }
                                      : { institutionName: "", degree: "", degreeFullName: "", specialization: "", qualificationLevel: "", cgpaPercentage: "", degreeStatus: "" };
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

                      <form onSubmit={handleSaveCertificate} className="p-5 sm:p-6 md:p-8 max-w-xl mx-auto">
                        <div className="space-y-4 sm:space-y-5">
                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.certificate_title", "Certificate Name / Title *")}</label>
                            <input
                              required
                              type="text"
                              value={certFormData.title}
                              onChange={(e) => setCertFormData({ ...certFormData, title: e.target.value })}
                              placeholder="e.g. AWS Certified Solutions Architect"
                              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.issuer", "Issuing Organization *")}</label>
                            <input
                              required
                              type="text"
                              value={certFormData.issuingOrg || certFormData.issuer}
                              onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value, issuingOrg: e.target.value })}
                              placeholder="e.g. Amazon Web Services, Coursera"
                              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.completion_year", "Year of Completion *")}</label>
                            <select
                              value={certFormData.yearOfCompletion}
                              onChange={(e) => setCertFormData({ ...certFormData, yearOfCompletion: e.target.value })}
                              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                            >
                              <option value="">{t("profile_page.select_year", "Select Year")}</option>
                              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.verification_mode", "Verification Mode *")}</label>
                            <select
                              value={certFormData.verificationType}
                              onChange={(e) => setCertFormData({ ...certFormData, verificationType: e.target.value })}
                              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#859DF4]/20 focus:border-[#859DF4] outline-none transition-all"
                            >
                              <option value="">{t("profile_page.select", "Select")}</option>
                              <option value="url">{t("profile_page.verify_url", "Link / URL")}</option>
                              <option value="qr">{t("profile_page.verify_qr", "QR Code")}</option>
                              <option value="none">{t("profile_page.verify_none", "None")}</option>
                            </select>
                          </div>

                          {certFormData.verificationType === "url" && (
                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.verification_url", "Verification Link / URL *")}</label>
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
                          )}

                          {certFormData.verificationType === "qr" && (
                            <div>
                              <label className="block text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{t("profile_page.verification_code_qr", "QR Code Identifier *")}</label>
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
                          )}
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
                            disabled={savingProfile || (!certFormData.title)}
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
    <div className="flex flex-col min-w-0 group">
      <span className="text-[#1a3884]/50 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.15em] mb-1.5">{label}</span>
      <span className="text-[#0d1f4e] dark:text-white text-sm font-semibold break-words leading-snug" title={value}>
        {value || <span className="text-slate-400 dark:text-slate-500 font-normal italic text-xs">{t("profile_page.not_set")}</span>}
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

const ModalInput = ({ label, value, onChange, type = "text", disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder={`${t("profile_page.enter", "Enter")} ${label}`}
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
        value={value ? String(value).toLowerCase() : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none appearance-none"
      >
        <option value="">{t("profile_page.select", "Select")} {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

const ModalLocationSelect = ({ label, value, options, onChange, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 ml-1">{label}</label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-[#F8FAFC] dark:bg-[#002A5C] border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{t("profile_page.select", "Select")} {label}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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
        placeholder={`${t("profile_page.enter_your", "Enter your")} ${label}...`}
      />
    </div>
  );
};

export default Profile;
