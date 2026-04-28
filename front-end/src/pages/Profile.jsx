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
              `${(user.address || reg.address).city || ""}`.replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/(,\s*)+/g, ', ')
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] pb-12 transition-colors duration-300">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <main className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Header section with page title */}
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h1>
            </div>

            {/* Profile Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6"
            >
              <div className="relative group">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {getInitials(formData.name)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setEditData({ name: formData.name, profilePhoto: profilePhoto }); setShowEditModal(true); }}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-[#1a3884] dark:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {formData.nickname || formData.name || "Student"}
                  </h2>
                </div>
                <p className="font-medium text-lg">
                  Student
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium">{formData.address || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium">{formData.institution || "Institution not set"}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden lg:block bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Active</span>
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
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
                    <button
                      onClick={() => navigate('/dashboard/onboarding')}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                    >
                      Edit <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <hr className="my-6 border-gray-200 dark:border-slate-700" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    <InfoField label="Full Name" value={formData.name} />
                    <InfoField label="Email Address" value={formData.email} />
                    <InfoField label="Phone Number" value={formData.phone || "Not set"} />
                    <InfoField label="Date of Birth" value={formatDate(formData.dateOfBirth)} />
                    <InfoField label="Gender" value={formData.gender || "Not set"} />
                    <InfoField label="User Role" value="Student" />
                    <InfoField label="Member Since" value={memberSince || "Not available"} />
                    <InfoField label="Education Level" value={formData.educationLevel || "Not set"} />
                    <InfoField label="Department" value={formData.department || "Not set"} />
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Address</h3>
                    <button
                      onClick={() => navigate('/dashboard/onboarding')}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                    >
                      Edit <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <hr className="my-6 border-gray-200 dark:border-slate-700" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                    <InfoField label="Street" value={formData.street || "Not specified"} />
                    <InfoField label="City" value={formData.city || "Not specified"} />
                    <InfoField label="State" value={formData.state || "Not specified"} />
                    <InfoField label="Country" value={formData.country || "Not specified"} />
                  </div>
                </div>

                {/* Education Card */}
                {(formData.higherEducation?.length > 0 || formData.tenthDetails || formData.twelfthDetails) && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Educational History</h3>
                    </div>
                    <hr className="my-6 border-gray-200 dark:border-slate-700" />
                    <div className="space-y-6">
                      {formData.higherEducation?.map((edu, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <GraduationCap className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-bold text-gray-900 dark:text-white">{edu.institutionName}</h4>
                              <span className="text-[10px] bg-[#1a3884]/10 text-[#1a3884] px-2 py-0.5 rounded-full font-bold uppercase">Higher Ed</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{edu.degreeFullName || edu.degree} • {edu.specialization}</p>
                            <p className="text-xs text-gray-400 mt-1">Passing Year: {edu.yearOfPassing} • Score: {edu.cgpaPercentage}%</p>
                          </div>
                        </div>
                      ))}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.twelfthDetails && (
                          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <BookOpen className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">12th Standard</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{formData.twelfthDetails.schoolName}</p>
                              <p className="text-xs text-gray-400 mt-1">{formData.twelfthDetails.percentage}% • {formData.twelfthDetails.yearOfPassing}</p>
                            </div>
                          </div>
                        )}
                        {formData.tenthDetails && (
                          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <BookOpen className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">10th Standard</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{formData.tenthDetails.schoolName}</p>
                              <p className="text-xs text-gray-400 mt-1">{formData.tenthDetails.percentage}% • {formData.tenthDetails.yearOfPassing}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Career & Goals Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Career Preferences */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Career Preferences</h3>
                    <div className="space-y-4">
                      {formData.jobPreferences && formData.jobPreferences.length > 0 ? (
                        formData.jobPreferences.map((job, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <h4 className="font-bold text-gray-900 dark:text-white">{job.preferredRole}</h4>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Job Type</p>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{job.jobType}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Location</p>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{job.preferredLocation}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No job preferences set.</p>
                      )}
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Career Goals</h3>
                    <div className="space-y-4">
                      {formData.careerGoals ? (
                        <>
                          <GoalItem label="Short Term" value={formData.careerGoals.shortTerm} />
                          <GoalItem label="Medium Term" value={formData.careerGoals.mediumTerm} />
                          <GoalItem label="Long Term" value={formData.careerGoals.longTerm} />
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No career goals set yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        )}

        {/* Edit Profile Modal */}
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
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Profile Photo</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Profile Photo Section */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1a3884] to-[#002147] flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                      {editData.profilePhoto ? (
                        <img
                          src={editData.profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {getInitials(editData.name)}
                        </span>
                      )}
                    </div>
                    {/* Camera button overlay */}
                    <label className="absolute bottom-1 right-1 w-10 h-10 bg-[#1a3884] dark:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click the camera icon to upload a new photo</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || uploadingPhoto || !editData.profilePhoto}
                    className="flex-1 py-3 px-4 bg-[#1a3884] text-white rounded-2xl font-bold hover:bg-[#277a84] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1a3884]/20"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
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

// Helper Components for the redesigned layout
const InfoField = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-gray-400 dark:text-gray-500 text-[11px] uppercase font-bold tracking-wider mb-1">{label}</span>
    <span className="text-gray-900 dark:text-white text-base font-semibold truncate" title={value}>
      {value || "Not set"}
    </span>
  </div>
);

const GoalItem = ({ label, value }) => (
  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">{label}</p>
    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">{value || "No goal set yet."}</p>
  </div>
);

export default Profile;
