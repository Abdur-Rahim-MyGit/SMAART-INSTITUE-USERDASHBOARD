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
  User,
  Video,
  Plus
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl } from "@/services/api";
import useUser from "@/hooks/useUser";

import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import BadgeGallery from "@/components/badges/BadgeGallery";

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
    address: ""
  });
  const [activeTab, setActiveTab] = useState("info"); // 'info' or 'badges'

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [memberSince, setMemberSince] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);

  // Force refresh user details on mount to get latest badges/progress
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/");
      return;
    }

    if (user) {
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

      const reg = user.otherDetails || {};
      
      const newFormData = {
        name: user.fullName || "",
        email: user.email || "",
        phone: user.mobileNumber || "",
        institution: parseInstitution(user.institution || reg.institution) || "",
        yearOfStudy: user.yearSemester || reg.yearOfStudy || reg.yearSemester || "",
        department: user.department || reg.department || "",
        studentId: user.studentId || reg.studentId || "",
        dateOfBirth: (user.dob || reg.dob) ? new Date(user.dob || reg.dob).toISOString().split('T')[0] : "",
        address: (user.address || reg.address) ?
          `${(user.address || reg.address).city || ""}, ${(user.address || reg.address).state || ""}, ${(user.address || reg.address).country || ""}`.replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ',')
          : ""
      };

      setFormData(newFormData);

      if (user.createdAt) {
        const date = new Date(user.createdAt);
        setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        // Check if account is less than 30 days old
        const daysSinceCreation = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        setIsNewUser(daysSinceCreation < 30);
      }

      // Profile photo: check multiple possible fields
      const photoPath = user.profileImage || user.otherDetails?.profileImage || user.otherDetails?.profilePhoto;
      if (photoPath) {
        setProfilePhoto(`${getBackendUrl()}/${photoPath}`);
      }

      // Fetch enrolled courses
      fetchEnrolledCourses(user._id || user.id);

      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

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
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  {/* Profile Photo & Online Status */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="relative mb-2">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#30919D] to-[#002147] flex items-center justify-center overflow-hidden border-3 border-white shadow-md">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {getInitials(formData.name)}
                          </span>
                        )}
                      </div>
                      {/* Online Status Badge - shown since user is viewing their own profile */}
                      <div className="absolute -right-2 top-1 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm" title="You are currently online">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] text-gray-600 font-medium">Online</span>
                      </div>
                    </div>

                    {/* Name & Username */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-base font-bold text-gray-900">{formData.name || "Student"}</h2>
                        <Edit2 className="w-3 h-3 text-gray-400 cursor-pointer hover:text-[#30919D] transition-colors" onClick={() => navigate('/dashboard/settings')} title="Edit profile" />
                        {isNewUser && <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">NEW</span>}
                      </div>
                      <p className="text-gray-500 text-xs">@{formData.email?.split('@')[0] || 'student'}</p>
                    </div>
                  </div>

                  {/* Preview Profile Button */}
                  <button 
                    onClick={() => navigate('/dashboard/settings')}
                    className="w-full py-2 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 mb-4"
                  >
                    Edit Student Profile
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  {/* Profile Info List */}
                  <div className="space-y-2.5 border-t border-gray-100 pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">From</p>
                        <p className="text-xs font-medium text-gray-900">{formData.address || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">Member since</p>
                        <p className="text-xs font-medium text-gray-900">{memberSince || "Not available"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">Status</p>
                        <p className="text-xs font-medium text-gray-900">{user?.status || "Active"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button 
                    onClick={() => navigate('/dashboard/settings')}
                    className="w-full py-2 mt-4 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                </motion.div>

                {/* Intro Video Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Video className="w-3.5 h-3.5 text-gray-600" />
                    <h3 className="font-semibold text-xs text-gray-900">Intro video</h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded">BETA</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">Stand out with a short introduction video.</p>
                  <button className="w-full py-2 rounded-md bg-[#30919D] hover:bg-[#277a84] text-white text-xs font-semibold transition-colors">
                    Get started
                  </button>
                </motion.div>
              </div>

              {/* Right Content Area */}
              <div className="space-y-4">
                {/* Tabs Switcher */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      activeTab === "info"
                        ? "bg-[#30919D] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Information
                  </button>
                  <button
                    onClick={() => setActiveTab("badges")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      activeTab === "badges"
                        ? "bg-[#30919D] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Badges & Achievements
                  </button>
                </div>

                {activeTab === "info" ? (
                  <>
                    {/* Student Details Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Student Details</h3>
                    <div className="w-10 h-0.5 bg-[#30919D] mt-1.5"></div>
                  </div>

                  <div className="p-3 grid grid-cols-2 gap-2">
                    {/* Info Cards */}
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Email Address</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.email || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Phone Number</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.phone || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Date of Birth</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formatDate(formData.dateOfBirth)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Student ID</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.studentId || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Academic Information Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Academic Information</h3>
                    <div className="w-10 h-0.5 bg-[#30919D] mt-1.5"></div>
                  </div>

                  <div className="p-3 grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Building className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-500">Institution</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.institution || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-500">Department</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.department || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-500">Year of Study</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{formData.yearOfStudy || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Active Courses Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Active Courses</h3>
                    <div className="w-10 h-0.5 bg-[#30919D] mt-1.5"></div>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {enrolledCourses.length > 0 ? (
                        enrolledCourses.slice(0, 2).map((enrollment) => (
                          <Link
                            key={enrollment._id}
                            to="/dashboard/courses"
                            className="group block p-3 border border-gray-200 rounded-lg hover:border-[#30919D] hover:shadow-sm transition-all"
                          >
                            <div className="aspect-video bg-gradient-to-br from-[#30919D]/20 to-[#002147]/20 rounded mb-2 flex items-center justify-center overflow-hidden">
                              {enrollment.course?.thumbnail ? (
                                <img src={enrollment.course.thumbnail} alt={enrollment.course?.title} className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-[#30919D] opacity-50" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-gray-900 group-hover:text-[#30919D] transition-colors truncate">
                              {enrollment.course?.title || 'Course'}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {enrollment.progress != null ? `${Math.round(enrollment.progress)}% complete` : 'Continue learning →'}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <Link
                          to="/dashboard/courses"
                          className="group block p-3 border border-gray-200 rounded-lg hover:border-[#30919D] hover:shadow-sm transition-all"
                        >
                          <div className="aspect-video bg-gradient-to-br from-[#30919D]/20 to-[#002147]/20 rounded mb-2 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#30919D] opacity-50" />
                          </div>
                          <p className="text-xs font-medium text-gray-900 group-hover:text-[#30919D] transition-colors">
                            No courses yet
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Browse courses →</p>
                        </Link>
                      )}

                      {/* Explore More Card */}
                      <Link
                        to="/dashboard/courses"
                        className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-200 rounded-lg hover:border-[#30919D] hover:bg-[#30919D]/5 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-600">Explore Courses</p>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
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
      </div>
    </div>
  );
};

export default Profile;
