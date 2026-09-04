import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  Briefcase,
  Camera,
  Edit2,
  FileText,
  GraduationCap,
  IconArrowLeft,
  IconBuilding,
  IconCamera,
  IconClock,
  IconId,
  IconMapPinHouse,
  IconPencil,
  IconUser,
  LinkIcon,
  Loader2,
  Plus,
  Rocket,
  Save,
  Shield,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from "@/components/icons";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl, apiCall } from "@/services/api";
import useUser from "@/hooks/useUser";
import useAvatar from "@/hooks/useAvatar";
import { getStates, getDistricts, getCities, getPincodeForCity } from "@/services/indiaLocationService";

import NeuralBackground from "@/components/ui/NeuralBackground";
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
  // Drives the constellation background's palette, and follows a theme toggle
  // without a reload -- same approach as DashboardHome.
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  useEffect(() => {
    const read = () => setIsDarkTheme(document.documentElement.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
    pincode: "",
    address: "",
    // New Comprehensive Fields
    gender: "",
    educationLevel: "",
    cgpa: "",
    domain: "",
    degreeGroup: "",
    specialisation: "",
    batch: "",
    yearOfStudy: "",
    yearOfPassing: "",
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
            pincode: (user.address || reg.address)?.pincode || "",
            address: (user.address || reg.address) ?
              `${(user.address || reg.address).city || ""}`
                .replace(new RegExp("^,\\s*"), '')
                .replace(new RegExp(",\\s*$"), '')
                .replace(new RegExp("(,\\s*)+", "g"), ', ')
              : "",

            // New Comprehensive Fields
            gender: user.gender || reg.gender || "",
            educationLevel: reg.academic?.degreeLevel || user?.academic?.degreeLevel || reg.educationLevel || "",
            // Academic record maintained by the institution -- read-only here.
            // Top-level cgpa is the value admin maintains; academic.cgpa is a
            // legacy mirror that is often blank, so it is only a fallback.
            cgpa: user?.cgpa || reg.cgpa || reg.academic?.cgpa || "",
            domain: reg.academic?.domain || reg.department?.domain || "",
            degreeGroup: reg.academic?.degreeGroup || reg.department?.fullName || "",
            specialisation: reg.academic?.specialisation || reg.department?.specialization || "",
            batch: user?.batch || reg.batch || "",
            yearOfStudy: user?.yearOfStudy || reg.yearOfStudy || "",
            yearOfPassing: user?.yearOfPassing || reg.yearOfPassing || "",
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
        // `forEach` with an async callback fires and forgets -- the modal could
        // open with empty degree dropdowns while these were still in flight.
        // Promise.all lets each row load in parallel but still be awaited.
        await Promise.all(
          clonedData.map(async (item, idx) => {
            if (item.qualificationLevel) {
              await fetchDegreeSubOptions('domains', { level: item.qualificationLevel }, idx);
            }
            if (item.qualificationLevel && item.degree) {
              await fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: item.degree }, idx);
            }
            if (item.qualificationLevel && item.degree && item.degreeFullName) {
              await fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: item.degreeFullName }, idx);
            }
          })
        );
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
        // formatSectionTitle turns "higherEducation" into "Higher Education".
        // Capitalising the raw key produced "HigherEducation updated successfully".
        toast.success(`${formatSectionTitle(activeEditSection)} updated successfully`);
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

  // Older records stored gender lower-cased ("female"), so the raw value would
  // render mid-sentence in the profile grid. Display it title-cased regardless
  // of how it was saved.
  const toTitleCase = (v) =>
    !v ? v : String(v).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  // Older records may have a score with no scoreType recorded. Infer from the
  // value rather than blindly appending "%" -- anything at or below 10 is a
  // CGPA in every Indian board's scale.
  // Semester results reach the client in two shapes. academicRecords
  // (semester / earnedCredits) is what the college upload writes; the newer
  // semesterPerformances projection returned by /auth/me uses semesterNumber /
  // creditsEarned. Normalise both so the table does not have to care which
  // one it got.
  const semesters = (() => {
    const raw =
      user?.academic?.semesterPerformances ||
      user?.academicRecords ||
      formData.semesterPerformances ||
      [];
    return [...raw]
      .map((r) => ({
        semesterNumber: Number(r.semesterNumber ?? r.semester),
        sgpa: r.sgpa,
        cgpa: r.cgpa,
        creditsEarned: r.creditsEarned ?? r.earnedCredits ?? 0,
      }))
      .filter((r) => Number.isFinite(r.semesterNumber))
      .sort((a, b) => a.semesterNumber - b.semesterNumber);
  })();

  const activeBacklogs = Number(user?.academic?.activeBacklogs ?? user?.activeBacklogs ?? 0);

  const hasAcademicDetails = !!(
    formData.cgpa ||
    formData.educationLevel ||
    formData.degreeGroup ||
    formData.batch ||
    formData.rollNumber
  );

  // Each arrear records the semester it was failed in, so a backlog reads as a
  // small badge on that semester's row. A standalone banner gave the count but
  // never the one thing the student actually wants -- which semester it sits
  // in. Arrears with no matching result row fall back to a single quiet line
  // under the table so the count is never silently dropped.
  const activeArrears = Array.isArray(user?.activeArrears) ? user.activeArrears : [];
  const backlogsBySemester = activeArrears.reduce((acc, a) => {
    const sem = Number(a?.failedInSemester);
    if (!Number.isFinite(sem) || sem <= 0) return acc;
    (acc[sem] || (acc[sem] = [])).push(a?.subjectName || a?.subjectCode || '');
    return acc;
  }, {});
  const shownSemesterNos = new Set(semesters.map((s) => s.semesterNumber));
  const unplacedArrears = activeArrears.filter((a) => !shownSemesterNos.has(Number(a?.failedInSemester)));
  const unplacedSemesters = [...new Set(
    unplacedArrears.map((a) => Number(a?.failedInSemester)).filter((n) => Number.isFinite(n) && n > 0)
  )].sort((a, b) => a - b);
  // Without any arrear rows the summary count is all there is to show.
  const unplacedBacklogCount = activeArrears.length ? unplacedArrears.length : activeBacklogs;

  // /auth/me already resolves the latest semester and its CGPA even when the
  // full row list is unavailable, so prefer those before falling back.
  const latestSemesterNo =
    Number(user?.academic?.latestSemester) ||
    (semesters.length ? semesters[semesters.length - 1].semesterNumber : 0);

  const latestSemester = latestSemesterNo ? { semesterNumber: latestSemesterNo } : null;

  const displayCgpa = (() => {
    const fromRows = semesters.length ? semesters[semesters.length - 1].cgpa : null;
    const resolved = fromRows ?? user?.academic?.overallCgpa ?? user?.cgpa ?? formData.cgpa;
    if (resolved === null || resolved === undefined || resolved === '') return '';
    const n = Number(resolved);
    return Number.isFinite(n) ? n.toFixed(2) : String(resolved);
  })();

  const formatScore = (d) => {
    if (!d || d.percentage === undefined || d.percentage === null || d.percentage === "") return null;
    const n = Number(d.percentage);
    const type = d.scoreType || (Number.isFinite(n) && n <= 10 ? "CGPA" : "Percentage");
    return type === "CGPA" ? d.percentage + " CGPA" : d.percentage + "%";
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
        <div className="relative min-h-screen overflow-hidden bg-[#e8eff8] dark:bg-[#072036] pb-12 transition-colors duration-300">
          {/* Constellation background, faded right down so it reads as a quiet
              texture rather than competing with the cards. Same treatment as
              the dashboard and My Courses. */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-25">
            <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
          </div>

          {/* Ambient mesh glows -- the depth cue the dashboard uses. */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent rounded-full blur-[120px] dark:from-blue-900/10" />
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent rounded-full blur-[120px] dark:from-indigo-900/10" />
          </div>

          {loading ? (
            <ProfileSkeleton />
          ) : (
            <main className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
              {/* Back Button - Mobile Only */}
              <div className="mb-4 md:hidden">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="group flex items-center gap-2 text-[#072036] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#045C9A] transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                    <IconArrowLeft className="h-4 w-4" />
                  </div>
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </button>
              </div>

              {/* Header section with page title */}
              <div className="mb-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#072036] dark:text-white">{t("profile_page.my_profile")}</h1>
              </div>

              {/* Profile Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 mb-6"
              >
                <div className="relative group flex-shrink-0">
                  <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full bg-gradient-to-br from-[#045C9A] to-[#072036] flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-white/10 shadow-md">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {getInitials(formData.name)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("profile_page.change_photo", "Change photo")}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-[#045C9A] hover:bg-[#034a7d] rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-[#0d3a5f] transition-colors"
                  >
                    <IconCamera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#072036] dark:text-white truncate">
                      {formData.name || t("profile_page.student")}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/25 px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t("profile_page.active")}</span>
                    </span>
                  </div>

                  {/* Role and the two identity facts on one wrapping line --
                      three stacked blocks was most of the card's old height. */}
                  <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-x-3 gap-y-1 flex-wrap text-[13px] text-slate-600 dark:text-slate-300 min-w-0">
                    <span className="font-semibold text-[#045C9A] dark:text-[#A6D7E8]">{t("profile_page.student")}</span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                    {/* The SMAART student ID, not the address -- this line is
                        the card's identity strip, and the ID is what a student
                        is asked for. The full address already has its own
                        card below. */}
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <IconId className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate font-semibold tracking-wide tabular-nums">
                        {formData.studentId || t("profile_page.not_set")}
                      </span>
                    </span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <IconBuilding className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">{formData.institution || t("profile_page.institution_not_set")}</span>
                    </span>
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
                  {/* Identity row: who the student is (Personal Information)
                      next to what they are studying (Academic Details), with
                      Address spanning underneath -- the address is one block of
                      text and reads better across the full width than squeezed
                      into a half column. */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information Card */}
                  <div className={`${hasAcademicDetails ? "" : "lg:col-span-2 "}bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/55 hover:-translate-y-0.5`}>
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl">
                          <IconUser className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.personal_information")}</h3>
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
                        className="bg-[#EAF7FD] dark:bg-[#045C9A]/20 border border-[#045C9A]/20 dark:border-[#045C9A]/30 hover:bg-[#d7ebf5] dark:hover:bg-[#045C9A]/30 text-[#045C9A] dark:text-[#A6D7E8] px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shadow-none"
                      >
                        {t("profile_page.edit")} <IconPencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <hr className="my-5 border-[#d7ebf5] dark:border-white/10" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <InfoField label={t("profile_page.full_name")} value={formData.name} />
                      <InfoField label={t("profile_page.email_address")} value={formData.email} />
                      <InfoField label={t("profile_page.phone_number")} value={formData.phone || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.date_of_birth")} value={formatDate(formData.dateOfBirth)} />
                      <InfoField label={t("profile_page.gender")} value={toTitleCase(formData.gender) || t("profile_page.not_set")} />
                      <InfoField label={t("profile_page.user_role")} value={t("profile_page.student")} />
                      <InfoField label={t("profile_page.member_since")} value={memberSince || t("profile_page.not_available")} />
                      <InfoField label={t("profile_page.student_id", "Student ID")} value={formData.studentId || t("profile_page.not_set")} />
                    </div>
                  </div>

                  {/* Academic Details -- institution-maintained, so there is no
                      Edit action here. Students change these through their
                      college, not the profile page. */}
                  {hasAcademicDetails && (
                    <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/40 hover:-translate-y-0.5">
                      <div className="flex justify-between items-center gap-3 mb-5">
                        <div className="flex gap-2 items-center min-w-0">
                          <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl shrink-0">
                            <GraduationCap className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-xl font-bold text-[#072036] dark:text-white truncate">{t("profile_page.academic_details", "Academic Details")}</h3>
                        </div>
                        {/* Stands where the Edit button sits on every other card,
                            so the absence of editing is explained rather than
                            just looking like a missing control. */}
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#072036]/60 px-2.5 py-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{t("profile_page.managed_by_institution", "Managed by your institution")}</span>
                        </span>
                      </div>
                      <hr className="my-5 border-[#d7ebf5] dark:border-white/10" />

                      {/* Course facts first, CGPA last: the fixed facts describe
                          who the student is, the CGPA is the one figure that
                          moves each semester, so it closes the card rather than
                          opening it. It carries the semester it is current to,
                          because a bare number is ambiguous on its own. */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                        {/* The college's own register number -- an academic
                            fact, not a personal one, and the college owns it
                            the same way it owns everything else on this card. */}
                        <InfoField label={t("profile_page.roll_number", "Roll Number")} value={formData.rollNumber || t("profile_page.not_set")} />
                        <InfoField label={t("profile_page.degree_level", "Degree Level")} value={formData.educationLevel} />
                        <InfoField label={t("profile_page.domain", "Domain")} value={formData.domain} />
                        <InfoField label={t("profile_page.degree", "Degree")} value={formData.degreeGroup} />
                        <InfoField label={t("profile_page.specialisation", "Specialisation")} value={formData.specialisation} />
                        <InfoField label={t("profile_page.batch", "Batch")} value={formData.batch} />
                        <InfoField label={t("profile_page.year_of_study", "Year of Study")} value={formData.yearOfStudy} />
                        <InfoField label={t("profile_page.expected_passing", "Expected Passing")} value={formData.yearOfPassing} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-600 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider mb-1.5">{t("profile_page.cgpa", "CGPA")}</span>
                          {displayCgpa ? (
                            <span className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[#072036] dark:text-white text-base font-bold tabular-nums leading-snug">{displayCgpa}</span>
                              {latestSemester && (
                                <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-400">
                                  {t("profile_page.as_of_semester", "as of Semester")} {latestSemester.semesterNumber}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400 font-normal italic text-xs">{t("profile_page.not_set")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Card */}
                  <div className="lg:col-span-2 bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/55 hover:-translate-y-0.5">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl">
                          <IconMapPinHouse className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.address")}</h3>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal('address', {
                          street: formData.street,
                          city: formData.city,
                          district: formData.district,
                          state: formData.state,
                          country: formData.country,
                          pincode: formData.pincode
                        })}
                        className="bg-[#EAF7FD] dark:bg-[#045C9A]/20 border border-[#045C9A]/20 dark:border-[#045C9A]/30 hover:bg-[#d7ebf5] dark:hover:bg-[#045C9A]/30 text-[#045C9A] dark:text-[#A6D7E8] px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all"
                      >
                        {t("profile_page.edit")} <IconPencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <hr className="my-5 border-[#d7ebf5] dark:border-white/10" />

                    {/* Lead with the address as people actually read it -- one
                        block, the way it would appear on an envelope. The
                        structured fields below stay for scanning and editing.
                        This also gives the card real content instead of five
                        short values floating in a half-empty panel. */}
                    {(formData.street || formData.city || formData.state) && (
                      <div className="mb-6 rounded-xl bg-gradient-to-br from-[#EAF7FD] to-[#F1F5F9] dark:from-[#0d3a5f]/60 dark:to-[#0d3a5f]/30 border border-[#d7ebf5] dark:border-white/10 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10">
                            <IconMapPinHouse className="w-4 h-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                              {t("profile_page.registered_address", "Registered Address")}
                            </p>
                            <p className="text-sm font-semibold leading-relaxed text-[#072036] dark:text-white break-words">
                              {[formData.street, formData.city, formData.district, formData.state, formData.pincode, formData.country]
                                .map((part) => (part || "").trim())
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                      <InfoField label={t("profile_page.city")} value={formData.city || t("profile_page.not_specified")} />
                      {formData.district && formData.district.trim() !== "" && (
                        <InfoField label={t("profile_page.district", "District")} value={formData.district} />
                      )}
                      <InfoField label={t("profile_page.state")} value={formData.state || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.pincode", "Pincode")} value={formData.pincode || t("profile_page.not_specified")} />
                      <InfoField label={t("profile_page.country")} value={formData.country || t("profile_page.not_specified")} />
                    </div>
                  </div>
                  </div>

                  {/* Education Card */}
                  {(formData.higherEducation?.length > 0 || formData.tenthDetails || formData.twelfthDetails) && (
                    <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/55 hover:-translate-y-0.5">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex gap-2 items-center">
                          <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.educational_history")}</h3>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {formData.higherEducation && formData.higherEducation.length > 0 ? (
                          formData.higherEducation.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10 w-full">
                              <div className="flex-1">
                                <div className="flex flex-col gap-1 mb-2">
                                  <h5 className="font-bold text-[#072036] dark:text-white">{t("profile_page.higher_education")}</h5>
                                  <hr className="my-3 border-[#d7ebf5] dark:border-white/10" />
                                  <h6 className="font-semibold text-[#072036] dark:text-white flex items-center gap-2 flex-wrap">
                                    <span>{edu.institutionName}</span>
                                    {edu.location && <span className="text-slate-600 font-normal">| {edu.location}</span>}
                                    {edu.degreeStatus && String(edu.degreeStatus).toLowerCase() === 'pursuing' && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 rounded-full ml-1">
                                        {t("profile_page.pursuing", "Pursuing")}
                                      </span>
                                    )}
                                  </h6>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {edu.qualificationLevel && <span>{edu.qualificationLevel} • </span>}
                                  {edu.degreeFullName || edu.degree} {edu.specialization && <span>• {edu.specialization}</span>}
                                </p>
                                {(!edu.degreeStatus || String(edu.degreeStatus).toLowerCase() !== 'pursuing') && (
                                  <p className="text-xs text-slate-600 mt-1">{t("profile_page.passing_year")}: {edu.yearOfPassing} • {t("profile_page.grade")}: {edu.cgpaPercentage}%</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('higherEducation', formData.higherEducation)}
                                className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-[#d7ebf5] dark:border-white/10 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{t("profile_page.no_higher_education")}</p>
                            <button
                              onClick={() => handleOpenEditModal('higherEducation', [])}
                              className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-[#045C9A] dark:text-[#A6D7E8] px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm"
                            >
                              <Plus className="w-4 h-4" /> {t("profile_page.add_higher_education")}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.twelfthDetails && (
                            <div className="flex justify-between items-start p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10 w-full">
                              <div className="flex-1">
                                <h4 className="font-bold text-[#072036] dark:text-white">{t("profile_page.twelfth_standard")}</h4>
                                <p className="mt-2 text-sm font-semibold text-[#072036] dark:text-white">{formData.twelfthDetails.schoolName}</p>
                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                                  <SchoolFact label={t("profile_page.board", "Board")} value={formData.twelfthDetails.board} />
                                  <SchoolFact label={t("profile_page.group", "Group")} value={formData.twelfthDetails.stream} />
                                  <SchoolFact label={t("profile_page.score", "Score")} value={formatScore(formData.twelfthDetails)} />
                                  <SchoolFact label={t("profile_page.passing_year")} value={formData.twelfthDetails.yearOfPassing} />
                                </div>
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('twelfthDetails', formData.twelfthDetails)}
                                className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {formData.tenthDetails && (
                            <div className="flex justify-between items-start p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10 w-full">
                              <div className="flex-1">
                                <h4 className="font-bold text-[#072036] dark:text-white">{t("profile_page.tenth_standard")}</h4>
                                <p className="mt-2 text-sm font-semibold text-[#072036] dark:text-white">{formData.tenthDetails.schoolName}</p>
                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                                  <SchoolFact label={t("profile_page.board", "Board")} value={formData.tenthDetails.board} />
                                  <SchoolFact label={t("profile_page.score", "Score")} value={formatScore(formData.tenthDetails)} />
                                  <SchoolFact label={t("profile_page.passing_year")} value={formData.tenthDetails.yearOfPassing} />
                                </div>
                              </div>
                              <button
                                onClick={() => handleOpenEditModal('tenthDetails', formData.tenthDetails)}
                                className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shrink-0"
                              >
                                {t("profile_page.edit")} <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Academic Performance -- per-semester SGPA/CGPA uploaded by
                      the college. Renders as a table rather than a per-semester
                      dropdown: the question a student has is "am I improving?",
                      which is a comparison, and comparisons need every row
                      visible at once. Falls back to a quiet note when the
                      college has not uploaded results yet. */}
                  <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/40 hover:-translate-y-0.5">
                    <div className="flex justify-between items-center gap-3 mb-5">
                      <div className="flex gap-2 items-center min-w-0">
                        <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl shrink-0">
                          <TrendingUp className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#072036] dark:text-white truncate">{t("profile_page.academic_performance", "Academic Performance")}</h3>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#072036]/60 px-2.5 py-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{t("profile_page.managed_by_institution", "Managed by your institution")}</span>
                      </span>
                    </div>
                    <hr className="my-5 border-[#d7ebf5] dark:border-white/10" />

                    {semesters.length > 0 ? (
                      <>
                        <div className="overflow-x-auto rounded-xl border border-[#d7ebf5] dark:border-white/10">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#F1F5F9] dark:bg-[#072036]/60">
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("profile_page.semester_short", "Sem")}</th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">{t("profile_page.sgpa", "SGPA")}</th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">{t("profile_page.cgpa", "CGPA")}</th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">{t("profile_page.credits", "Credits")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {semesters.map((s, i) => {
                                const semBacklogs = backlogsBySemester[s.semesterNumber] || [];
                                return (
                                <tr key={s.semesterNumber ?? i} className="border-t border-[#d7ebf5] dark:border-white/10">
                                  <td className="px-4 py-2.5 text-[13px] font-semibold text-[#072036] dark:text-white">
                                    <span className="flex items-center gap-2">
                                      {s.semesterNumber}
                                      {semBacklogs.length > 0 && (
                                        <span
                                          title={semBacklogs.filter(Boolean).join(", ") || undefined}
                                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"
                                        >
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                          {semBacklogs.length} {semBacklogs.length === 1
                                            ? t("profile_page.backlog", "backlog")
                                            : t("profile_page.backlogs", "backlogs")}
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-200 text-right">{fmtGpa(s.sgpa)}</td>
                                  <td className="px-4 py-2.5 text-[13px] font-bold tabular-nums text-[#045C9A] dark:text-[#A6D7E8] text-right">{fmtGpa(s.cgpa)}</td>
                                  <td className="px-4 py-2.5 text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-200 text-right">{s.creditsEarned || "—"}</td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Only for arrears the college uploaded without a
                            matching semester row -- everything else already
                            shows as a badge beside its semester. */}
                        {unplacedBacklogCount > 0 && (
                          <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {unplacedBacklogCount} {unplacedBacklogCount === 1
                                ? t("profile_page.active_backlog", "active backlog")
                                : t("profile_page.active_backlogs", "active backlogs")}
                              {unplacedSemesters.length > 0
                                ? ` · ${t("profile_page.semester_short", "Sem")} ${unplacedSemesters.join(", ")}`
                                : ` · ${t("profile_page.backlog_semester_unknown", "semester not recorded")}`}
                            </span>
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9]/60 dark:bg-[#072036]/40 px-5 py-8 text-center">
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          {t("profile_page.no_semester_results", "No semester results yet")}
                        </p>
                        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
                          {t("profile_page.semester_results_hint", "Semester results appear here once your college uploads them.")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Professional Experience & Achievements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Experience & Achievements -- one card holding four
                      sections, mirroring how Educational History groups
                      higher education with 10th and 12th. Four separate
                      cards read as four unrelated things. */}
                  <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/40 hover:-translate-y-0.5 lg:col-span-2">
                    <div className="flex justify-between items-center gap-3 mb-5">
                      <div className="flex gap-2 items-center min-w-0">
                        <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl shrink-0">
                          <Briefcase className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#072036] dark:text-white truncate">{t("profile_page.experience_achievements", "Experience & Achievements")}</h3>
                      </div>
                    </div>
                    <hr className="my-5 border-[#d7ebf5] dark:border-white/10" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {/* Work Experience */}
                    <div className="p-4 sm:p-5 bg-[#F1F5F9] dark:bg-[#072036]/40 rounded-2xl border border-[#d7ebf5] dark:border-white/10 h-full">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-lg">
                            <Briefcase className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-base font-bold text-[#072036] dark:text-white">{t("profile_page.work_experience")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('workExperience', formData.workExperience)}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
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
                              <div key={idx} className="p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-bold text-[#072036] dark:text-white">
                                      {company} {exp.location && <span className="text-slate-600 font-normal text-xs ml-1">| {exp.location}</span>}
                                    </h4>
                                    <p className="text-sm text-[#045C9A] dark:text-[#A6D7E8] font-semibold">{designation}</p>
                                  </div>
                                  {exp.experienceType && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EAF7FD] dark:bg-[#0d3a5f]/30 text-[#045C9A] dark:text-[#A6D7E8] border border-[#d7ebf5] dark:border-[#045C9A]/40">
                                      {exp.experienceType}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <IconClock className="w-3.5 h-3.5" />
                                    <span>{durationText}</span>
                                  </div>
                                  {exp.industry && (
                                    <span className="text-slate-600">| {exp.industry}</span>
                                  )}
                                </div>
                                {(exp.description || exp.keyResponsibilities) && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{exp.description || exp.keyResponsibilities}</p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-600 italic">{t("profile_page.no_work_experience")}</p>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="p-4 sm:p-5 bg-[#F1F5F9] dark:bg-[#072036]/40 rounded-2xl border border-[#d7ebf5] dark:border-white/10 h-full">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-lg">
                            <FileText className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-base font-bold text-[#072036] dark:text-white">{t("profile_page.projects")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('projects', formData.projects)}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.projects && formData.projects.length > 0 ? (
                          formData.projects.map((project, idx) => (
                            <div key={idx} className="p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10">
                              <h4 className="font-bold text-[#072036] dark:text-white">{project.title}</h4>
                              {project.domain && (
                                <span className="mt-1 inline-flex items-center rounded-md bg-[#045C9A]/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#045C9A] dark:bg-[#045C9A]/15 dark:text-[#A6D7E8]">
                                  {project.domain}
                                </span>
                              )}
                              {project.link && (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#045C9A] dark:text-[#A6D7E8] hover:underline inline-flex items-center gap-1 mt-1">
                                  {t("profile_page.view_project")} <Plus className="w-2 h-2" />
                                </a>
                              )}
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{project.description}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600 italic">{t("profile_page.no_projects")}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 bg-[#F1F5F9] dark:bg-[#072036]/40 rounded-2xl border border-[#d7ebf5] dark:border-white/10 h-full">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-lg">
                            <Award className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-base font-bold text-[#072036] dark:text-white">{t("profile_page.certifications")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenCertificateModal()}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-black dark:text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          {t("profile_page.add")} <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formData.certificates && formData.certificates.length > 0 ? (
                          formData.certificates.map((cert, idx) => (
                            <div key={idx} className="p-5 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10 relative group transition-all hover:shadow-sm">
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenCertificateModal(idx)}
                                  className="p-1.5 bg-[#EAF7FD] dark:bg-[#0d3a5f]/30 text-[#045C9A] dark:text-[#A6D7E8] rounded-lg hover:scale-105 transition-transform"
                                  title={t("profile_page.edit_certificate")}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCertificate(idx)}
                                  className="p-1.5 border border-red-200 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                                  title="Delete Certificate"
                                  aria-label="Delete Certificate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="font-bold text-[#072036] dark:text-white text-sm pr-12 truncate">{cert.title}</h4>
                              <p className="text-xs text-slate-600 mt-1">{cert.issuer || cert.issuingOrg}</p>

                              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-600">
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
                          <p className="text-sm text-slate-600 italic col-span-2">{t("profile_page.no_certificates")}</p>
                        )}
                      </div>
                    </div>

                    {/* Extracurricular & Others */}
                    <div className="p-4 sm:p-5 bg-[#F1F5F9] dark:bg-[#072036]/40 rounded-2xl border border-[#d7ebf5] dark:border-white/10 h-full">
                      <div className="flex items-center justify-between gap-3 mb-6 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-lg flex-shrink-0">
                            <Users className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-base font-bold text-[#072036] dark:text-white truncate">{t("profile_page.extracurricular")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('extracurricular', formData.extracurricular)}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors shadow-sm flex-shrink-0"
                        >
                          {t("profile_page.edit")} <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        {formData.extracurricular && formData.extracurricular.length > 0 ? (
                          formData.extracurricular.map((item, idx) => (
                            <div key={idx} className="p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-[#072036] dark:text-white text-sm">
                                  {typeof item === 'string' ? item : item.activityType}
                                </h4>
                                {item.level && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF7FD] dark:bg-[#0d3a5f]/30 text-[#045C9A] dark:text-[#A6D7E8] border border-[#d7ebf5] dark:border-white/10 px-2 py-0.5 rounded-md font-bold uppercase">
                                    {item.level}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              {item.achievements && (
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-semibold">
                                  🏆 {item.achievements}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600 italic">{t("profile_page.no_extracurricular")}</p>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>

                    {/* Career Goals */}
                    <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/55 hover:-translate-y-0.5">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl">
                            <Rocket className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.career_goals", "Career Goals")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('careerGoals', formData.careerGoals)}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
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
                          <p className="text-sm text-slate-600 italic">{t("profile_page.no_goals_set", "No goals set")}</p>
                        )}
                      </div>
                    </div>

                    {/* Personal Development Goals */}
                    <div className="bg-white/90 dark:bg-[#0d3a5f]/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/60 dark:border-[#045C9A]/45 shadow-[0_1px_2px_rgba(9,32,54,0.04),0_8px_24px_-12px_rgba(9,32,54,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.30),0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_1px_2px_rgba(9,32,54,0.05),0_16px_40px_-16px_rgba(9,32,54,0.22)] hover:border-[#045C9A]/25 dark:hover:border-[#045C9A]/55 hover:-translate-y-0.5">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-xl">
                            <Users className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.personal_development_goals", "Personal Development Goals")}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal('personalDevelopmentGoals', formData.personalDevelopmentGoals)}
                          className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
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
                          <p className="text-sm text-slate-600 italic">{t("profile_page.no_goals_set", "No goals set")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Profile Photo Modal */}
              <ModalPortal>
              <AnimatePresence>
                {showEditModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowEditModal(false)}
                  >
                    <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-[#072036] rounded-2xl shadow-2xl max-w-md w-full p-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-[#072036] dark:text-white">{t("profile_page.change_profile_photo")}</h3>
                        <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0d3a5f] transition-colors">
                          <X className="w-5 h-5 text-slate-600" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#045C9A] to-[#072036] flex items-center justify-center overflow-hidden border-4 border-white dark:border-white/10 shadow-xl">
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
                          <label className="absolute bottom-1 right-1 w-10 h-10 bg-[#045C9A] dark:bg-[#045C9A] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                            {uploadingPhoto ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" disabled={uploadingPhoto} />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 px-4 border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] transition-colors">{t("profile_page.cancel")}</button>
                        <button onClick={handleSaveProfile} disabled={savingProfile || uploadingPhoto || !editData.profilePhoto} className="flex-1 py-3 px-4 bg-[#045C9A] text-white rounded-2xl font-bold hover:bg-[#034a7d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("profile_page.save")}
                        </button>
                      </div>
                    </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </ModalPortal>

              {/* Image Cropper Modal */}
              <ImageCropperModal
                isOpen={cropperOpen}
                imageSrc={cropperImageSrc}
                onClose={() => setCropperOpen(false)}
                onCrop={handleCroppedPhotoUpload}
                isSaving={uploadingPhoto}
              />

              {/* Global Section Edit Modal */}
              <ModalPortal>
              <AnimatePresence>
                {showSectionModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowSectionModal(false)}
                  >
                    {/* min-h-full + centred wrapper: tall content pushes the
                        dialog down the scrollable overlay instead of having its
                        top clipped above the scroll origin, which is what
                        `items-center` on the overlay itself caused. */}
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      role="dialog"
                      aria-modal="true"
                      // Flex column: the header and footer stay put, only the
                      // body between them scrolls. Previously the whole dialog
                      // scrolled, so sticky elements sat inside the padding and
                      // content bled past them.
                      className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#072036] rounded-2xl shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-[#d7ebf5] dark:border-white/10">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-[#072036] dark:text-white truncate">{t("profile_page.edit")} {formatSectionTitle(activeEditSection)}</h3>
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">Keep your profile up to date for better opportunities</p>
                        </div>
                        <button onClick={() => setShowSectionModal(false)} aria-label="Close" className="shrink-0 p-2 rounded-xl text-slate-600 hover:text-[#072036] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 sm:px-6 md:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
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
                                city: "",
                                pincode: ""
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
                                  city: "",
                                  pincode: ""
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
                                  city: "",
                                  pincode: ""
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
                                onChange={(val) => {
                                  // Same behaviour as the registration form: picking a
                                  // city fills the pincode in, without clobbering a
                                  // pincode the student typed by hand.
                                  const pin = getPincodeForCity(editFormData.state, editFormData.district, val);
                                  setEditFormData({
                                    ...editFormData,
                                    city: val,
                                    pincode: pin || editFormData.pincode || ""
                                  });
                                }}
                              />
                            ) : (
                              <ModalInput
                                label="City"
                                value={editFormData.city}
                                onChange={(val) => setEditFormData({ ...editFormData, city: val })}
                              />
                            )}
                            <ModalInput
                              label="Pincode"
                              value={editFormData.pincode}
                              onChange={(val) => setEditFormData({ ...editFormData, pincode: val })}
                            />
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
                            <ModalLocationSelect
                              label="Score Type"
                              value={editFormData.scoreType}
                              options={["Percentage", "CGPA"]}
                              onChange={(val) => setEditFormData({ ...editFormData, scoreType: val, percentage: "" })}
                            />
                            <ModalInput
                              label={editFormData.scoreType === "CGPA" ? "CGPA (0 - 10)" : "Percentage (0 - 100)"}
                              type="number"
                              disabled={!editFormData.scoreType}
                              value={editFormData.percentage}
                              onChange={(val) => {
                                // Mirror the registration form's guards so the two
                                // entry points cannot disagree about what is valid.
                                if (val.startsWith("-")) return;
                                const [whole, dec] = val.split(".");
                                if (whole && whole.length > 3) return;
                                if (dec && dec.length > 2) return;
                                const max = editFormData.scoreType === "CGPA" ? 10 : 100;
                                if (val !== "" && Number(val) > max) return;
                                setEditFormData({ ...editFormData, percentage: val });
                              }}
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
                            <ModalLocationSelect
                              label="Score Type"
                              value={editFormData.scoreType}
                              options={["Percentage", "CGPA"]}
                              onChange={(val) => setEditFormData({ ...editFormData, scoreType: val, percentage: "" })}
                            />
                            <ModalInput
                              label={editFormData.scoreType === "CGPA" ? "CGPA (0 - 10)" : "Percentage (0 - 100)"}
                              type="number"
                              disabled={!editFormData.scoreType}
                              value={editFormData.percentage}
                              onChange={(val) => {
                                // Mirror the registration form's guards so the two
                                // entry points cannot disagree about what is valid.
                                if (val.startsWith("-")) return;
                                const [whole, dec] = val.split(".");
                                if (whole && whole.length > 3) return;
                                if (dec && dec.length > 2) return;
                                const max = editFormData.scoreType === "CGPA" ? 10 : 100;
                                if (val !== "" && Number(val) > max) return;
                                setEditFormData({ ...editFormData, percentage: val });
                              }}
                            />
                          </div>
                        )}
                        {activeEditSection === 'careerGoals' && (
                          <div className="space-y-5 sm:space-y-6">
                            <ModalTextarea label={t("profile_page.short_term_career_desc", "Short-term Goal (0-1 year)")} value={editFormData.shortTerm} onChange={(val) => setEditFormData({ ...editFormData, shortTerm: val })} />
                            <ModalTextarea label={t("profile_page.medium_term_career_desc", "Medium-term Goal (1-5 years)")} value={editFormData.mediumTerm} onChange={(val) => setEditFormData({ ...editFormData, mediumTerm: val })} />
                            <ModalTextarea label={t("profile_page.long_term_career_desc", "Long-term Goal (5+ years)")} value={editFormData.longTerm} onChange={(val) => setEditFormData({ ...editFormData, longTerm: val })} />
                          </div>
                        )}
                        {activeEditSection === 'personalDevelopmentGoals' && (
                          <div className="space-y-5 sm:space-y-6">
                            <ModalTextarea label={t("profile_page.short_term_personal_desc", "Short term (0–1 year)")} value={editFormData.shortTerm} onChange={(val) => setEditFormData({ ...editFormData, shortTerm: val })} />
                            <ModalTextarea label={t("profile_page.medium_term_personal_desc", "Medium term (1–5 years)")} value={editFormData.mediumTerm} onChange={(val) => setEditFormData({ ...editFormData, mediumTerm: val })} />
                            <ModalTextarea label={t("profile_page.long_term_personal_desc", "Long term (5+ years)")} value={editFormData.longTerm} onChange={(val) => setEditFormData({ ...editFormData, longTerm: val })} />
                          </div>
                        )}
                        {['higherEducation', 'workExperience', 'projects', 'extracurricular'].includes(activeEditSection) && (
                          <div className="space-y-6 sm:space-y-8">
                            {Array.isArray(editFormData) && editFormData.map((item, idx) => (
                              <div key={idx} className="p-4 sm:p-6 pt-14 sm:pt-16 bg-[#F1F5F9] dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 relative">
                                {/* Entry number, so it is obvious which row the
                                    Remove button belongs to when several are open. */}
                                <span className="absolute top-4 left-4 sm:left-6 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                  {formatSectionTitle(activeEditSection)} {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => { const newArr = [...editFormData]; newArr.splice(idx, 1); setEditFormData(newArr); }}
                                  aria-label={`Remove ${formatSectionTitle(activeEditSection)} ${idx + 1}`}
                                  className="absolute top-3 right-3 sm:right-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold hover:bg-red-50 dark:hover:bg-red-500/20 hover:border-red-300 dark:hover:border-red-500/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {t("profile_page.remove", "Remove")}
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
                                          className="w-4 h-4 rounded border-slate-300 text-[#045C9A] focus:ring-[#045C9A] dark:bg-slate-800"
                                        />
                                        <label htmlFor={`current-${idx}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
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
                                          className="w-4 h-4 rounded border-slate-300 text-[#045C9A] focus:ring-[#045C9A] dark:bg-slate-800"
                                        />
                                        <label htmlFor={`proj-current-${idx}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
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
                              className="w-full py-4 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-[20px] sm:rounded-[24px] text-slate-600 hover:text-[#045C9A] hover:border-[#045C9A] transition-all flex items-center justify-center gap-2 font-bold text-sm"
                            >
                              <Plus className="w-5 h-5" /> {t("profile_page.add_another_item")}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col-reverse sm:flex-row gap-3 px-5 sm:px-6 md:px-8 py-4 border-t border-[#d7ebf5] dark:border-white/10 bg-white dark:bg-[#072036]">
                        <button onClick={() => setShowSectionModal(false)} className="py-3 px-6 rounded-[16px] font-bold text-slate-600 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] transition-all text-sm order-2 sm:order-1">{t("profile_page.cancel")}</button>
                        <button onClick={handleSaveSection} disabled={savingProfile} className="flex-1 py-3 px-6 bg-[#045C9A] text-white rounded-[16px] font-bold hover:bg-[#034a7d] transition-all shadow-xl flex items-center justify-center gap-2 text-sm order-1 sm:order-2">{savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {t("profile_page.save_changes")}</button>
                      </div>
                    </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </ModalPortal>

              {/* Premium Certificate Upload Modal */}
              <ModalPortal>
              <AnimatePresence>
                {showCertModal && (
                  <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setShowCertModal(false)}>
                  <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-[#072036] rounded-[24px] sm:rounded-[32px] w-full max-w-3xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-white/10 scrollbar-thin my-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="px-5 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#072036] sticky top-0 z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EAF7FD] dark:bg-[#0d3a5f]/30 flex items-center justify-center flex-shrink-0">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#072036] dark:text-white">
                              {editingCertIndex !== null ? t("profile_page.edit_certificate") : t("profile_page.upload_certificate")}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{t("profile_page.add_credential_vault")}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCertModal(false)}
                          type="button"
                          className="p-2 hover:bg-slate-100 dark:hover:bg-[#0d3a5f] rounded-full transition-colors text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveCertificate} className="px-5 sm:px-6 md:px-8 py-5 sm:py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">{t("profile_page.certificate_title", "Certificate Name / Title *")}</label>
                            <input
                              required
                              type="text"
                              value={certFormData.title}
                              onChange={(e) => setCertFormData({ ...certFormData, title: e.target.value })}
                              placeholder="e.g. AWS Certified Solutions Architect"
                              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">{t("profile_page.issuer", "Issuing Organization *")}</label>
                            <input
                              required
                              type="text"
                              value={certFormData.issuingOrg || certFormData.issuer}
                              onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value, issuingOrg: e.target.value })}
                              placeholder="e.g. Amazon Web Services, Coursera"
                              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">{t("profile_page.completion_year", "Year of Completion *")}</label>
                            <div className="relative">
                              <select
                                value={certFormData.yearOfCompletion}
                                onChange={(e) => setCertFormData({ ...certFormData, yearOfCompletion: e.target.value })}
                                className="w-full h-11 pl-3.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0"
                              >
                                <option value="">{t("profile_page.select_year", "Select Year")}</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                                <SelectChevron />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">{t("profile_page.verification_mode", "Verification Mode *")}</label>
                            <div className="relative">
                              <select
                                value={certFormData.verificationType}
                                onChange={(e) => setCertFormData({ ...certFormData, verificationType: e.target.value })}
                                className="w-full h-11 pl-3.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0"
                              >
                                <option value="">{t("profile_page.select", "Select")}</option>
                                <option value="url">{t("profile_page.verify_url", "Link / URL")}</option>
                                <option value="none">{t("profile_page.verify_none", "None")}</option>
                              </select>
                                <SelectChevron />
                            </div>
                          </div>

                          {certFormData.verificationType === "url" && (
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">{t("profile_page.verification_url", "Verification Link / URL *")}</label>
                              <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                  type="url"
                                  value={certFormData.verificationUrl}
                                  onChange={(e) => setCertFormData({ ...certFormData, verificationUrl: e.target.value })}
                                  placeholder="https://verify.example.com/..."
                                  className="w-full h-11 pl-11 pr-3.5 bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                                />
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-white dark:bg-[#072036] sticky bottom-0 z-10">
                          <button
                            type="button"
                            onClick={() => setShowCertModal(false)}
                            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] transition-all order-2 sm:order-1"
                          >
                            {t("profile_page.cancel")}
                          </button>
                          <button
                            type="submit"
                            disabled={savingProfile || (!certFormData.title)}
                            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-[#045C9A] hover:bg-[#034a7d] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#045C9A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none order-1 sm:order-2"
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
                  </div>
                )}
              </AnimatePresence>
              </ModalPortal>
            </main>
          )}
        </div>
      </PageTransition>
    </>
  );
};

// Helper Components for the redesigned layout
/**
 * Renders a modal into document.body.
 *
 * The page is wrapped in <PageTransition>, which animates `y` -- framer-motion
 * implements that as a CSS transform, and any non-none transform makes that
 * element the containing block for `position: fixed` descendants. Without this
 * portal the overlays were fixed to the main content area rather than the
 * viewport, so they sat off-centre and never covered the sidebar.
 */
const ModalPortal = ({ children }) =>
  typeof document === "undefined" ? null : createPortal(children, document.body);

/** GPAs are stored as numbers; show a stable 2dp so columns line up. */
const fmtGpa = (v) =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(2);

const SchoolFact = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-[#072036] dark:text-slate-100 truncate" title={String(value)}>{value}</p>
    </div>
  );
};

const InfoField = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-w-0 group">
      {/* Same label treatment as the edit-modal fields, so reading a value and
          editing it look like the same system. Was #045C9A at 50% opacity,
          which sat too faint against the card. */}
      <span className="text-slate-600 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider mb-1.5">{label}</span>
      <span className="text-[#072036] dark:text-white text-sm font-semibold break-words leading-snug" title={value}>
        {value || <span className="text-slate-600 dark:text-slate-500 font-normal italic text-xs">{t("profile_page.not_set")}</span>}
      </span>
    </div>
  );
};

const GoalItem = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl border border-[#d7ebf5] dark:border-white/10">
      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-100 leading-relaxed">{value || t("profile_page.no_goal_set")}</p>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Modal form field template.
 *
 * These match the field styling used by the multi-step registration form
 * (ComprehensiveSignup.jsx) so editing a section here looks and behaves the
 * same as filling it in during signup -- same label scale, same 44px control
 * height, same focus treatment -- retinted to the dashboard palette.
 *
 * The previous fields used `border-2 border-transparent`, so a control had no
 * visible edge at all until focused, and `text-slate-600` labels that were too
 * faint to read against the modal.
 * ------------------------------------------------------------------------- */

const FIELD_LABEL =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5";

const FIELD_CONTROL =
  "w-full h-11 px-3.5 bg-slate-50 dark:bg-[#0d3a5f] border border-slate-200 dark:border-white/10 " +
  "rounded-xl text-[13px] font-semibold text-slate-800 dark:text-slate-200 " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal " +
  "transition-all duration-200 outline-none " +
  "focus:bg-white dark:focus:bg-[#072036] focus:border-[#045C9A] dark:focus:border-[#045C9A] " +
  "focus-visible:ring-4 focus-visible:ring-[#045C9A]/10 focus-visible:ring-offset-0 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/** Chevron for every <select>, so no dropdown looks like a plain text field. */
const SelectChevron = () => (
  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </span>
);

const ModalInput = ({ label, value, onChange, type = "text", disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={FIELD_CONTROL}
        placeholder={`${t("profile_page.enter", "Enter")} ${label}`}
      />
    </div>
  );
};

const ModalSelect = ({ label, value, options, onChange }) => {
  const { t } = useTranslation();
  // Values are stored lower-cased to match the registration form and the
  // backend, which validates gender against ['male','female','other'] -- a
  // title-cased value would fail that check and be dropped silently.
  // Presentation is handled at render time by toTitleCase().
  const selected = String(value || "").toLowerCase();
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <div className="relative">
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className={`${FIELD_CONTROL} appearance-none pr-10`}
          >
            <option value="">{t("profile_page.select", "Select")} {label}</option>
            {options.map((opt) => (
              <option key={opt} value={String(opt).toLowerCase()}>{opt}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>
    </div>
  );
};

const ModalLocationSelect = ({ label, value, options, onChange, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <div className="relative">
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${FIELD_CONTROL} appearance-none pr-10`}
          >
            <option value="">{t("profile_page.select", "Select")} {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>
    </div>
  );
};

const ModalTextarea = ({ label, value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        // Same control template, minus the fixed height a textarea must not
        // have. 3 rows left a goal statement floating in a tall empty box and
        // made the goals modal overflow the viewport.
        className={`${FIELD_CONTROL.replace("h-11 ", "")} py-2.5 leading-relaxed resize-y min-h-[68px]`}
        placeholder={`${t("profile_page.enter_your", "Enter your")} ${label}...`}
      />
    </div>
  );
};

export default Profile;
