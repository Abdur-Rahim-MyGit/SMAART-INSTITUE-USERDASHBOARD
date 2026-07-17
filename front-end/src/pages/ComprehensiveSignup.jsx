import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ChevronDown, User, GraduationCap, FileText, Award, CreditCard, Palette, Lock, Check, Briefcase, Target, FolderOpen, Plus, Trash2, ChevronRight, Quote, QrCode, Loader2, CheckCircle2, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiCall } from "@/services/api";
import FileUpload from "@/components/FileUpload";
import logoWhite from "@/assets/white.png";
import logoGold from "@/assets/blue.png"; // Using blue.png as proxy for logo if needed, but the ref has white/blue theme
import { useUser } from "@/contexts/UserContextFixed";
import { useTranslation } from "react-i18next";
import { getStates, getDistricts, getCities, getPincodeForCity } from "@/services/indiaLocationService";

const ComprehensiveSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDashboardWarning, setShowDashboardWarning] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const [preFilledFields, setPreFilledFields] = useState({
    email: false, fullName: false, mobileNumber: false, institution: false, department: false,
  });

  useEffect(() => {
    const signupEmail = sessionStorage.getItem("signupEmail");
    const signupFullName = sessionStorage.getItem("signupFullName");
    const selectedInstitution = sessionStorage.getItem("selectedInstitution");
    const userDataStr = sessionStorage.getItem("user");
    let userData = null;
    if (userDataStr) { try { userData = JSON.parse(userDataStr); } catch (error) { console.error("Error parsing user data:", error); } }
    const email = signupEmail || userData?.email;
    const fullName = signupFullName || userData?.fullName;

    // SECURITY FIX #11: Redirect if no signup context and no logged-in user
    if (!email && !userData) {
      navigate('/', { replace: true });
      return;
    }

    // SECURITY FIX #12: Redirect already-registered users away from registration page
    // If user has already completed registration, they should not access this page
    if (userData?.hasRegistration || userData?.registrationCompleted) {
      console.log("[ComprehensiveSignup] User already registered, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
      return;
    }

    if (email) {
      setPersonalDetails(prev => ({
        ...prev,
        email,
        fullName: fullName || prev.fullName,
        mobileNumber: userData?.mobileNumber || "",
        institution: "",
        profilePhoto: userData?.profileImage || prev.profilePhoto,
        educationLevel: userData?.academic?.degreeLevel || userData?.educationLevel || prev.educationLevel || ""
      }));
      setPreFilledFields(prev => ({ ...prev, email: true, fullName: !!fullName, mobileNumber: !!userData?.mobileNumber }));
    }

    if (selectedInstitution) {
      try {
        const institutionObj = JSON.parse(selectedInstitution);
        setPersonalDetails(prev => ({ ...prev, institution: institutionObj.name || selectedInstitution }));
        setPreFilledFields(prev => ({ ...prev, institution: true }));
      } catch { setPersonalDetails(prev => ({ ...prev, institution: selectedInstitution })); setPreFilledFields(prev => ({ ...prev, institution: true })); }
    }
    if (userData?.department) {
      const deptStr = typeof userData.department === 'object' ? (userData.department.fullName || userData.department.name || "") : userData.department;
      setPersonalDetails(prev => ({ ...prev, department: deptStr }));
      setPreFilledFields(prev => ({ ...prev, department: true }));
    }

    const fetchLatestDetails = async () => {
      if (email) {
        try {
          const regData = await apiCall(`/users/register-details/${email}`);
          const studentRes = await apiCall(`/students/by-email/${email}`).catch(() => null);
          let currentStudent = null;
          if (studentRes?.success && studentRes?.data) {
            currentStudent = studentRes.data;
            setStudentDetails(studentRes.data);
          }

          if (regData) {
            updateUser({
              ...regData,
              profileImage: regData.profilePhoto || regData.profileImage || userData?.profileImage
            });

            const studentAcademic = currentStudent?.academic || {};
            const studentDegree = currentStudent?.degree || {};
            const studentDept = currentStudent?.department || regData.department || {};
            const degreeLevel = studentDept.level || studentAcademic.degreeLevel || studentDegree.level || regData.academic?.degreeLevel || userData?.academic?.degreeLevel || regData.educationLevel || "";

            // Year of passing extraction
            let expectedYear = "";
            const batchVal = currentStudent?.batch || studentDept.batch || "";
            if (batchVal) {
              const match = batchVal.match(/\b(20\d{2})\b/g);
              if (match && match.length > 0) {
                expectedYear = match[match.length - 1];
              } else {
                expectedYear = batchVal;
              }
            }

            // Year of study calculation based on batch
            let yearOfStudy = "";
            const finalBatch = regData.batch || currentStudent?.batch || studentDept.batch || "";
            if (finalBatch) {
              const years = finalBatch.match(/\b(20\d{2})\b/g);
              if (years && years.length > 0) {
                const startYear = parseInt(years[0]);
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth(); // 0-indexed: 0 = Jan, 11 = Dec
                const academicStartYear = currentMonth >= 5 ? currentYear : currentYear - 1;
                const elapsedYears = academicStartYear - startYear + 1;
                if (elapsedYears <= 0) yearOfStudy = "1st Year";
                else if (elapsedYears === 1) yearOfStudy = "1st Year";
                else if (elapsedYears === 2) yearOfStudy = "2nd Year";
                else if (elapsedYears === 3) yearOfStudy = "3rd Year";
                else if (elapsedYears === 4) yearOfStudy = "4th Year";
                else yearOfStudy = "Graduated";
              }
            }
            if (!yearOfStudy && currentStudent?.semester) {
              const sem = Number(currentStudent.semester);
              if (sem <= 2) yearOfStudy = "1st Year";
              else if (sem <= 4) yearOfStudy = "2nd Year";
              else if (sem <= 6) yearOfStudy = "3rd Year";
              else yearOfStudy = "4th Year";
            }

            setPersonalDetails(prev => ({
              ...prev,
              fullName: regData.fullName || currentStudent?.fullName || prev.fullName,
              gender: regData.gender || currentStudent?.gender || prev.gender,
              mobileNumber: regData.mobileNumber || regData.mobile || currentStudent?.mobile || prev.mobileNumber,
              institution: regData.institution || regData.college?.collegeName || currentStudent?.college?.collegeName || prev.institution,
              department: regData.department || (studentDept.fullName || studentDept.abbreviation) || prev.department || "",
              dob: regData.dob ? new Date(regData.dob).toISOString().split('T')[0] : (currentStudent?.dateOfBirth ? new Date(currentStudent.dateOfBirth).toISOString().split('T')[0] : prev.dob),
              profilePhoto: regData.profilePhoto || regData.profileImage || currentStudent?.profileImage || userData?.profileImage || prev.profilePhoto,
              educationLevel: degreeLevel || prev.educationLevel || "",
              cgpa: currentStudent?.cgpa || currentStudent?.academic?.cgpa || regData.cgpa || regData.academic?.cgpa || prev.cgpa || "",
              yearOfPassing: expectedYear || regData.yearOfPassing || prev.yearOfPassing || "",
              yearOfStudy: yearOfStudy || regData.yearOfStudy || prev.yearOfStudy || "",
              batch: regData.batch || currentStudent?.batch || studentDept.batch || prev.batch || "",
              address: {
                street: regData.address?.street || currentStudent?.address?.street || prev.address?.street || "",
                city: regData.address?.city || currentStudent?.address?.city || prev.address?.city || "",
                state: regData.address?.state || currentStudent?.address?.state || prev.address?.state || "",
                country: regData.address?.country || currentStudent?.address?.address?.country || prev.address?.country || "India",
                district: regData.address?.district || currentStudent?.address?.district || prev.address?.district || "",
                pincode: regData.address?.pincode || currentStudent?.address?.pincode || prev.address?.pincode || ""
              }
            }));

            setPreFilledFields(prev => ({
              ...prev,
              email: true,
              fullName: !!(regData.fullName || currentStudent?.fullName),
              mobileNumber: !!(regData.mobileNumber || regData.mobile || currentStudent?.mobile),
              institution: !!(regData.institution || regData.college?.collegeName || currentStudent?.college?.collegeName),
              department: !!studentDept
            }));

            // Pre-populate Higher Education
            let initialHigherEdArray = [];
            if (regData.higherEducation && Array.isArray(regData.higherEducation) && regData.higherEducation.length > 0) {
              initialHigherEdArray = [...regData.higherEducation];
            }

            const dbLevel = studentDept.level || studentAcademic.degreeLevel || studentDegree.level || "";
            const dbDomain = studentDept.domain || studentAcademic.domain || studentDegree.domain || "";
            const dbFullName = studentDept.fullName || studentDept.abbreviation || studentAcademic.degreeGroup || studentDegree.fullName || studentDegree.abbreviation || "";
            const dbSpecialization = studentDept.specialization || studentAcademic.specialisation || studentDegree.specialization || "";

            if (initialHigherEdArray.length === 0) {
              initialHigherEdArray.push({
                id: Date.now(),
                qualificationLevel: dbLevel || "",
                degree: dbDomain || "",
                degreeFullName: dbFullName || "",
                specialization: dbSpecialization || "General",
                institutionName: currentStudent?.college?.collegeName || regData.institution || "",
                cgpaPercentage: currentStudent?.cgpa || studentAcademic.cgpa || regData.cgpa || regData.academic?.cgpa || "",
                degreeStatus: "pursuing"
              });
            } else {
              initialHigherEdArray[0] = {
                ...initialHigherEdArray[0],
                qualificationLevel: dbLevel || initialHigherEdArray[0].qualificationLevel || "",
                degree: dbDomain || initialHigherEdArray[0].degree || "",
                degreeFullName: dbFullName || initialHigherEdArray[0].degreeFullName || "",
                specialization: dbSpecialization || initialHigherEdArray[0].specialization || ""
              };
            }

            setHigherEducation(initialHigherEdArray);

            initialHigherEdArray.forEach((item, index) => {
              if (item.qualificationLevel) {
                const fetchSub = async () => {
                  try {
                    const domainsRes = await apiCall(`/degrees/domains?level=${encodeURIComponent(item.qualificationLevel)}`);
                    if (domainsRes?.success) {
                      setDegreeOptions(prev => ({
                        ...prev,
                        domains: { ...prev.domains, [index]: domainsRes.data }
                      }));
                    }
                    if (item.degree) {
                      const fullNamesRes = await apiCall(`/degrees/fullNames?level=${encodeURIComponent(item.qualificationLevel)}&domain=${encodeURIComponent(item.degree)}`);
                      if (fullNamesRes?.success) {
                        setDegreeOptions(prev => ({
                          ...prev,
                          fullNames: { ...prev.fullNames, [index]: fullNamesRes.data }
                        }));
                      }
                    }
                    if (item.degreeFullName) {
                      const specsRes = await apiCall(`/degrees/specializations?level=${encodeURIComponent(item.qualificationLevel)}&domain=${encodeURIComponent(item.degree)}&fullName=${encodeURIComponent(item.degreeFullName)}`);
                      if (specsRes?.success) {
                        setDegreeOptions(prev => ({
                          ...prev,
                          specializations: { ...prev.specializations, [index]: specsRes.data }
                        }));
                      }
                    }
                  } catch (e) {
                    console.error("Error pre-fetching degree sub options:", e);
                  }
                };
                fetchSub();
              }
            });
          }
        } catch (err) {
          console.error("Error fetching latest user registration details on mount:", err);
        }
      }
    };
    fetchLatestDetails();
  }, [navigate]);

  const [excelData, setExcelData] = useState({ sectors: [], roles: [] });
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

  // Degree Options State
  const [degreeOptions, setDegreeOptions] = useState({
    levels: [],
    domains: {}, // mapped by index: [options]
    fullNames: {}, // mapped by index: [options]
    specializations: {} // mapped by index: [options]
  });

  // Fetch Degree Levels on Mount
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await apiCall('/degrees/levels');
        if (response?.success) {
          setDegreeOptions(prev => ({ ...prev, levels: response.data }));
        }
      } catch (error) {
        console.error("Error fetching degree levels:", error);
      }
    };
    fetchLevels();
  }, []);

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

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const data = await apiCall('/career-intelligence/excel-data');
        if (data) {
          setExcelData({
            sectors: data.masterSectors || [],
            roles: data.allRoles || []
          });
        }
      } catch (error) {
        console.error("Error fetching career data:", error);
      }
    };
    fetchExcelData();
  }, []);

  const [personalDetails, setPersonalDetails] = useState({ fullName: "", nickname: "", dob: "", gender: "", mobileNumber: "", email: "", institution: "", department: "", yearOfStudy: "", yearOfPassing: "", educationLevel: "", profilePhoto: null, address: { street: "", city: "", state: "", country: "India", district: "", pincode: "" }, cgpa: "", batch: "" });
  const [tenthDetails, setTenthDetails] = useState({ schoolName: "", board: "", yearOfPassing: "", percentage: "" });
  const [twelfthDetails, setTwelfthDetails] = useState({ schoolName: "", stream: "", board: "", yearOfPassing: "", percentage: "" });
  const [higherEducation, setHigherEducation] = useState([{ id: Date.now(), qualificationLevel: "", degreeFullName: "", degree: "", specialization: "", institutionName: "", cgpaPercentage: "", degreeStatus: "" }]);
  const [extracurricular, setExtracurricular] = useState({ isApplicable: true, items: [{ id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] });
  const [jobPreferences, setJobPreferences] = useState({ items: [{ id: Date.now(), preferredRole: "", jobType: "", preferredLocation1: "", preferredLocation2: "", preferredLocation3: "", willingToRelocate: "", expectedSalary: "" }] });
  const [sectorPreferences, setSectorPreferences] = useState({ preferredSectors: [], secondarySectors: [], otherSector: "" }); // added otherSector
  const [careerGoals, setCareerGoals] = useState({ shortTerm: "", mediumTerm: "", longTerm: "" });
  const [personalDevelopmentGoals, setPersonalDevelopmentGoals] = useState({ shortTerm: "", mediumTerm: "", longTerm: "" });
  const [workExperience, setWorkExperience] = useState({ isApplicable: true, items: [{ id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, keyResponsibilities: "", significantAccomplishments: "", documents: { offerLetter: null, appointmentLetter: null, appreciationLetter: null, experienceLetter: null }, selectedDocs: [], githubLink: "" }] });
  const [projects, setProjects] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", doneIn: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", significantAchievements: "", projectUrl: "" }] });
  const [certificates, setCertificates] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }] }); // added verificationUrl

  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setRoleSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const steps = [
    { title: t("comp_signup.steps.personal", "Personal"), icon: <User className="w-4 h-4" /> },
    { title: t("comp_signup.steps.tenth", "10th"), icon: <GraduationCap className="w-4 h-4" /> },
    { title: t("comp_signup.steps.twelfth", "12th"), icon: <GraduationCap className="w-4 h-4" /> },
    { title: t("comp_signup.steps.higher", "Higher Ed"), icon: <Award className="w-4 h-4" /> },
    { title: t("comp_signup.steps.activities", "Activities"), icon: <Palette className="w-4 h-4" /> },
    { title: t("comp_signup.steps.goals", "Goals"), icon: <Target className="w-4 h-4" /> },
    { title: t("comp_signup.steps.experience", "Experience"), icon: <Briefcase className="w-4 h-4" /> },
    { title: t("comp_signup.steps.projects", "Projects"), icon: <FolderOpen className="w-4 h-4" /> },
    { title: t("comp_signup.steps.certificates", "Certificates"), icon: <FileText className="w-4 h-4" /> },
  ];

  const validatePersonalDetails = () => {
    if (!personalDetails.profilePhoto) { toast.error(t("comp_signup.toast.photo_req", "Profile Photo is required")); return false; }
    if (!personalDetails.dob) { toast.error(t("comp_signup.toast.dob_req", "Date of Birth is required")); return false; }
    const dobDate = new Date(personalDetails.dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (age < 16 || (age === 16 && m < 0)) { toast.error(t("comp_signup.toast.underage", "You must be at least 16 years old.")); return false; }
    if (dobDate > today) { toast.error(t("comp_signup.toast.future_dob", "Date of Birth cannot be in the future")); return false; }
    if (!personalDetails.gender) { toast.error(t("comp_signup.toast.gender_req", "Gender is required")); return false; }
    if (!personalDetails.yearOfStudy) { toast.error(t("comp_signup.toast.study_year_req", "Year of Study is required")); return false; }
    if (!personalDetails.address?.country?.trim()) { toast.error(t("comp_signup.toast.country_req", "Country is required")); return false; }
    if (!personalDetails.address?.state?.trim()) { toast.error(t("comp_signup.toast.state_req", "State/Province is required")); return false; }
    if (!personalDetails.address?.district?.trim()) { toast.error(t("comp_signup.toast.district_req", "District/Region is required")); return false; }
    if (!personalDetails.address?.city?.trim()) { toast.error(t("comp_signup.toast.city_req", "City/Town is required")); return false; }
    if (!personalDetails.address?.street?.trim()) { toast.error(t("comp_signup.toast.street_req", "Address Line is required")); return false; }
    if (!personalDetails.address?.pincode?.trim()) { toast.error(t("comp_signup.toast.pincode_req", "Pincode/Zipcode is required")); return false; }
    return true;
  };

  const validateTenthDetails = () => {
    if (!tenthDetails.schoolName?.trim()) { toast.error(t("comp_signup.toast.tenth_school_req", "10th School Name is required")); return false; }
    if (!tenthDetails.board) { toast.error(t("comp_signup.toast.tenth_board_req", "10th Board is required")); return false; }
    if (!tenthDetails.yearOfPassing) { toast.error(t("comp_signup.toast.tenth_passing_req", "10th Year of Passing is required")); return false; }
    if (!tenthDetails.percentage) { toast.error(t("comp_signup.toast.tenth_pct_req", "10th Percentage/CGPA is required")); return false; }
    const pct = parseFloat(tenthDetails.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error(t("comp_signup.toast.pct_range", "Percentage/CGPA must be between 0 and 100")); return false; }
    if (pct > 10 && pct < 30) { toast.error(t("comp_signup.toast.pct_invalid_range", "Please enter a valid Percentage (30-100) or CGPA (0-10).")); return false; }
    return true;
  };

  const validateTwelfthDetails = () => {
    if (!twelfthDetails.schoolName?.trim()) { toast.error(t("comp_signup.toast.twelfth_school_req", "12th School Name is required")); return false; }
    if (!twelfthDetails.board) { toast.error(t("comp_signup.toast.twelfth_board_req", "12th Board is required")); return false; }
    if (!twelfthDetails.stream) { toast.error(t("comp_signup.toast.twelfth_stream_req", "12th Stream is required")); return false; }
    if (!twelfthDetails.yearOfPassing) { toast.error(t("comp_signup.toast.twelfth_passing_req", "12th Year of Passing is required")); return false; }
    if (!twelfthDetails.percentage) { toast.error(t("comp_signup.toast.twelfth_pct_req", "12th Percentage/CGPA is required")); return false; }
    const pct = parseFloat(twelfthDetails.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error(t("comp_signup.toast.pct_range", "Percentage/CGPA must be between 0 and 100")); return false; }
    if (pct > 10 && pct < 30) { toast.error(t("comp_signup.toast.pct_invalid_range", "Please enter a valid Percentage (30-100) or CGPA (0-10).")); return false; }
    return true;
  };

  const validateHigherEducation = () => {
    for (let i = 0; i < higherEducation.length; i++) {
      const h = higherEducation[i];
      if (!h.qualificationLevel) { toast.error(t("comp_signup.toast.higher_level_req", "Higher Ed {{idx}}: Degree Level is required", { idx: i + 1 })); return false; }
      if (!h.degree) { toast.error(t("comp_signup.toast.higher_domain_req", "Higher Ed {{idx}}: Domain Field is required", { idx: i + 1 })); return false; }
      if (!h.degreeFullName) { toast.error(t("comp_signup.toast.higher_name_req", "Higher Ed {{idx}}: Degree Full Name is required", { idx: i + 1 })); return false; }
      if (!h.specialization) { toast.error(t("comp_signup.toast.higher_spec_req", "Higher Ed {{idx}}: Specialization is required", { idx: i + 1 })); return false; }
      if (!h.institutionName?.trim()) { toast.error(t("comp_signup.toast.higher_inst_req", "Higher Ed {{idx}}: Institution Name is required", { idx: i + 1 })); return false; }
      if (!h.degreeStatus) { toast.error(t("comp_signup.toast.higher_status_req", "Higher Ed {{idx}}: Degree Status is required", { idx: i + 1 })); return false; }
      if (h.degreeStatus !== "pursuing") {
        if (!h.cgpaPercentage) { toast.error(t("comp_signup.toast.higher_cgpa_req", "Higher Ed {{idx}}: CGPA/Percentage is required", { idx: i + 1 })); return false; }
        const val = parseFloat(h.cgpaPercentage);
        if (isNaN(val) || val < 0 || val > 100) { toast.error(t("comp_signup.toast.higher_cgpa_range", "Higher Ed {{idx}}: CGPA/Percentage must be between 0 and 100", { idx: i + 1 })); return false; }
      }
    }
    return true;
  };

  const validateExtracurricular = () => {
    if (!extracurricular.isApplicable) return true;
    for (let i = 0; i < extracurricular.items.length; i++) {
      const e = extracurricular.items[i];
      if (!e.activityType) { toast.error(t("comp_signup.toast.activity_type_req", "Activity {{idx}}: Activity Type is required", { idx: i + 1 })); return false; }
      if (e.activityType === "Others" && !e.customActivityType?.trim()) { toast.error(t("comp_signup.toast.activity_custom_req", "Activity {{idx}}: Please specify the activity type", { idx: i + 1 })); return false; }
      if (!e.level) { toast.error(t("comp_signup.toast.activity_level_req", "Activity {{idx}}: Level is required", { idx: i + 1 })); return false; }
      if (!e.achievements?.trim()) { toast.error(t("comp_signup.toast.activity_ach_req", "Activity {{idx}}: Achievements are required", { idx: i + 1 })); return false; }
      if (!e.description?.trim()) { toast.error(t("comp_signup.toast.activity_desc_req", "Activity {{idx}}: Description is required", { idx: i + 1 })); return false; }
    }
    return true;
  };

  const validateJobPreferences = () => {
    for (let i = 0; i < jobPreferences.items.length; i++) {
      const j = jobPreferences.items[i];
      if (!j.preferredRole?.trim()) { toast.error(t("comp_signup.toast.job_role_req", "Job Pref {{idx}}: Preferred Job Role is required", { idx: i + 1 })); return false; }
      if (!j.jobType) { toast.error(t("comp_signup.toast.job_type_req", "Job Pref {{idx}}: Job Type is required", { idx: i + 1 })); return false; }
      if (!j.preferredLocation1?.trim()) { toast.error(t("comp_signup.toast.job_loc_req", "Job Pref {{idx}}: Location Preference 1 is required", { idx: i + 1 })); return false; }
      if (!j.willingToRelocate) { toast.error(t("comp_signup.toast.job_relocate_req", "Job Pref {{idx}}: Willing to Relocate is required", { idx: i + 1 })); return false; }
      if (!j.expectedSalary) { toast.error(t("comp_signup.toast.job_salary_req", "Job Pref {{idx}}: Expected Salary is required", { idx: i + 1 })); return false; }
    }
    return true;
  };

  const validateSectorPreferences = () => {
    if (sectorPreferences.preferredSectors.length === 0) { toast.error(t("comp_signup.toast.sector_select", "Please select at least one preferred sector")); return false; }
    if (sectorPreferences.preferredSectors.includes("Other") && !sectorPreferences.otherSector.trim()) { toast.error(t("comp_signup.toast.sector_other_req", "Please specify the 'Other' sector")); return false; }
    return true;
  };

  const validateCareerGoals = () => {
    if (!careerGoals.shortTerm?.trim() || !careerGoals.mediumTerm?.trim() || !careerGoals.longTerm?.trim()) { toast.error(t("comp_signup.toast.career_goals_req", "All career goals are required")); return false; }
    if (!personalDevelopmentGoals.shortTerm?.trim() || !personalDevelopmentGoals.mediumTerm?.trim() || !personalDevelopmentGoals.longTerm?.trim()) { toast.error(t("comp_signup.toast.dev_goals_req", "All personal development goals are required")); return false; }
    return true;
  };

  const validateWorkExperience = () => {
    if (!workExperience.isApplicable) return true;
    for (let i = 0; i < workExperience.items.length; i++) {
      const w = workExperience.items[i];
      if (w.currentlyWorking) {
        if (!w.experienceType || !w.organizationName?.trim() || !w.jobTitle?.trim() || !w.industry?.trim() || !w.startDate) {
          toast.error(t("comp_signup.toast.exp_req", "Experience {{idx}}: All fields marked * are required", { idx: i + 1 }));
          return false;
        }
      } else {
        if (!w.experienceType || !w.organizationName?.trim() || !w.jobTitle?.trim() || !w.industry?.trim() || !w.startDate || !w.keyResponsibilities?.trim() || !w.significantAccomplishments?.trim()) {
          toast.error(t("comp_signup.toast.exp_req", "Experience {{idx}}: All fields marked * are required", { idx: i + 1 }));
          return false;
        }
      }
      if (new Date(w.startDate) > new Date()) { toast.error(t("comp_signup.toast.exp_future_start", "Experience {{idx}}: Start Date cannot be in the future", { idx: i + 1 })); return false; }
      if (!w.currentlyWorking && !w.endDate) { toast.error(t("comp_signup.toast.exp_end_req", "Experience {{idx}}: End Date is required", { idx: i + 1 })); return false; }
    }
    return true;
  };

  const validateProjects = () => {
    if (!projects.isApplicable) return true;
    for (let i = 0; i < projects.items.length; i++) {
      const p = projects.items[i];
      if (p.currentlyWorking) {
        if (!p.title?.trim() || !p.doneIn || !p.teamType || !p.startDate) {
          toast.error(t("comp_signup.toast.proj_req", "Project {{idx}}: All fields marked * are required", { idx: i + 1 }));
          return false;
        }
      } else {
        if (!p.title?.trim() || !p.doneIn || !p.teamType || !p.startDate || !p.description?.trim() || !p.significantAchievements?.trim()) {
          toast.error(t("comp_signup.toast.proj_req", "Project {{idx}}: All fields marked * are required", { idx: i + 1 }));
          return false;
        }
      }
      if (p.projectUrl?.trim()) {
        const url = p.projectUrl.toLowerCase();
        if (!url.includes("github.com") && !url.includes("docs.google.com")) {
          toast.error(t("comp_signup.toast.proj_link_invalid", "Project {{idx}}: Please provide a professional project link (GitHub or Google Docs)", { idx: i + 1 }));
          return false;
        }
      }
      if (p.doneIn === 'Organization' && !p.companyName?.trim()) { toast.error(t("comp_signup.toast.proj_company_req", "Project {{idx}}: Company Name is required", { idx: i + 1 })); return false; }
      if (p.doneIn === 'Institution' && !p.institution?.trim()) { toast.error(t("comp_signup.toast.proj_inst_req", "Project {{idx}}: Institution is required", { idx: i + 1 })); return false; }
    }
    return true;
  };

  const validateCertificates = () => {
    if (!certificates.isApplicable) return true;
    for (let i = 0; i < certificates.items.length; i++) {
      const c = certificates.items[i];
      if (!c.title?.trim() || !c.issuingOrg?.trim() || !c.verificationType) { toast.error(t("comp_signup.toast.cert_req", "Certificate {{idx}}: All fields marked * are required", { idx: i + 1 })); return false; }
      if (c.verificationType === "url" && !c.verificationUrl?.trim()) { toast.error(t("comp_signup.toast.cert_url_req", "Certificate {{idx}}: Verification URL is required when 'URL' is selected", { idx: i + 1 })); return false; }
    }
    return true;
  };

  // Save individual section to the backend (progressive saving)
  const saveSection = async (sectionName, sectionData) => {
    try {
      await apiCall('/users/register-section', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: personalDetails.email,
          section: sectionName,
          data: sectionData,
        }),
      });
      console.log(`[ComprehensiveSignup] Section '${sectionName}' saved successfully`);
      if (sectionName === 'personalDetails' && sectionData) {
        updateUser({
          fullName: sectionData.fullName,
          gender: sectionData.gender,
          mobileNumber: sectionData.mobileNumber,
          profileImage: sectionData.profilePhoto
        });
      }
    } catch (error) {
      console.error(`[ComprehensiveSignup] Failed to save section '${sectionName}':`, error);
      // Silent fail - don't block the user, data will be saved at final submit
    }
  };

  // Map step index to section name and data for progressive saving
  const getSectionDataForStep = (step) => {
    switch (step) {
      case 0:
        return { name: 'personalDetails', data: personalDetails };
      case 1:
        return { name: 'tenthDetails', data: tenthDetails };
      case 2:
        return { name: 'twelfthDetails', data: twelfthDetails };
      case 3:
        return { name: 'higherEducation', data: higherEducation };
      case 4:
        return { name: 'extracurricular', data: extracurricular.isApplicable ? extracurricular.items : [] };
      case 5:
        // Career goals alone - personal development goals handled together
        return { name: 'careerGoals', data: { ...careerGoals, personalDevelopmentGoals } };
      case 6:
        return { name: 'workExperience', data: workExperience.isApplicable ? workExperience.items : [] };
      case 7:
        return { name: 'projects', data: projects.isApplicable ? projects.items : [] };
      case 8:
        return { name: 'certificates', data: certificates.isApplicable ? certificates.items : [] };
      default:
        return null;
    }
  };

  const handleNextStep = async () => {
    let isValid = true;
    switch (currentStep) {
      case 0: isValid = validatePersonalDetails(); break;
      case 1: isValid = validateTenthDetails(); break;
      case 2: isValid = validateTwelfthDetails(); break;
      case 3: isValid = validateHigherEducation(); break;
      case 4: isValid = validateExtracurricular(); break;
      case 5: isValid = validateCareerGoals(); break;
      case 6: isValid = validateWorkExperience(); break;
      case 7: isValid = validateProjects(); break;
      case 8: isValid = validateCertificates(); break;
      default: isValid = true;
    }

    if (isValid) {
      // Save the current section before moving to the next
      const sectionInfo = getSectionDataForStep(currentStep);
      if (sectionInfo) {
        await saveSection(sectionInfo.name, sectionInfo.data);
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };
  const handlePrevStep = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); } };

  const addHigherEd = () => setHigherEducation([...higherEducation, { id: Date.now(), qualificationLevel: "", degreeFullName: "", degree: "", specialization: "", institutionName: "", cgpaPercentage: "", degreeStatus: "" }]);
  const removeHigherEd = (id) => { if (higherEducation.length > 1) setHigherEducation(higherEducation.filter(h => h.id !== id)); };
  const addExtracurricular = () => setExtracurricular(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] }));
  const removeExtracurricular = (id) => setExtracurricular(prev => ({ ...prev, items: prev.items.filter(e => e.id !== id) }));
  const addJobPref = () => { if (jobPreferences.items.length >= 4) { toast.error(t("comp_signup.toast.jobpref_limit", "Maximum 4 Job Preferences allowed")); return; } setJobPreferences(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), preferredRole: "", jobType: "", preferredLocation1: "", preferredLocation2: "", preferredLocation3: "", willingToRelocate: "", expectedSalary: "" }] })); };
  const removeJobPref = (id) => setJobPreferences(prev => ({ ...prev, items: prev.items.filter(j => j.id !== id) }));
  const addWorkExperience = () => setWorkExperience(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, keyResponsibilities: "", significantAccomplishments: "", documents: { offerLetter: null, appointmentLetter: null, appreciationLetter: null, experienceLetter: null }, selectedDocs: [], githubLink: "" }] }));
  const removeWorkExperience = (id) => setWorkExperience(prev => ({ ...prev, items: prev.items.filter(w => w.id !== id) }));
  const addProject = () => setProjects(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), title: "", doneIn: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", significantAchievements: "", projectUrl: "" }] }));
  const removeProject = (id) => setProjects(prev => ({ ...prev, items: prev.items.filter(p => p.id !== id) }));
  const addCertificate = () => setCertificates(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }] }));
  const removeCertificate = (id) => setCertificates(prev => ({ ...prev, items: prev.items.filter(c => c.id !== id) }));

  const handleSubmit = async () => {
    if (!validateCertificates()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", personalDetails.email);
      formData.append("fullName", personalDetails.fullName);
      formData.append("mobileNumber", personalDetails.mobileNumber);

      formData.append("personalDetails", JSON.stringify(personalDetails));
      formData.append("tenthDetails", JSON.stringify({ ...tenthDetails, marksheet: "" }));
      formData.append("twelfthDetails", JSON.stringify({ ...twelfthDetails, marksheet: "" }));
      const higherEducationData = higherEducation.map(h => ({ ...h, certificate: h.certificate?.publicId || h.certificate }));
      formData.append("higherEducation", JSON.stringify(higherEducationData));
      formData.append("extracurricular", JSON.stringify(extracurricular.isApplicable ? extracurricular.items : []));
      formData.append("jobPreferences", JSON.stringify(jobPreferences.items));

      // Inject Other sector if present
      const finalSectors = { ...sectorPreferences };
      if (finalSectors.preferredSectors.includes("Other")) {
        finalSectors.preferredSectors = finalSectors.preferredSectors.filter(s => s !== "Other");
        if (finalSectors.otherSector.trim()) finalSectors.preferredSectors.push(finalSectors.otherSector.trim());
      }
      formData.append("sectorPreferences", JSON.stringify(finalSectors));

      formData.append("careerGoals", JSON.stringify(careerGoals));
      formData.append("personalDevelopmentGoals", JSON.stringify(personalDevelopmentGoals));
      const workData = workExperience.isApplicable ? workExperience.items.map(w => {
        const cleanedDocs = {};
        w.selectedDocs.forEach(type => {
          cleanedDocs[type] = w.documents[type]?.publicId || w.documents[type];
        });
        return { ...w, documents: cleanedDocs };
      }) : [];
      formData.append("workExperience", JSON.stringify(workData));
      const projData = projects.isApplicable ? projects.items : [];
      formData.append("projects", JSON.stringify(projData));
      const certData = certificates.isApplicable ? certificates.items.map(c => ({ ...c, certificateFile: c.certificateFile?.publicId || c.certificateFile })) : [];
      formData.append("certificates", JSON.stringify(certData));
      formData.append("submissionDate", new Date().toISOString());

      await apiCall('/users/register-details', { method: "POST", body: formData });

      // Success State Trigger
      setIsLoading(false);
      setIsSuccess(true);

      // CRITICAL: Update session storage to prevent redirect loop
      const currentUserStr = sessionStorage.getItem("user");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        currentUser.hasRegistration = true;
        currentUser.registrationCompleted = true;
        currentUser.profileImage = personalDetails.profilePhoto || currentUser.profileImage;
        sessionStorage.setItem("user", JSON.stringify(currentUser));
        updateUser(currentUser);
      }

      setTimeout(() => {
        sessionStorage.removeItem("isFirstLogin");
        navigate("/dashboard/assessments/baseline", { replace: true });
      }, 3000); // Wait 3 seconds to show success

    } catch (error) { console.error("Submission error:", error); toast.error(error.message || t("comp_signup.toast.submit_failed", "Failed to submit")); setIsLoading(false); }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#001630] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 h-11 text-[13px] font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal transition-all duration-200 focus:bg-white dark:focus:bg-[#001c3d] focus:border-[#1a3884] dark:focus:border-blue-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1a3884]/10 dark:focus-visible:ring-blue-500/20 focus-visible:ring-offset-0";
  const selectClass = "w-full bg-slate-50 dark:bg-[#001630] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 h-11 text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 focus:bg-white dark:focus:bg-[#001c3d] focus:border-[#1a3884] dark:focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:ring-blue-500/20 appearance-none";
  const textareaClass = "w-full bg-slate-50 dark:bg-[#001630] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal transition-all duration-200 focus:bg-white dark:focus:bg-[#001c3d] focus:border-[#1a3884] dark:focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:ring-blue-500/20 resize-none";
  const yearOptions = Array.from({ length: 30 }, (_, i) => 2010 + i);
  const salaryRanges = ["0-3 LPA", "3-5 LPA", "5-8 LPA", "8-12 LPA", "12-18 LPA", "18-25 LPA", "25-35 LPA", "35-50 LPA", "50+ LPA", "Negotiable"];
  // Use Excel data sectors if available, otherwise fallback to defaults
  const sectorOptions = excelData.sectors.length > 0
    ? [...excelData.sectors, "Other"]
    : ["Information Technology & Digital Services", "Artificial Intelligence & Data Science", "Renewable Energy & Clean Technology", "Healthcare & Digital Health", "Pharmaceuticals & Biotechnology", "Financial Technology (FinTech)", "E-commerce & Digital Retail", "Professional & Consulting Services", "Manufacturing & Advanced Manufacturing", "Logistics, Supply Chain & E-Mobility", "Cybersecurity & Information Security", "EdTech & Online Learning", "Media, Gaming & Digital Content", "AgriTech & Food Technology", "Sustainability, ESG & Environmental Services", "Other"];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#002147] flex items-center justify-center flex-col">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="w-24 h-24 bg-[#1a3884] dark:bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/10">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-slate-900 dark:text-white mt-8">
          {t("comp_signup.success.title", "Profile 100% Completed!")}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-slate-500 dark:text-slate-400 mt-2">
          {t("comp_signup.success.desc", "Redirecting to assessment...")}
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#002147] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Premium Registration Navbar */}
      <header className="backdrop-blur-md bg-white/80 dark:bg-[#002147]/80 sticky top-0 z-[100] border-b border-slate-200/50 dark:border-white/10 transition-all duration-300">
        {/* Subtle Decorative Edge Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1a3884]/40 to-transparent dark:via-blue-500/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Left: Brand Typography Matching Navbar */}
          <div onClick={() => navigate("/")} className="flex flex-col items-start cursor-pointer group transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-1">
              <span className="text-3xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none transition-colors duration-300 group-hover:text-[#132c6b] dark:group-hover:text-blue-200">
                SMAART
              </span>
              <div className="w-2 h-2 rounded-full bg-[#C0C0C0] animate-pulse" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-0.5">
              {t("comp_signup.institute", "Institute")}
            </span>
          </div>

          {/* Center: Current Step Status with Modern Capsule Design (Hidden per user request) */}
          <div className="hidden"></div>

          {/* Right: Clean Spacer & Back to Home */}
          <div className="flex items-center gap-3">
            {/* Mobile indicator for step (Hidden per user request) */}
            <div className="hidden"></div>

            <button
              onClick={() => setShowDashboardWarning(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#1a3884]/30 dark:hover:border-blue-500/30 text-slate-600 dark:text-slate-300 hover:text-[#1a3884] dark:hover:text-white bg-white dark:bg-[#001c3d] hover:bg-blue-50/20 dark:hover:bg-blue-950/20 shadow-sm hover:shadow transition-all duration-200 text-xs font-bold uppercase tracking-wider group"
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors" />
              <span className="hidden sm:inline">{t("comp_signup.go_to_dashboard", "Go into Dashboard")}</span>
            </button>
          </div>

        </div>
      </header>

      <div className="max-w-4xl mx-auto py-4 px-4 relative z-10">

        {/* Attractive Title & Slogan */}
        <div className="text-center mb-8 mt-2">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-[#1a3884] dark:text-white mb-3 tracking-tight"
          >
            {t("comp_signup.title", "Complete Your Profile")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            {t("comp_signup.subtitle", "Build a comprehensive and professional profile to unlock the best career opportunities, personalized recommendations")}
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 px-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            <span>{t("comp_signup.step_progress", "Step {{current}} of {{total}}", { current: currentStep + 1, total: steps.length })}</span>
            <span>{t("comp_signup.pct_complete", "{{pct}}% Complete", { pct: Math.round(((currentStep + 1) / steps.length) * 100) })}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-[#1a3884] to-[#2d5dc7] dark:from-blue-600 dark:to-sky-500 rounded-full"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Form Container */}
          <div className="bg-white dark:bg-[#002147] p-5 md:p-8 shadow-xl dark:shadow-none border border-slate-100 dark:border-white/10 rounded-3xl relative">

            <AnimatePresence mode="wait">
              {/* Step 0: Personal Details */}
              {currentStep === 0 && (
                <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex flex-col justify-start mb-8">
                    <Label className="text-sm text-slate-500 font-medium mb-2">Profile Photo *</Label>
                    <FileUpload value={personalDetails.profilePhoto} onChange={(fid, fdata) => setPersonalDetails({ ...personalDetails, profilePhoto: fdata?.url || fid })} helperText="Upload a professional photo" accept=".jpg,.png,.jpeg" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Full Name</Label>
                      <div className="relative group">
                        <Input value={personalDetails.fullName} disabled onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })} className={inputClass + " opacity-60 cursor-not-allowed"} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Date of Birth *</Label>
                      <div className="relative">
                        <Input type="date" value={personalDetails.dob} disabled onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })} className={inputClass + " opacity-60 cursor-not-allowed"} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Gender *</Label>
                      <div className="relative">
                        <select value={personalDetails.gender} disabled onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })} className={selectClass + " opacity-60 cursor-not-allowed"}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Current Year of Study *</Label>
                      <select value={personalDetails.yearOfStudy} disabled className={selectClass + " opacity-60 cursor-not-allowed"}>
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Mobile Number</Label>
                      <div className="relative">
                        <Input value={personalDetails.mobileNumber} disabled onChange={(e) => setPersonalDetails({ ...personalDetails, mobileNumber: e.target.value })} className={inputClass + " opacity-60 cursor-not-allowed"} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Email</Label>
                      <Input value={personalDetails.email} disabled className={inputClass + " opacity-60 cursor-not-allowed"} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-slate-500 font-medium">Batch</Label>
                      <Input value={personalDetails.batch || ""} disabled className={inputClass + " opacity-60 cursor-not-allowed"} placeholder="e.g. 2023-2027" />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-[#1a3884] dark:text-blue-400">
                      <Home className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                      <h3 className="text-lg font-bold tracking-tight">{t("comp_signup.personal.address", "Address")}</h3>
                    </div>

                    {/* Row 1: COUNTRY and STATE/PROVINCE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">COUNTRY *</Label>
                        <select
                          value={personalDetails.address?.country || "India"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPersonalDetails(prev => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                country: val,
                                state: "",
                                district: "",
                                city: "",
                                pincode: ""
                              }
                            }));
                          }}
                          className={selectClass}
                        >
                          <option value="India">India</option>
                          <option value="Afghanistan">Afghanistan</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Japan">Japan</option>
                          <option value="China">China</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">STATE/PROVINCE *</Label>
                        {personalDetails.address?.country === "India" ? (
                          <select
                            value={personalDetails.address?.state || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPersonalDetails(prev => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  state: val,
                                  district: "",
                                  city: "",
                                  pincode: ""
                                }
                              }));
                            }}
                            className={selectClass}
                          >
                            <option value="">Select State</option>
                            {getStates().map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            placeholder="Enter state"
                            value={personalDetails.address?.state || ""}
                            onChange={(e) => setPersonalDetails(prev => ({
                              ...prev,
                              address: { ...prev.address, state: e.target.value }
                            }))}
                            className={inputClass}
                          />
                        )}
                      </div>
                    </div>

                    {/* Row 2: DISTRICT/REGION and CITY / TOWN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">DISTRICT/REGION *</Label>
                        {personalDetails.address?.country === "India" ? (
                          <select
                            value={personalDetails.address?.district || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPersonalDetails(prev => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  district: val,
                                  city: "",
                                  pincode: ""
                                }
                              }));
                            }}
                            className={selectClass}
                            disabled={!personalDetails.address?.state}
                          >
                            <option value="">Select District</option>
                            {getDistricts(personalDetails.address?.state).map(dist => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            placeholder="Enter district"
                            value={personalDetails.address?.district || ""}
                            onChange={(e) => setPersonalDetails(prev => ({
                              ...prev,
                              address: { ...prev.address, district: e.target.value }
                            }))}
                            className={inputClass}
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">CITY / TOWN *</Label>
                        {personalDetails.address?.country === "India" ? (
                          <select
                            value={personalDetails.address?.city || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const pin = getPincodeForCity(
                                personalDetails.address?.state,
                                personalDetails.address?.district,
                                val
                              );
                              setPersonalDetails(prev => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  city: val,
                                  pincode: pin || prev.address.pincode || ""
                                }
                              }));
                            }}
                            className={selectClass}
                            disabled={!personalDetails.address?.district}
                          >
                            <option value="">Select City</option>
                            {Array.from(new Set(getCities(personalDetails.address?.state, personalDetails.address?.district).map(c => c.city)))
                              .sort()
                              .map(cityName => (
                                <option key={cityName} value={cityName}>{cityName}</option>
                              ))}
                          </select>
                        ) : (
                          <Input
                            placeholder="Enter city"
                            value={personalDetails.address?.city || ""}
                            onChange={(e) => setPersonalDetails(prev => ({
                              ...prev,
                              address: { ...prev.address, city: e.target.value }
                            }))}
                            className={inputClass}
                          />
                        )}
                      </div>
                    </div>

                    {/* Row 3: ADDRESS LINE and PINCODE / ZIPCODE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">ADDRESS LINE *</Label>
                        <Input
                          placeholder="Enter floor, building, street address"
                          value={personalDetails.address?.street || ""}
                          onChange={(e) => setPersonalDetails(prev => ({
                            ...prev,
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">PINCODE / ZIPCODE *</Label>
                        <Input
                          placeholder="Enter postal code"
                          value={personalDetails.address?.pincode || ""}
                          onChange={(e) => setPersonalDetails(prev => ({
                            ...prev,
                            address: { ...prev.address, pincode: e.target.value }
                          }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: 10th Details */}
              {currentStep === 1 && (
                <motion.div key="tenth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t("comp_signup.tenth.title", "Secondary School Level (Grade 10)")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.tenth.school_name", "School Name *")}</Label><Input value={tenthDetails.schoolName} onChange={(e) => setTenthDetails({ ...tenthDetails, schoolName: e.target.value })} className={inputClass} /></div>
                    <div>
                      <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">Board *</Label>
                      <select value={tenthDetails.board || ""} onChange={(e) => setTenthDetails({ ...tenthDetails, board: e.target.value })} className={selectClass}>
                        <option value="">Select Board</option>
                        <option value="State Board">State Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="IB">IB</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.tenth.year_of_passing", "Year of Passing *")}</Label><select value={tenthDetails.yearOfPassing} onChange={(e) => setTenthDetails({ ...tenthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">{t("comp_signup.tenth.select_year", "Select Year")}</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                    <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.tenth.percentage", "Percentage / CGPA *")}</Label><Input type="number" min="0" max="100" step="0.01" value={tenthDetails.percentage} onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.split('.');
                      if (parts[0] && parts[0].length > 3) return;
                      if (parts[1] && parts[1].length > 2) return;
                      setTenthDetails({ ...tenthDetails, percentage: val });
                    }} className={inputClass} placeholder="e.g. 95.5 or 9.8" /></div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: 12th Details */}
              {currentStep === 2 && (
                <motion.div key="twelfth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t("comp_signup.twelfth.title", "Higher Secondary Level (Grade 12)")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.twelfth.school_name", "School/College Name *")}</Label><Input value={twelfthDetails.schoolName} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, schoolName: e.target.value })} className={inputClass} /></div>
                    <div>
                      <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">Board *</Label>
                      <select value={twelfthDetails.board || ""} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, board: e.target.value })} className={selectClass}>
                        <option value="">Select Board</option>
                        <option value="State Board">State Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ISC">ISC</option>
                        <option value="IB">IB</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.twelfth.group", "Group *")}</Label><select value={twelfthDetails.stream} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, stream: e.target.value, customStream: '' })} className={selectClass}><option value="">{t("comp_signup.twelfth.select", "Select")}</option><option value="Science">{t("comp_signup.twelfth.science", "Science")}</option><option value="Commerce">{t("comp_signup.twelfth.commerce", "Commerce")}</option><option value="Arts">{t("comp_signup.twelfth.arts", "Arts")}</option><option value="Others">{t("comp_signup.twelfth.others", "Others")}</option></select></div>
                    {twelfthDetails.stream === "Others" && (
                      <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.twelfth.specify_group", "Specify your group *")}</Label><Input value={twelfthDetails.customStream || ''} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, customStream: e.target.value })} className={inputClass} placeholder={t("comp_signup.twelfth.specify_group_placeholder", "Enter your group")} /></div>
                    )}
                    <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.twelfth.year_of_passing", "Year of Passing *")}</Label><select value={twelfthDetails.yearOfPassing} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">{t("comp_signup.twelfth.select_year", "Select Year")}</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                    <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.twelfth.percentage", "Percentage / CGPA *")}</Label><Input type="number" min="0" max="100" step="0.01" value={twelfthDetails.percentage} onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.split('.');
                      if (parts[0] && parts[0].length > 3) return;
                      if (parts[1] && parts[1].length > 2) return;
                      setTwelfthDetails({ ...twelfthDetails, percentage: val });
                    }} className={inputClass} placeholder="e.g. 95.5 or 9.8" /></div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Higher Ed - Refined */}
              {currentStep === 3 && (
                <motion.div key="higher" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.higher.title", "Higher Education")}</h2>
                    <Button onClick={addHigherEd} variant="outline" size="sm" className="gap-2 bg-[#1a3884] text-white border-white/20 hover:bg-[#112b6b] transition-all"><Plus size={16} /> {t("comp_signup.higher.add_degree", "Add Degree")}</Button>
                  </div>
                  {higherEducation.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group">
                      {higherEducation.length > 1 && <button onClick={() => removeHigherEd(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>}
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">{t("comp_signup.higher.degree_num", "Degree #{{num}}", { num: index + 1 })}</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Degree Level */}
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.degree_level", "Degree Level *")}</Label>
                          <select
                            value={item.qualificationLevel}
                            disabled={index === 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...higherEducation];
                              n[index].qualificationLevel = val;
                              n[index].degree = "";
                              n[index].degreeFullName = "";
                              n[index].specialization = "";
                              setHigherEducation(n);
                              if (val) fetchDegreeSubOptions('domains', { level: val }, index);
                            }}
                            className={selectClass + (index === 0 ? " opacity-60 cursor-not-allowed" : "")}
                          >
                            <option value="">{t("comp_signup.higher.select_level", "Select Level")}</option>
                            {degreeOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>

                        {/* Degree (Domain) */}
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.domain_field", "Domain Field *")}</Label>
                          <select
                            value={item.degree}
                            disabled={index === 0 || !item.qualificationLevel}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...higherEducation];
                              n[index].degree = val;
                              n[index].degreeFullName = "";
                              n[index].specialization = "";
                              setHigherEducation(n);
                              if (val) fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: val }, index);
                            }}
                            className={selectClass + (index === 0 || !item.qualificationLevel ? " opacity-60 cursor-not-allowed" : "")}
                          >
                            <option value="">{t("comp_signup.higher.select_degree", "Select Degree")}</option>
                            {(degreeOptions.domains[index] || []).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>

                        {/* Degree Full Name */}
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.degree_full_name", "Degree Full Name *")}</Label>
                          <select
                            value={item.degreeFullName}
                            disabled={index === 0 || !item.degree}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...higherEducation];
                              n[index].degreeFullName = val;
                              n[index].specialization = "";
                              setHigherEducation(n);
                              if (val) fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: val }, index);
                            }}
                            className={selectClass + (index === 0 || !item.degree ? " opacity-60 cursor-not-allowed" : "")}
                          >
                            <option value="">{t("comp_signup.higher.select_full_name", "Select Full Name")}</option>
                            {(degreeOptions.fullNames[index] || []).map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>

                        {/* Specialization */}
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.specialization", "Specialization *")}</Label>
                          <select
                            value={item.specialization}
                            disabled={index === 0 || !item.degreeFullName}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...higherEducation];
                              n[index].specialization = val;
                              setHigherEducation(n);
                            }}
                            className={selectClass + (index === 0 || !item.degreeFullName ? " opacity-60 cursor-not-allowed" : "")}
                          >
                            <option value="">{t("comp_signup.higher.select_specialization", "Select Specialization")}</option>
                            {(degreeOptions.specializations[index] || []).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.institution", "Institution *")}</Label>
                          <Input
                            value={item.institutionName}
                            disabled={index === 0}
                            onChange={(e) => { const n = [...higherEducation]; n[index].institutionName = e.target.value; setHigherEducation(n); }}
                            className={inputClass + (index === 0 ? " opacity-60 cursor-not-allowed" : "")}
                          />
                        </div>
                        {item.degreeStatus !== 'pursuing' && (
                          <div>
                            <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {t("comp_signup.higher.cgpa_pct_req", "CGPA / Percentage *")}
                            </Label>
                            <Input
                              type="number"
                              max="100"
                              value={item.cgpaPercentage || ""}
                              onChange={(e) => { const n = [...higherEducation]; n[index].cgpaPercentage = e.target.value; setHigherEducation(n); }}
                              className={inputClass}
                            />
                          </div>
                        )}
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.higher.status", "Status *")}</Label>
                          <select
                            value={item.degreeStatus}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...higherEducation];
                              n[index].degreeStatus = val;
                              if (val === 'pursuing') {
                                n[index].cgpaPercentage = '';
                              }
                              setHigherEducation(n);
                            }}
                            className={selectClass}
                          >
                            <option value="">{t("comp_signup.higher.select", "Select")}</option>
                            <option value="pursuing">{t("comp_signup.higher.pursuing", "Pursuing")}</option>
                            <option value="completed">{t("comp_signup.higher.completed", "Completed")}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 4: Activities */}
              {currentStep === 4 && (
                <motion.div key="activities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.activities.title", "Significant Accomplishments & Extracurricular Activities")}</h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!extracurricular.isApplicable} onChange={(e) => setExtracurricular({ ...extracurricular, isApplicable: !e.target.checked })} /><span className="text-sm dark:text-slate-300">{t("comp_signup.not_applicable", "Not Applicable")}</span></label>
                      {extracurricular.isApplicable && <Button onClick={addExtracurricular} variant="outline" size="sm" className="bg-[#1a3884] text-white border-white/20 hover:bg-[#112b6b] transition-all"><Plus size={16} /> {t("comp_signup.add", "Add")}</Button>}
                    </div>
                  </div>
                  {extracurricular.isApplicable ? extracurricular.items.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group">
                      {extracurricular.items.length > 1 && <button onClick={() => removeExtracurricular(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>}
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">{t("comp_signup.activities.activity_num", "Activity #{{num}}", { num: index + 1 })}</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.activities.type", "Type *")}</Label><select value={item.activityType} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].activityType = e.target.value; n.items[index].customActivityType = ''; setExtracurricular(n); }} className={selectClass}><option value="">{t("comp_signup.activities.select_type", "Select")}</option><option value="Sports">{t("comp_signup.activities.sports", "Sports")}</option><option value="Arts">{t("comp_signup.activities.arts", "Arts")}</option><option value="Volunteering">{t("comp_signup.activities.volunteering", "Volunteering")}</option><option value="Leadership roles">{t("comp_signup.activities.leadership", "Leadership roles")}</option><option value="Others">{t("comp_signup.activities.others", "Others")}</option></select></div>
                        {item.activityType === "Others" && (
                          <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.activities.specify_type", "Specify Activity Type *")}</Label><Input value={item.customActivityType || ''} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].customActivityType = e.target.value; setExtracurricular(n); }} className={inputClass} placeholder={t("comp_signup.activities.specify_type_placeholder", "Enter your activity type")} /></div>
                        )}
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.activities.level", "Level *")}</Label><select value={item.level} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].level = e.target.value; setExtracurricular(n); }} className={selectClass}><option value="">{t("comp_signup.activities.select_level", "Select")}</option><option value="School">{t("comp_signup.activities.level_school", "School")}</option><option value="College">{t("comp_signup.activities.level_college", "College")}</option><option value="District">{t("comp_signup.activities.level_district", "District")}</option><option value="State">{t("comp_signup.activities.level_state", "State")}</option><option value="National">{t("comp_signup.activities.level_national", "National")}</option><option value="International">{t("comp_signup.activities.level_international", "International")}</option></select></div>
                        <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.activities.achievements", "Achievements *")}</Label><Input value={item.achievements} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].achievements = e.target.value; setExtracurricular(n); }} className={inputClass} /></div>
                        <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.activities.description", "Description *")}</Label><textarea value={item.description} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].description = e.target.value; setExtracurricular(n); }} className={textareaClass} /></div>
                      </div>
                    </div>
                  )) : <div className="p-10 text-center text-slate-500 dark:text-slate-400">{t("comp_signup.activities.no_items", "No activities to add.")}</div>}
                </motion.div>
              )}

              {/* Step 5: Goals - Refined Placeholders */}
              {currentStep === 5 && (
                <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.goals.career_title", "Career Goals")}</h2>
                  <div>
                    <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.short_term", "Short-term Goal (0-1 year) *")}</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">{t("comp_signup.goals.short_term_desc", "Goals that can be achieved in the near future and focus on building basic skills, habits, or immediate improvements.")}</p>
                    <textarea value={careerGoals.shortTerm} onChange={(e) => setCareerGoals({ ...careerGoals, shortTerm: e.target.value })} className={textareaClass} placeholder={t("comp_signup.goals.short_term_placeholder", "e.g. Gain hands-on experience through projects or internships, and secure an entry-level role.")} />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.medium_term", "Medium-term Goal (1-5 years) *")}</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">{t("comp_signup.goals.medium_term_desc", "Goals planned for the next phase of growth that focus on strengthening abilities, gaining experience, and progressing toward bigger responsibilities.")}</p>
                    <textarea value={careerGoals.mediumTerm} onChange={(e) => setCareerGoals({ ...careerGoals, mediumTerm: e.target.value })} className={textareaClass} placeholder={t("comp_signup.goals.medium_term_placeholder", "e.g. Build advanced role-specific skills, take ownership of key work responsibilities, and progress to a higher position or better organization.")} />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.long_term", "Long-term Goal (5+ years) *")}</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">{t("comp_signup.goals.long_term_desc", "Goals set for the future that focus on overall direction, long-lasting impact, leadership, and sustained personal and professional growth.")}</p>
                    <textarea value={careerGoals.longTerm} onChange={(e) => setCareerGoals({ ...careerGoals, longTerm: e.target.value })} className={textareaClass} placeholder={t("comp_signup.goals.long_term_placeholder", "e.g. Move into leadership or specialist roles, continuously reskill with new technologies, and contribute to organizational and industry growth.")} />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.goals.personal_title", "Personal Development Goals")}</h2>
                    <div className="space-y-6 mt-6">
                      <div>
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.personal_short_term", "Short term (0–1 year) *")}</Label>
                        <textarea
                          value={personalDevelopmentGoals.shortTerm}
                          onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, shortTerm: e.target.value })}
                          className={textareaClass}
                          placeholder={t("comp_signup.goals.personal_short_term_placeholder", "e.g. Improve spoken and written communication, manage time effectively, build self-confidence, and establish consistent daily routines.")}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.personal_medium_term", "Medium term (1–5 years) *")}</Label>
                        <textarea
                          value={personalDevelopmentGoals.mediumTerm}
                          onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, mediumTerm: e.target.value })}
                          className={textareaClass}
                          placeholder={t("comp_signup.goals.personal_medium_term_placeholder", "e.g. Develop leadership presence, manage stress and feedback constructively, strengthen decision-making, and adapt confidently to change at work.")}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.goals.personal_long_term", "Long term (5+ years) *")}</Label>
                        <textarea
                          value={personalDevelopmentGoals.longTerm}
                          onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, longTerm: e.target.value })}
                          className={textareaClass}
                          placeholder={t("comp_signup.goals.personal_long_term_placeholder", "e.g. Demonstrate strong emotional intelligence, ethical judgment, resilience, and maintain a lifelong habit of continuous learning.")}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Work */}
              {currentStep === 6 && (
                <motion.div key="work" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.work.title", "Work Experience")}</h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!workExperience.isApplicable} onChange={(e) => setWorkExperience({ ...workExperience, isApplicable: !e.target.checked })} /><span className="text-sm dark:text-slate-300">{t("comp_signup.not_applicable", "Not Applicable")}</span></label>
                      {workExperience.isApplicable && <Button onClick={addWorkExperience} variant="outline" size="sm" className="bg-[#1a3884] text-white border-white/20 hover:bg-[#112b6b] transition-all"><Plus size={16} /> {t("comp_signup.add", "Add")}</Button>}
                    </div>
                  </div>
                  {workExperience.isApplicable ? workExperience.items.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group">
                      {workExperience.items.length > 1 && <button onClick={() => removeWorkExperience(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>}
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">{t("comp_signup.work.exp_num", "Exp #{{num}}", { num: index + 1 })}</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.experience_type", "Experience Type *")}</Label><select value={item.experienceType} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].experienceType = e.target.value; setWorkExperience(n); }} className={selectClass}><option value="">{t("comp_signup.work.select", "Select")}</option><option value="full-time">{t("comp_signup.work.full_time", "Full-Time")}</option><option value="part-time">{t("comp_signup.work.part_time", "Part-Time")}</option><option value="internship">{t("comp_signup.work.internship", "Internship")}</option><option value="freelance">{t("comp_signup.work.freelance", "Freelance")}</option><option value="volunteering">{t("comp_signup.work.volunteering", "Volunteering")}</option></select></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.organization", "Organization Name *")}</Label><Input value={item.organizationName} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].organizationName = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder={t("comp_signup.work.organization_placeholder", "e.g. Google, Startup Inc")} /></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.job_title", "Designation / Role *")}</Label><Input value={item.jobTitle} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].jobTitle = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder={t("comp_signup.work.job_title_placeholder", "e.g. Software Engineer")} /></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.industry", "Industry / Sector *")}</Label><Input value={item.industry} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].industry = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder={t("comp_signup.work.industry_placeholder", "e.g. IT, Healthcare")} /></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.start_date", "Start Date *")}</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].startDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>
                        {!item.currentlyWorking && <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.end_date", "End Date *")}</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].endDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>}
                        <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id={`current-${item.id}`} checked={item.currentlyWorking} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].currentlyWorking = e.target.checked; if (e.target.checked) { n.items[index].endDate = ""; n.items[index].keyResponsibilities = ""; n.items[index].significantAccomplishments = ""; } setWorkExperience(n); }} className="w-4 h-4 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884]" /> <Label htmlFor={`current-${item.id}`} className="cursor-pointer dark:text-slate-300">{t("comp_signup.work.currently_working", "Currently working")}</Label></div>
                        {!item.currentlyWorking && (
                          <>
                            <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.responsibilities", "Key Responsibilities *")}</Label><textarea value={item.keyResponsibilities} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].keyResponsibilities = e.target.value; setWorkExperience(n); }} className={textareaClass} placeholder={t("comp_signup.work.responsibilities_placeholder", "Outline your primary duties and the scope of your work in this role.")} /></div>
                            <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.work.accomplishments", "Significant Accomplishments *")}</Label><textarea value={item.significantAccomplishments} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].significantAccomplishments = e.target.value; setWorkExperience(n); }} className={textareaClass} placeholder={t("comp_signup.work.accomplishments_placeholder", "Highlight major achievements, contributions, or impacts you made during your tenure.")} /></div>
                          </>
                        )}
                        
                      </div>
                    </div>
                  )) : <div className="p-10 text-center text-slate-500 dark:text-slate-400">{t("comp_signup.work.no_items", "No experience to add.")}</div>}
                </motion.div>
              )}

              {/* Step 7: Projects */}
              {currentStep === 7 && (
                <motion.div key="proj" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.projects.title", "Projects")}</h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!projects.isApplicable} onChange={(e) => setProjects({ ...projects, isApplicable: !e.target.checked })} /><span className="text-sm dark:text-slate-300">{t("comp_signup.not_applicable", "Not Applicable")}</span></label>
                      {projects.isApplicable && <Button onClick={addProject} variant="outline" size="sm" className="bg-[#1a3884] text-white border-white/20 hover:bg-[#112b6b] transition-all"><Plus size={16} /> {t("comp_signup.add", "Add")}</Button>}
                    </div>
                  </div>
                  {projects.isApplicable ? projects.items.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group">
                      {projects.items.length > 1 && <button onClick={() => removeProject(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>}
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">{t("comp_signup.projects.project_num", "Project #{{num}}", { num: index + 1 })}</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.project_title", "Project Title *")}</Label><Input value={item.title} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].title = e.target.value; setProjects(n); }} className={inputClass} placeholder={t("comp_signup.projects.project_title_placeholder", "e.g. E-commerce Website")} /></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.done_in", "Project developed in *")}</Label><select value={item.doneIn} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].doneIn = e.target.value; setProjects(n); }} className={selectClass}><option value="">{t("comp_signup.projects.select", "Select")}</option><option value="Institution">{t("comp_signup.projects.institution_opt", "Institution")}</option><option value="Organization">{t("comp_signup.projects.organization_opt", "Organization")}</option><option value="Others">{t("comp_signup.projects.others_opt", "Others")}</option></select></div>
                        {item.doneIn === 'Institution' && <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.institution_name", "College / University Name *")}</Label><Input value={item.institution} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].institution = e.target.value; setProjects(n); }} className={inputClass} placeholder={t("comp_signup.projects.institution_name_placeholder", "e.g. Stanford University")} /></div>}
                        {item.doneIn === 'Organization' && <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.company_name", "Company / Organization Name *")}</Label><Input value={item.companyName} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].companyName = e.target.value; setProjects(n); }} className={inputClass} placeholder={t("comp_signup.projects.company_name_placeholder", "e.g. Acme Corp")} /></div>}
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.team_type", "Team Type *")}</Label><select value={item.teamType} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].teamType = e.target.value; setProjects(n); }} className={selectClass}><option value="">{t("comp_signup.projects.select", "Select")}</option><option value="Individual">{t("comp_signup.projects.individual", "Individual")}</option><option value="Team">{t("comp_signup.projects.team", "Team")}</option></select></div>
                        <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.start_date", "Start Date *")}</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].startDate = e.target.value; setProjects(n); }} className={inputClass} /></div>
                        {!item.currentlyWorking && <div><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.end_date", "End Date *")}</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].endDate = e.target.value; setProjects(n); }} className={inputClass} /></div>}
                        <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id={`proj-current-${item.id}`} checked={item.currentlyWorking} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].currentlyWorking = e.target.checked; if (e.target.checked) { n.items[index].endDate = ""; n.items[index].description = ""; n.items[index].significantAchievements = ""; n.items[index].projectUrl = ""; } setProjects(n); }} className="w-4 h-4 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884]" /> <Label htmlFor={`proj-current-${item.id}`} className="cursor-pointer dark:text-slate-300">{t("comp_signup.projects.currently_working", "Currently working on project")}</Label></div>
                        {!item.currentlyWorking && (
                          <>
                            <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.description", "Project Description *")}</Label><textarea value={item.description} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].description = e.target.value; setProjects(n); }} className={textareaClass} placeholder={t("comp_signup.projects.description_placeholder", "Describe your role and the technologies used...")} /></div>
                            <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.achievements", "Significant Achievements *")}</Label><textarea value={item.significantAchievements} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].significantAchievements = e.target.value; setProjects(n); }} className={textareaClass} placeholder={t("comp_signup.projects.achievements_placeholder", "Highlight key results, performance wins, or unique contributions...")} /></div>
                            <div className="md:col-span-2"><Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.projects.project_url", "Professional Project Link (GitHub / Google Docs Link Only)")}</Label><Input value={item.projectUrl} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].projectUrl = e.target.value; setProjects(n); }} className={inputClass} placeholder={t("comp_signup.projects.project_url_placeholder", "e.g. github.com/username/repo or docs.google.com/...")} /></div>
                          </>
                        )}
                      </div>
                    </div>
                  )) : <div className="p-10 text-center text-slate-500 dark:text-slate-400">{t("comp_signup.projects.no_items", "No projects to add.")}</div>}
                </motion.div>
              )}
              {/* Step 8: Certificates */}
              {currentStep === 8 && (
                <motion.div key="certs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("comp_signup.certificates.title", "Certificates")}</h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!certificates.isApplicable}
                          onChange={(e) => setCertificates({ ...certificates, isApplicable: !e.target.checked })}
                        />
                        <span className="text-sm dark:text-slate-300">{t("comp_signup.not_applicable", "Not Applicable")}</span>
                      </label>
                      {certificates.isApplicable && (
                        <Button onClick={addCertificate} variant="outline" size="sm" className="bg-[#1a3884] text-white border-white/20 hover:bg-[#112b6b] transition-all">
                          <Plus size={16} /> {t("comp_signup.add", "Add")}
                        </Button>
                      )}
                    </div>
                  </div>
                  {certificates.isApplicable ? certificates.items.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group">
                      {certificates.items.length > 1 && (
                        <button onClick={() => removeCertificate(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2">
                          <Trash2 size={18} />
                        </button>
                      )}
                      <h3 className="font-semibold mb-4 text-[#1a3884] dark:text-blue-400">{t("comp_signup.certificates.cert_num", "Certificate #{{num}}", { num: index + 1 })}</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.certificates.cert_title", "Certificate Name / Title *")}</Label>
                          <Input value={item.title} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].title = e.target.value; setCertificates(n); }} className={inputClass} placeholder={t("comp_signup.certificates.cert_title_placeholder", "e.g. AWS Certified Solutions Architect")} />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.certificates.issuing_org", "Issuing Organization *")}</Label>
                          <Input value={item.issuingOrg} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].issuingOrg = e.target.value; setCertificates(n); }} className={inputClass} placeholder={t("comp_signup.certificates.issuing_org_placeholder", "e.g. Amazon Web Services, Coursera")} />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.certificates.completion_year", "Year of Completion *")}</Label>
                          <select value={item.yearOfCompletion} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].yearOfCompletion = e.target.value; setCertificates(n); }} className={selectClass}>
                            <option value="">{t("comp_signup.certificates.select_year", "Select Year")}</option>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.certificates.verification_mode", "Verification Mode *")}</Label>
                          <select value={item.verificationType} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationType = e.target.value; setCertificates(n); }} className={selectClass}>
                            <option value="">{t("comp_signup.certificates.select", "Select")}</option>
                            <option value="url">{t("comp_signup.certificates.verify_url", "Link / URL")}</option>
                            <option value="qr">{t("comp_signup.certificates.verify_qr", "QR Code")}</option>
                            <option value="none">{t("comp_signup.certificates.verify_none", "None")}</option>
                          </select>
                        </div>

                        {item.verificationType === "url" && (
                          <div className="md:col-span-1">
                            <Label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("comp_signup.certificates.verification_link", "Verification Link / URL *")}</Label>
                            <Input value={item.verificationUrl} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationUrl = e.target.value; setCertificates(n); }} className={inputClass} placeholder="https://..." />
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-500 dark:text-slate-400">{t("comp_signup.certificates.no_items", "No certificates to add.")}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Redesigned Footer */}
            <div className="w-full flex justify-between items-center mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-4">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    {t("comp_signup.previous", "Previous")}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-8 py-3 rounded-xl bg-[#1a3884] text-white text-sm font-bold hover:bg-[#132c6b] transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("comp_signup.next", "Next")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="relative px-8 py-3 rounded-xl text-white text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#112b6b]/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("comp_signup.complete_registration", "Complete Registration")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Go to Dashboard Warning Modal */}
      <AnimatePresence>
        {showDashboardWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDashboardWarning(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#001c3d] rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 flex items-center justify-center mb-5 shrink-0">
                <AlertCircle className="w-8 h-8 text-amber-600 animate-pulse" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                {t("comp_signup.warning.title", "Incomplete Profile Registration")}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 px-2">
                {t("comp_signup.warning.desc", "You have not completed your profile registration. We highly recommend completing it now to unlock your personalized courses, assessments, and full dashboard features.")}
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <Button
                  onClick={() => setShowDashboardWarning(false)}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                >
                  {t("comp_signup.warning.continue", "Continue Registration")}
                </Button>

                <button
                  onClick={() => {
                    setShowDashboardWarning(false);
                    sessionStorage.setItem('bypassRegistrationGuard', 'true');
                    navigate("/dashboard", { replace: true });
                  }}
                  className="w-full h-11 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-all shadow-sm flex items-center justify-center"
                >
                  {t("comp_signup.warning.skip", "Go to Dashboard Anyway")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComprehensiveSignup;


