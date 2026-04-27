import { useState, useEffect } from "react";
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

  Plus,
  X,
  Camera,
  Save,
  Loader2
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl } from "@/services/api";
import useUser from "@/hooks/useUser";

import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import BadgeGallery from "@/components/badges/BadgeGallery";
import PageTransition from "@/components/PageTransition";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();
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
            address: (user.address || reg.address) ?
              `${(user.address || reg.address).city || ""}, ${(user.address || reg.address).state || ""}, ${(user.address || reg.address).country || ""}`.replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ',')
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
        setProfilePhoto(editData.profilePhoto);
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

  // Profile.jsx

  return (
    <PageTransition>
    <div className="space-y-6">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <main className="container mx-auto px-3 py-4 max-w-6xl">
            {/* Main Grid Layout - Compact */}
            <div className="grid lg:grid-cols-[260px_1fr] gap-4">

              {/* Left Sidebar - Profile Card */}
              <div className="space-y-3">
                {/* Main Profile Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4 shadow-sm"
                >
                  {/* Profile Photo & Online Status */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="relative mb-2">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-3 border-white dark:border-slate-800 shadow-md">
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
                      {/* Online Status Badge */}
                      <div className="absolute -right-2 top-1 flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm" title="You are currently online">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">Online</span>
                      </div>
                    </div>

                    {/* Name & Username */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{formData.nickname || formData.name || "Student"}</h2>
                        <Edit2 className="w-3 h-3 text-gray-400 cursor-pointer hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors" onClick={() => { setEditData({ name: formData.name, profilePhoto: profilePhoto }); setShowEditModal(true); }} title="Edit profile" />
                        {isNewUser && <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold px-1.5 py-0.5 rounded">NEW</span>}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">@{formData.email?.split('@')[0] || 'student'}</p>
                      {formData.educationLevel && <p className="text-[#1a3884] dark:text-blue-400 text-[10px] font-medium mt-1">{formData.educationLevel}</p>}
                    </div>
                  </div>

                  {/* Profile Info List */}
                  <div className="space-y-2.5 border-t border-gray-100 dark:border-slate-800 pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">From</p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-200">{formData.address || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Member since</p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-200">{memberSince || "Not available"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Status</p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-200 capitalize">{user?.status || "Active"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Add Details Button */}
                  <button
                    onClick={() => navigate('/add-details')}
                    className="w-full py-2 mt-4 rounded-md border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Add Details
                  </button>
                </motion.div>


              </div>

              {/* Right Content Area */}
              <div className="space-y-4">
                {/* Tabs Switcher */}
                <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-1 shadow-sm">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "info"
                      ? "bg-[#1a3884] text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    Information
                  </button>
                  <button
                    onClick={() => setActiveTab("badges")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "badges"
                      ? "bg-[#1a3884] text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    Badges & Achievements
                  </button>
                </div>

                {activeTab === "info" ? (
                  <>
                    {/* 1. Personal & Contact Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Personal Details</h3>
                        <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                      </div>

                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Info Cards */}
                        <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[#1a3884]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Email Address</p>
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{formData.email || "Not set"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[#1a3884]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Phone Number</p>
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{formData.phone || "Not set"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[#1a3884]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Date of Birth</p>
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{formatDate(formData.dateOfBirth)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[#1a3884]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Gender</p>
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate capitalize">{formData.gender || "Not set"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 2. Educational History */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Educational History</h3>
                        <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                      </div>

                      <div className="p-3 space-y-3">
                        {/* Higher Education */}
                        {formData.higherEducation && Array.isArray(formData.higherEducation) && formData.higherEducation.length > 0 ? (
                          formData.higherEducation.map((edu, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 mb-3 last:mb-0">
                              <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Higher Education #{index + 1}</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div><span className="text-gray-500 dark:text-gray-400">Degree:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{edu.degree}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Branch:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{edu.specialization}</span></div>
                                <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">College:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{edu.institutionName || edu.university}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Year:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{edu.yearOfPassing}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">CGPA/Percentage:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{edu.cgpaPercentage}%</span></div>
                                {edu.certificate && (
                                  <div className="col-span-2 mt-1">
                                    <a href={getPreviewUrl(edu.certificate)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline">
                                      <FileText className="w-3 h-3" /> View Certificate
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          null
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* 12th Details */}
                          {formData.twelfthDetails && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">12th Standard</h4>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="font-medium text-gray-900 dark:text-white truncate" title={formData.twelfthDetails.schoolName}>{formData.twelfthDetails.schoolName}</p>
                                <p className="text-gray-500 dark:text-gray-400">{formData.twelfthDetails.stream} • {formData.twelfthDetails.yearOfPassing}</p>
                                <p className="text-[#1a3884] dark:text-blue-400 font-medium">{formData.twelfthDetails.percentage}%</p>
                                {formData.twelfthDetails.marksheet && (
                                  <a href={getPreviewUrl(formData.twelfthDetails.marksheet)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline mt-1">
                                    <FileText className="w-3 h-3" /> View Marksheet
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 10th Details */}
                          {formData.tenthDetails && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">10th Standard</h4>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="font-medium text-gray-900 dark:text-white truncate" title={formData.tenthDetails.schoolName}>{formData.tenthDetails.schoolName}</p>
                                <p className="text-gray-500 dark:text-gray-400">{formData.tenthDetails.yearOfPassing}</p>
                                <p className="text-[#1a3884] dark:text-blue-400 font-medium">{formData.tenthDetails.percentage}%</p>
                                {formData.tenthDetails.marksheet && (
                                  <a href={getPreviewUrl(formData.tenthDetails.marksheet)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline mt-1">
                                    <FileText className="w-3 h-3" /> View Marksheet
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* 3. Career Profile */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Career Preferences</h3>
                        <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                      </div>

                      <div className="p-3 space-y-3">
                        {formData.jobPreferences && Array.isArray(formData.jobPreferences) && formData.jobPreferences.length > 0 ? (
                          formData.jobPreferences.map((job, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-slate-800 last:border-0 last:mb-0 last:pb-0">
                              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Preferred Role</p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{job.preferredRole}</p>
                              </div>
                              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Job Type</p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{job.jobType}</p>
                              </div>
                              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Location</p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{job.preferredLocation}</p>
                              </div>
                              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Expected Salary</p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{job.expectedSalary}</p>
                              </div>
                            </div>
                          ))
                        ) : null}

                        {formData.sectorPreferences?.preferredSectors?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Preferred Sectors</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.sectorPreferences.preferredSectors.map((sector, idx) => (
                                <span key={idx} className="px-2 py-1 bg-[#1a3884]/10 dark:bg-blue-500/20 text-[#1a3884] dark:text-blue-400 rounded text-[10px] font-medium border border-[#1a3884]/20 dark:border-blue-500/30">
                                  {sector}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* 4. Goals & Aspirations */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Goals & Aspirations</h3>
                        <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                      </div>

                      <div className="p-3 grid gap-3">
                        {formData.careerGoals && (
                          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Career Goals</h4>
                            <ul className="space-y-2">
                              <li className="flex gap-2 text-xs">
                                <span className="text-[#1a3884] dark:text-blue-400 font-semibold min-w-[60px]">Short Term:</span>
                                <span className="text-gray-700 dark:text-gray-300">{formData.careerGoals.shortTerm}</span>
                              </li>
                              <li className="flex gap-2 text-xs">
                                <span className="text-[#1a3884] dark:text-blue-400 font-semibold min-w-[60px]">Medium Term:</span>
                                <span className="text-gray-700 dark:text-gray-300">{formData.careerGoals.mediumTerm}</span>
                              </li>
                              <li className="flex gap-2 text-xs">
                                <span className="text-[#1a3884] dark:text-blue-400 font-semibold min-w-[60px]">Long Term:</span>
                                <span className="text-gray-700 dark:text-gray-300">{formData.careerGoals.longTerm}</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* 5. Experience & Projects */}
                    {(formData.workExperience.length > 0 || formData.projects.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                      >
                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                          <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Experience & Projects</h3>
                          <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                        </div>

                        <div className="p-3 space-y-4">
                          {formData.workExperience.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Work Experience</h4>
                              <div className="space-y-2">
                                {formData.workExperience.map((exp, idx) => (
                                  <div key={idx} className="p-2.5 border-l-2 border-[#1a3884] dark:border-blue-500 bg-gray-50 dark:bg-slate-800 rounded-r-lg">
                                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">{exp.jobTitle}</h5>
                                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-200">{exp.organizationName}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                      {formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                                    </p>
                                    {exp.certificate && (
                                      <a href={getPreviewUrl(exp.certificate)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline mt-1">
                                        <FileText className="w-3 h-3" /> View Letter
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {formData.projects.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Projects</h4>
                              <div className="space-y-2">
                                {formData.projects.map((proj, idx) => (
                                  <div key={idx} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start">
                                      <h5 className="text-xs font-bold text-gray-900 dark:text-white">{proj.title}</h5>
                                      {proj.projectUrl && (
                                        <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline">View Link</a>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 6. Certificates & Activities */}
                    {(formData.certificates?.length > 0 || formData.extracurricular?.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                      >
                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                          <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Certificates & Activities</h3>
                          <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                        </div>

                        <div className="p-3 space-y-4">
                          {/* Technical Certificates */}
                          {formData.certificates && formData.certificates.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Technical Certifications</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {formData.certificates.map((cert, idx) => (
                                  <div key={idx} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-start gap-2">
                                      <Award className="w-4 h-4 text-[#1a3884] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <h5 className="text-xs font-bold text-gray-900 dark:text-white">{cert.title}</h5>
                                        <p className="text-[10px] text-gray-600 dark:text-gray-300">{cert.issuingOrg}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{cert.yearOfCompletion}</span>
                                          {cert.certificateFile && (
                                            <a href={getPreviewUrl(cert.certificateFile)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#1a3884] dark:text-blue-400 hover:underline">
                                              <FileText className="w-3 h-3" /> View
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extracurricular Activities */}
                          {formData.extracurricular && formData.extracurricular.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Extracurricular Activities</h4>
                              <div className="space-y-2">
                                {formData.extracurricular.map((activity, idx) => (
                                  <div key={idx} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 function-check">
                                    <div className="flex justify-between items-start">
                                      <h5 className="text-xs font-bold text-gray-900 dark:text-white">{activity.activityType} <span className="font-normal text-gray-500">({activity.level})</span></h5>
                                    </div>
                                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mt-0.5">{activity.achievements}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">"{activity.description}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Active Courses Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Active Courses</h3>
                        <div className="w-10 h-0.5 bg-[#1a3884] dark:bg-blue-500 mt-1.5"></div>
                      </div>

                      <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {enrolledCourses.length > 0 ? (
                            enrolledCourses.slice(0, 2).map((enrollment) => (
                              <Link
                                key={enrollment._id}
                                to="/dashboard/courses"
                                className="group block p-3 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-[#1a3884] dark:hover:border-blue-500 hover:shadow-sm transition-all"
                              >
                                <div className="aspect-video bg-gradient-to-br from-[#1a3884]/20 to-[#002147]/20 rounded mb-2 flex items-center justify-center overflow-hidden">
                                  {enrollment.course?.thumbnail ? (
                                    <img src={enrollment.course.thumbnail} alt={enrollment.course?.title} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <BookOpen className="w-5 h-5 text-[#1a3884] dark:text-blue-400 opacity-50" />
                                  )}
                                </div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors truncate">
                                  {enrollment.course?.title || 'Course'}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  {enrollment.progress != null ? `${Math.round(enrollment.progress)}% complete` : 'Continue learning →'}
                                </p>
                              </Link>
                            ))
                          ) : (
                            <Link
                              to="/dashboard/courses"
                              className="group block p-3 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-[#1a3884] dark:hover:border-blue-500 hover:shadow-sm transition-all"
                            >
                              <div className="aspect-video bg-gradient-to-br from-[#1a3884]/20 to-[#002147]/20 rounded mb-2 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-[#1a3884] dark:text-blue-400 opacity-50" />
                              </div>
                              <p className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                                No courses yet
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Browse courses →</p>
                            </Link>
                          )}

                          {/* Explore More Card */}
                          <Link
                            to="/dashboard/courses"
                            className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg hover:border-[#1a3884] dark:hover:border-blue-500 hover:bg-[#1a3884]/5 dark:hover:bg-blue-500/10 transition-all cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-1.5">
                              <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Explore Courses</p>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-4"
                  >
                    <BadgeGallery
                      userName={formData.name}
                      badges={user?.badges || []}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </main>
        )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Change Profile Photo</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Profile Photo Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {editData.profilePhoto ? (
                      <img
                        src={editData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {getInitials(editData.name)}
                      </span>
                    )}
                  </div>
                  {/* Camera button overlay */}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a3884] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#277a84] transition-colors shadow-md">
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">Click the camera icon to upload new photo</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || uploadingPhoto || !editData.profilePhoto}
                  className="flex-1 py-2.5 px-4 bg-[#1a3884] text-white rounded-lg font-medium hover:bg-[#277a84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Photo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
};

export default Profile;

