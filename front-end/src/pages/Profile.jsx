import { useState, useEffect } from "react";
// Version: 1.0.7 - Polished Detail Display & Robust Mapping} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getBackendUrl } from "@/services/api";

import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';

const Profile = () => {
  const navigate = useNavigate();  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    yearOfStudy: "3rd Year",
    department: "",
    studentId: "",
    dateOfBirth: "",
    address: ""
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [memberSince, setMemberSince] = useState("2024");
  const [completeRegistration, setCompleteRegistration] = useState(null);

  // Load user data from sessionStorage on mount
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {      navigate("/");
      return;
    }

    const user = JSON.parse(userData);

    // Fetch full registration details including all secondary sections
    const fetchRegistrationDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`);

        if (response.ok) {
          const fullReg = await response.json();
          setCompleteRegistration(fullReg);

          // Legacy form data support for Header/Sidebar consistency
          const dobSource = fullReg.dob?.$date || fullReg.dob;
          const newFormData = {
            name: fullReg.fullName || user.fullName || "Student",
            email: fullReg.email || user.email || "",
            phone: fullReg.mobileNumber || user.mobile || user.mobileNumber || "",
            institution: fullReg.institution || "",
            yearOfStudy: fullReg.yearOfStudy || fullReg.yearSemester || "",
            department: fullReg.department || "",
            studentId: fullReg.studentId || user.studentId || user.userId || "",
            dateOfBirth: dobSource ? new Date(dobSource).toISOString().split('T')[0] : "",
            address: fullReg.address ?
              (typeof fullReg.address === 'string' ? fullReg.address :
                `${fullReg.address.city || ""}, ${fullReg.address.state || ""}, ${fullReg.address.country || ""}`.replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ','))
              : ""
          };
          setFormData(newFormData);

          // Set profile photo
          if (fullReg.otherDetails?.profilePhoto) {
            setProfilePhoto(`${getBackendUrl()}/${fullReg.otherDetails.profilePhoto}`);
          }
        }
      } catch (error) {
        console.error("Error fetching registration details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user.createdAt) {
      const date = new Date(user.createdAt);
      setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }

    fetchRegistrationDetails();
  }, [navigate]);
  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "Not set";
    // Handle BSON date format {$date: ...} or string
    const dateStr = typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Not set";
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return "Not set";
    }  };

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
                      {/* Online Status Badge */}
                      <div className="absolute -right-2 top-1 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] text-gray-600 font-medium">Online</span>
                      </div>
                    </div>

                    {/* Name & Username */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-base font-bold text-gray-900">{formData.name || "Student"}</h2>
                        <Edit2 className="w-3 h-3 text-gray-400 cursor-pointer hover:text-[#30919D] transition-colors" />
                        <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">NEW</span>
                      </div>
                      <p className="text-gray-500 text-xs">@{formData.email?.split('@')[0] || 'student'}</p>
                    </div>
                  </div>

                  {/* Preview Profile Button */}
                  <button className="w-full py-2 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 mb-4">
                    Preview Student Profile
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
                        <p className="text-xs font-medium text-gray-900">{memberSince}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">Student ID</p>
                        <p className="text-xs font-medium text-gray-900">{formData.studentId || "Not assigned"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">Last Updated</p>
                        <p className="text-xs font-medium text-gray-900">
                          {completeRegistration?.submissionDate ? formatDate(completeRegistration.submissionDate) : "Recently"}
                        </p>                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => navigate('/comprehensive-signup')}
                    className="w-full py-2 mt-4 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile                  </button>
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
                {/* Student Details Section */}                <motion.div
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
                          <User className="w-4 h-4 text-[#30919D]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Nickname</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{completeRegistration?.nickname || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">                          <p className="text-xs font-medium text-gray-900 truncate">{formData.phone || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Alt Phone</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{completeRegistration?.alternateMobile || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">                        </div>
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
                  <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Academic Profile</h3>
                    <div className="w-10 h-0.5 bg-[#30919D] mt-1.5 hidden"></div>
                  </div>

                  <div className="p-4 space-y-6">
                    {/* Higher Education */}
                    {completeRegistration?.higherEducation && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#30919D] flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" /> HIGHER EDUCATION
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {Array.isArray(completeRegistration.higherEducation) ? (
                            completeRegistration.higherEducation.map((edu, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative group">
                                <p className="text-xs font-bold text-gray-900">{edu.degree || "N/A"}</p>
                                <p className="text-[10px] text-gray-600">{edu.specialization || "N/A"}</p>
                                <div className="mt-2 text-[10px] text-gray-500">
                                  <p>{edu.institutionName || "N/A"}</p>
                                  <p className="text-gray-400 text-[9px]">{edu.university || ""}</p>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[10px] font-medium px-2 py-0.5 bg-[#30919D]/10 text-[#30919D] rounded-full uppercase">{edu.qualificationLevel || "Degree"}</span>
                                  <span className="text-[10px] text-gray-400">Class of {edu.yearOfPassing || "N/A"}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative group">
                              <p className="text-xs font-bold text-gray-900">{completeRegistration.higherEducation?.degree || "Higher Education"}</p>
                              <p className="text-[10px] text-gray-600">{completeRegistration.higherEducation?.specialization || "Details pending"}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{completeRegistration.higherEducation?.institutionName || "Institution not set"}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-[#30919D]/10 text-[#30919D] rounded-full uppercase">{completeRegistration.higherEducation?.qualificationLevel || "Level Not Provided"}</span>
                                <span className="text-[10px] text-gray-400">Class of {completeRegistration.higherEducation?.yearOfPassing || "N/A"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Schooling */}
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">12th Standard</h4>
                        {completeRegistration?.twelfthDetails ? (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-gray-800">{completeRegistration.twelfthDetails.schoolName}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{completeRegistration.twelfthDetails.stream} • {completeRegistration.twelfthDetails.yearOfPassing}</p>
                            <p className="text-[10px] font-bold text-[#30919D] mt-1">{completeRegistration.twelfthDetails.percentage}% Score</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic">No details provided</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">10th Standard</h4>
                        {completeRegistration?.tenthDetails ? (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-gray-800">{completeRegistration.tenthDetails.schoolName}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Year of Passing: {completeRegistration.tenthDetails.yearOfPassing}</p>
                            <p className="text-[10px] font-bold text-[#30919D] mt-1">{completeRegistration.tenthDetails.percentage}% Score</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic">No details provided</p>
                        )}                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Experience & Projects Section */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Work Experience */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#30919D]" />
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Work Experience</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {completeRegistration?.workExperience && completeRegistration.workExperience.length > 0 ? (
                        completeRegistration.workExperience.map((work, idx) => (
                          <div key={idx} className="relative pl-4 border-l-2 border-slate-100">
                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#30919D]"></div>
                            <p className="text-xs font-bold text-gray-900">{work.jobTitle}</p>
                            <p className="text-[10px] text-gray-600 font-medium">{work.organizationName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {work.startDate ? formatDate(work.startDate) : 'N/A'} -
                              {work.currentlyWorking ? ' Present' : (work.endDate ? formatDate(work.endDate) : ' N/A')}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-2 line-clamp-2">{work.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400">No work experience added yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Projects */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#30919D]" />
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Projects</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {completeRegistration?.projects && completeRegistration.projects.length > 0 ? (
                        completeRegistration.projects.map((proj, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-gray-900">{proj.title}</p>
                              {proj.projectUrl && (
                                <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#30919D] hover:underline flex items-center gap-0.5">
                                  Link <ChevronRight className="w-2 h-2" />
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{proj.description}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[9px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-gray-600">{proj.teamType}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400">No projects added yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Skills, Certs & Extra Section */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Technical Certificates */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#30919D]" />
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Technical Certifications</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {completeRegistration?.certificates && completeRegistration.certificates.length > 0 ? (
                        completeRegistration.certificates.map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 group hover:bg-slate-50 rounded-md transition-colors">
                            <div className="w-10 h-10 rounded bg-[#30919D]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#30919D]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{cert.title}</p>
                              <p className="text-[10px] text-gray-500">{cert.issuingOrg} • {cert.yearOfCompletion}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-center text-gray-400 py-4">No certificates added.</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Career Goals & Preferences */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#30919D]" />
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Career Trajectory</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {completeRegistration?.careerGoals && (
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="text-[10px] font-bold text-[#30919D] bg-[#30919D]/5 px-2 py-0.5 rounded h-fit whitespace-nowrap">SHORT TERM</div>
                            <p className="text-[10px] text-gray-600 italic">"{completeRegistration.careerGoals.shortTerm}"</p>
                          </div>
                          <div className="flex gap-3">
                            <div className="text-[10px] font-bold text-[#30919D] bg-[#30919D]/5 px-2 py-0.5 rounded h-fit whitespace-nowrap">LONG TERM</div>
                            <p className="text-[10px] text-gray-600 italic">"{completeRegistration.careerGoals.longTerm}"</p>
                          </div>
                        </div>
                      )}

                      {/* Job Preferences */}
                      {completeRegistration?.jobPreferences && (
                        <div className="pt-3 border-t border-gray-100">
                          <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Job Preferences</h4>
                          <div className="space-y-2">
                            {Array.isArray(completeRegistration.jobPreferences.items) ? (
                              completeRegistration.jobPreferences.items.map((pref, idx) => (
                                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100">
                                  <p className="text-[10px] font-bold text-gray-800">{pref.preferredRole || "N/A"}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                    <span className="text-[9px] text-gray-500">Type: {pref.jobType || "N/A"}</span>
                                    <span className="text-[9px] text-gray-500">Location: {pref.preferredLocation || "N/A"}</span>
                                    <span className="text-[9px] text-gray-500">Expected: {pref.expectedSalary || "N/A"}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <p className="text-[10px] font-bold text-gray-800">{completeRegistration.jobPreferences.preferredRole || "Role Not Set"}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                  <span className="text-[9px] text-gray-500">Type: {completeRegistration.jobPreferences.jobType || "N/A"}</span>
                                  <span className="text-[9px] text-gray-500">Location: {completeRegistration.jobPreferences.preferredLocation || "N/A"}</span>
                                  <span className="text-[9px] text-gray-500">Expected: {completeRegistration.jobPreferences.expectedSalary || "N/A"}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Preferred Sectors</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {completeRegistration?.sectorPreferences?.preferredSectors?.map((sector, idx) => (
                            <span key={idx} className="text-[9px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                              {sector}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Extracurricular Activities */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#30919D]" />
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Extracurricular</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {completeRegistration?.extracurricular && completeRegistration.extracurricular.length > 0 ? (
                        completeRegistration.extracurricular.map((extra, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-gray-900 uppercase">{extra.activityType}</p>
                              <span className="text-[9px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-gray-600 capitalize">{extra.level} Level</span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-medium mt-1">{extra.achievements}</p>
                            <p className="text-[10px] text-gray-500 mt-1 italic leading-relaxed">{extra.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-center text-gray-400 py-4">No extracurricular activities added.</p>
                      )}
                    </div>
                  </motion.div>
                </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
