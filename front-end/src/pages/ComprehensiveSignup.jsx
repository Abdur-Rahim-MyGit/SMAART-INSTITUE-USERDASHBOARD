import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ChevronDown, User, GraduationCap, FileText, Award, CreditCard, Palette, Lock, Check, Briefcase, Target, FolderOpen, Plus, Trash2, ChevronRight, Quote, QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiCall } from "@/services/api";
import FileUpload from "@/components/FileUpload";
import logoWhite from "@/assets/white.png";
import logoGold from "@/assets/blue.png"; // Using blue.png as proxy for logo if needed, but the ref has white/blue theme

const ComprehensiveSignup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      setPersonalDetails(prev => ({ ...prev, email, fullName: fullName || prev.fullName, mobileNumber: userData?.mobileNumber || "", institution: "" }));
      setPreFilledFields(prev => ({ ...prev, email: true, fullName: !!fullName, mobileNumber: !!userData?.mobileNumber }));
    }

    if (selectedInstitution) {
      try {
        const institutionObj = JSON.parse(selectedInstitution);
        setPersonalDetails(prev => ({ ...prev, institution: institutionObj.name || selectedInstitution }));
        setPreFilledFields(prev => ({ ...prev, institution: true }));
      } catch { setPersonalDetails(prev => ({ ...prev, institution: selectedInstitution })); setPreFilledFields(prev => ({ ...prev, institution: true })); }
    }
    if (userData?.department) { setPersonalDetails(prev => ({ ...prev, department: userData.department })); setPreFilledFields(prev => ({ ...prev, department: true })); }
  }, [navigate]);

  const [excelData, setExcelData] = useState({ sectors: [], roles: [] });
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

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

  const [personalDetails, setPersonalDetails] = useState({ fullName: "", nickname: "", dob: "", gender: "", mobileNumber: "", email: "", institution: "", department: "", yearOfStudy: "", yearOfPassing: "", educationLevel: "", profilePhoto: null });
  const [tenthDetails, setTenthDetails] = useState({ schoolName: "", yearOfPassing: "", percentage: "", marksheet: null });
  const [twelfthDetails, setTwelfthDetails] = useState({ schoolName: "", stream: "", yearOfPassing: "", percentage: "", marksheet: null });
  const [higherEducation, setHigherEducation] = useState([{ id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
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
    { title: "Profile", icon: <User className="w-4 h-4" /> },
    { title: "Personal", icon: <User className="w-4 h-4" /> },
    { title: "10th", icon: <GraduationCap className="w-4 h-4" /> },
    { title: "12th", icon: <GraduationCap className="w-4 h-4" /> },
    { title: "Higher Ed", icon: <Award className="w-4 h-4" /> },
    { title: "Activities", icon: <Palette className="w-4 h-4" /> },
    { title: "Job Pref", icon: <Briefcase className="w-4 h-4" /> },
    { title: "Sectors", icon: <Target className="w-4 h-4" /> },
    { title: "Goals", icon: <Target className="w-4 h-4" /> },
    { title: "Experience", icon: <Briefcase className="w-4 h-4" /> },
    { title: "Projects", icon: <FolderOpen className="w-4 h-4" /> },
    { title: "Certificates", icon: <FileText className="w-4 h-4" /> },
  ];

  const validatePersonalDetails = () => {
    if (!personalDetails.profilePhoto) { toast.error("Profile Photo is required"); return false; }
    if (!personalDetails.educationLevel) { toast.error("Education Level is required"); return false; }
    if (personalDetails.educationLevel === "Other" && !personalDetails.customDomain?.trim()) { toast.error("Please specify your domain"); return false; }
    if (!personalDetails.nickname?.trim()) { toast.error("Nick name is required"); return false; }
    if (!personalDetails.dob) { toast.error("Date of Birth is required"); return false; }
    const dobDate = new Date(personalDetails.dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (age < 16 || (age === 16 && m < 0)) { toast.error("You must be at least 16 years old."); return false; }
    if (dobDate > today) { toast.error("Date of Birth cannot be in the future"); return false; }
    if (!personalDetails.gender) { toast.error("Gender is required"); return false; }
    if (!personalDetails.yearOfStudy) { toast.error("Year of Study is required"); return false; }
    const currentYear = new Date().getFullYear();
    if (parseInt(personalDetails.yearOfStudy) > currentYear) { toast.error("Year of Study cannot be in the future"); return false; }
    if (!personalDetails.yearOfPassing) { toast.error("Year of Passing is required"); return false; }
    if (parseInt(personalDetails.yearOfPassing) <= parseInt(personalDetails.yearOfStudy)) { toast.error("Year of Passing must be greater than Year of Study"); return false; }
    if (!personalDetails.department?.trim()) { toast.error("Department is required"); return false; }
    return true;
  };

  const validateTenthDetails = () => {
    if (!tenthDetails.schoolName?.trim()) { toast.error("10th School Name is required"); return false; }
    if (!tenthDetails.yearOfPassing) { toast.error("10th Year of Passing is required"); return false; }
    if (!tenthDetails.percentage) { toast.error("10th Percentage is required"); return false; }
    if (parseFloat(tenthDetails.percentage) > 100 || parseFloat(tenthDetails.percentage) < 0) { toast.error("Percentage must be between 0 and 100"); return false; }
    if (!tenthDetails.marksheet) { toast.error("10th Marksheet is required"); return false; }
    return true;
  };

  const validateTwelfthDetails = () => {
    if (!twelfthDetails.schoolName?.trim()) { toast.error("12th School Name is required"); return false; }
    if (!twelfthDetails.stream) { toast.error("12th Stream is required"); return false; }
    if (!twelfthDetails.yearOfPassing) { toast.error("12th Year of Passing is required"); return false; }
    if (!twelfthDetails.percentage) { toast.error("12th Percentage is required"); return false; }
    if (parseFloat(twelfthDetails.percentage) > 100 || parseFloat(twelfthDetails.percentage) < 0) { toast.error("Percentage must be between 0 and 100"); return false; }
    if (!twelfthDetails.marksheet) { toast.error("12th Marksheet is required"); return false; }
    return true;
  };

  const validateHigherEducation = () => {
    for (let i = 0; i < higherEducation.length; i++) {
      const h = higherEducation[i];
      if (!h.qualificationLevel) { toast.error(`Higher Ed ${i + 1}: Qualification Level is required`); return false; }
      if (!h.degree?.trim()) { toast.error(`Higher Ed ${i + 1}: Degree is required`); return false; }
      if (!h.institutionName?.trim()) { toast.error(`Higher Ed ${i + 1}: Institution Name is required`); return false; }
      if (!h.university?.trim()) { toast.error(`Higher Ed ${i + 1}: University is required`); return false; }
      if (!h.yearOfPassing) { toast.error(`Higher Ed ${i + 1}: Year of Passing is required`); return false; }
      if (!h.cgpaPercentage) { toast.error(`Higher Ed ${i + 1}: CGPA/Percentage is required`); return false; }
      // PERCENTAGE CHECK (Assume percentage if > 10 or generic check)
      const val = parseFloat(h.cgpaPercentage);
      if (isNaN(val) || val < 0 || val > 100) { toast.error(`Higher Ed ${i + 1}: CGPA/Percentage must be between 0 and 100`); return false; }
      if (!h.degreeStatus) { toast.error(`Higher Ed ${i + 1}: Degree Status is required`); return false; }
      if (!h.certificate) { toast.error(`Higher Ed ${i + 1}: Certificate upload is required`); return false; }
    }
    return true;
  };

  const validateExtracurricular = () => {
    if (!extracurricular.isApplicable) return true;
    for (let i = 0; i < extracurricular.items.length; i++) {
      const e = extracurricular.items[i];
      if (!e.activityType) { toast.error(`Activity ${i + 1}: Activity Type is required`); return false; }
      if (e.activityType === "Others" && !e.customActivityType?.trim()) { toast.error(`Activity ${i + 1}: Please specify the activity type`); return false; }
      if (!e.level) { toast.error(`Activity ${i + 1}: Level is required`); return false; }
      if (!e.achievements?.trim()) { toast.error(`Activity ${i + 1}: Achievements are required`); return false; }
      if (!e.description?.trim()) { toast.error(`Activity ${i + 1}: Description is required`); return false; }
    }
    return true;
  };

  const validateJobPreferences = () => {
    for (let i = 0; i < jobPreferences.items.length; i++) {
      const j = jobPreferences.items[i];
      if (!j.preferredRole?.trim()) { toast.error(`Job Pref ${i + 1}: Preferred Job Role is required`); return false; }
      if (!j.jobType) { toast.error(`Job Pref ${i + 1}: Job Type is required`); return false; }
      if (!j.preferredLocation1?.trim()) { toast.error(`Job Pref ${i + 1}: Location Preference 1 is required`); return false; }
      if (!j.willingToRelocate) { toast.error(`Job Pref ${i + 1}: Willing to Relocate is required`); return false; }
      if (!j.expectedSalary) { toast.error(`Job Pref ${i + 1}: Expected Salary is required`); return false; }
    }
    return true;
  };

  const validateSectorPreferences = () => {
    if (sectorPreferences.preferredSectors.length === 0) { toast.error("Please select at least one preferred sector"); return false; }
    if (sectorPreferences.preferredSectors.includes("Other") && !sectorPreferences.otherSector.trim()) { toast.error("Please specify the 'Other' sector"); return false; }
    return true;
  };

  const validateCareerGoals = () => {
    if (!careerGoals.shortTerm?.trim() || !careerGoals.mediumTerm?.trim() || !careerGoals.longTerm?.trim()) { toast.error("All career goals are required"); return false; }
    if (!personalDevelopmentGoals.shortTerm?.trim() || !personalDevelopmentGoals.mediumTerm?.trim() || !personalDevelopmentGoals.longTerm?.trim()) { toast.error("All personal development goals are required"); return false; }
    return true;
  };

  const validateWorkExperience = () => {
    if (!workExperience.isApplicable) return true;
    for (let i = 0; i < workExperience.items.length; i++) {
      const w = workExperience.items[i];
      if (!w.experienceType || !w.organizationName?.trim() || !w.jobTitle?.trim() || !w.industry?.trim() || !w.startDate || !w.keyResponsibilities?.trim() || !w.significantAccomplishments?.trim()) { toast.error(`Experience ${i + 1}: All fields marked * are required`); return false; }
      if (w.selectedDocs.length === 0) { toast.error(`Experience ${i + 1}: Please select and upload at least one document`); return false; }
      for (const docType of w.selectedDocs) {
        if (!w.documents[docType]) {
          const label = docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          toast.error(`Experience ${i + 1}: Please upload your ${label}`);
          return false;
        }
      }
      if (new Date(w.startDate) > new Date()) { toast.error(`Experience ${i + 1}: Start Date cannot be in the future`); return false; }
      if (!w.currentlyWorking && !w.endDate) { toast.error(`Experience ${i + 1}: End Date is required`); return false; }
    }
    return true;
  };

  const validateProjects = () => {
    if (!projects.isApplicable) return true;
    for (let i = 0; i < projects.items.length; i++) {
      const p = projects.items[i];
      if (!p.title?.trim() || !p.doneIn || !p.teamType || !p.startDate || !p.description?.trim() || !p.significantAchievements?.trim()) { toast.error(`Project ${i + 1}: All fields marked * are required`); return false; }
      if (p.projectUrl?.trim()) {
        const url = p.projectUrl.toLowerCase();
        if (!url.includes("github.com") && !url.includes("docs.google.com")) {
          toast.error(`Project ${i + 1}: Please provide a professional project link (GitHub or Google Docs)`);
          return false;
        }
      }
      if (p.doneIn === 'Organization' && !p.companyName?.trim()) { toast.error(`Project ${i + 1}: Company Name is required`); return false; }
      if (p.doneIn === 'Institution' && !p.institution?.trim()) { toast.error(`Project ${i + 1}: Institution is required`); return false; }
    }
    return true;
  };

  const validateCertificates = () => {
    if (!certificates.isApplicable) return true;
    for (let i = 0; i < certificates.items.length; i++) {
      const c = certificates.items[i];
      if (!c.title?.trim() || !c.issuingOrg?.trim() || !c.certificateFile || !c.verificationType) { toast.error(`Certificate ${i + 1}: All fields marked * are required`); return false; }
      if (c.verificationType === "url" && !c.verificationUrl?.trim()) { toast.error(`Certificate ${i + 1}: Verification URL is required when 'URL' is selected`); return false; }
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
    } catch (error) {
      console.error(`[ComprehensiveSignup] Failed to save section '${sectionName}':`, error);
      // Silent fail - don't block the user, data will be saved at final submit
    }
  };

  // Map step index to section name and data for progressive saving
  const getSectionDataForStep = (step) => {
    switch (step) {
      case 0:
        return { name: 'profilePhoto', data: { profilePhoto: personalDetails.profilePhoto } };
      case 1:
        return { name: 'personalDetails', data: personalDetails };
      case 2:
        return { name: 'tenthDetails', data: tenthDetails };
      case 3:
        return { name: 'twelfthDetails', data: twelfthDetails };
      case 4:
        return { name: 'higherEducation', data: higherEducation };
      case 5:
        return { name: 'extracurricular', data: extracurricular.isApplicable ? extracurricular.items : [] };
      case 6:
        return { name: 'jobPreferences', data: jobPreferences.items };
      case 7:
        return { name: 'sectorPreferences', data: sectorPreferences };
      case 8:
        // Career goals alone - personal development goals handled together
        return { name: 'careerGoals', data: { ...careerGoals, personalDevelopmentGoals } };
      case 9:
        return { name: 'workExperience', data: workExperience.isApplicable ? workExperience.items : [] };
      case 10:
        return { name: 'projects', data: projects.isApplicable ? projects.items : [] };
      case 11:
        return { name: 'certificates', data: certificates.isApplicable ? certificates.items : [] };
      default:
        return null;
    }
  };

  const handleNextStep = async () => {
    let isValid = true;
    switch (currentStep) {
      case 0: isValid = !!personalDetails.profilePhoto; if (!isValid) toast.error("Please upload a profile photo"); break;
      case 1: isValid = validatePersonalDetails(); break;
      case 2: isValid = validateTenthDetails(); break;
      case 3: isValid = validateTwelfthDetails(); break;
      case 4: isValid = validateHigherEducation(); break;
      case 5: isValid = validateExtracurricular(); break;
      case 6: isValid = validateJobPreferences(); break;
      case 7: isValid = validateSectorPreferences(); break;
      case 8: isValid = validateCareerGoals(); break;
      case 9: isValid = validateWorkExperience(); break;
      case 10: isValid = validateProjects(); break;
      case 11: isValid = validateCertificates(); break;
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

  const addHigherEd = () => setHigherEducation([...higherEducation, { id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
  const removeHigherEd = (id) => { if (higherEducation.length > 1) setHigherEducation(higherEducation.filter(h => h.id !== id)); };
  const addExtracurricular = () => setExtracurricular(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] }));
  const removeExtracurricular = (id) => setExtracurricular(prev => ({ ...prev, items: prev.items.filter(e => e.id !== id) }));
  const addJobPref = () => { if (jobPreferences.items.length >= 4) { toast.error("Maximum 4 Job Preferences allowed"); return; } setJobPreferences(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), preferredRole: "", jobType: "", preferredLocation1: "", preferredLocation2: "", preferredLocation3: "", willingToRelocate: "", expectedSalary: "" }] })); };
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
      formData.append("tenthDetails", JSON.stringify({ ...tenthDetails, marksheet: tenthDetails.marksheet?.publicId || tenthDetails.marksheet }));
      formData.append("twelfthDetails", JSON.stringify({ ...twelfthDetails, marksheet: twelfthDetails.marksheet?.publicId || twelfthDetails.marksheet }));
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
        sessionStorage.setItem("user", JSON.stringify(currentUser));
      }

      setTimeout(() => {
        sessionStorage.removeItem("isFirstLogin");
        navigate("/dashboard/assessments/baseline", { replace: true });
      }, 3000); // Wait 3 seconds to show success

    } catch (error) { console.error("Submission error:", error); toast.error(error.message || "Failed to submit"); setIsLoading(false); }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 placeholder:text-gray-400";
  const selectClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 appearance-none";
  const textareaClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 resize-none placeholder:text-gray-400";
  const yearOptions = Array.from({ length: 30 }, (_, i) => 2010 + i);
  const salaryRanges = ["0-3 LPA", "3-5 LPA", "5-8 LPA", "8-12 LPA", "12-18 LPA", "18-25 LPA", "25-35 LPA", "35-50 LPA", "50+ LPA", "Negotiable"];
  // Use Excel data sectors if available, otherwise fallback to defaults
  const sectorOptions = excelData.sectors.length > 0
    ? [...excelData.sectors, "Other"]
    : ["Information Technology & Digital Services", "Artificial Intelligence & Data Science", "Renewable Energy & Clean Technology", "Healthcare & Digital Health", "Pharmaceuticals & Biotechnology", "Financial Technology (FinTech)", "E-commerce & Digital Retail", "Professional & Consulting Services", "Manufacturing & Advanced Manufacturing", "Logistics, Supply Chain & E-Mobility", "Cybersecurity & Information Security", "EdTech & Online Learning", "Media, Gaming & Digital Content", "AgriTech & Food Technology", "Sustainability, ESG & Environmental Services", "Other"];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#001229] flex items-center justify-center flex-col">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="w-24 h-24 bg-[#1a3884] rounded-full flex items-center justify-center shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-slate-900 dark:text-white mt-8">
          Profile 100% Completed!
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-slate-600 dark:text-slate-400 mt-2">
          Redirecting to assessment...
        </motion.p>
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-[#C0C0C0]/30">
      {/* Deep Blue Header */}
      <header className="bg-[#002147] text-white py-2 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-[100] shadow-md border-b-2 border-[#C0C0C0] shadow-[0_0_15px_rgba(192,192,192,0.3)]">
        <div className="flex items-center gap-3">
          <img src={logoWhite} alt="SMAART INSTITUTE" className="h-8 w-auto" />
          <div className="h-8 w-[1px] bg-white/20 hidden md:block mx-2" />
          <h1 className="text-xl md:text-2xl font-sans text-white/90">
            {steps[currentStep].title}
            <div className="h-[2px] w-1/2 bg-[#C0C0C0] mt-1 mx-auto md:mx-0" />
          </h1>
        </div>
        
        <div className="text-center md:text-right hidden sm:block">
          <p className="text-sm font-sans italic text-white/80 tracking-wide">
            "Empower Your Future, Enroll Today!"
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-4 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="relative"
        >
          {/* Torn Paper Container */}
          <div className="bg-white p-4 md:p-6 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.15),0_0_20px_rgba(192,192,192,0.4)] border-2 border-[#C0C0C0] rounded-none relative">
            
            <AnimatePresence mode="wait">
            {/* Step 0: Profile Photo */}
            {currentStep === 0 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Photo</h2>
                <div className="flex justify-center">
                  <FileUpload value={personalDetails.profilePhoto} onChange={(fid, fdata) => setPersonalDetails({ ...personalDetails, profilePhoto: fdata?.url || fid })} helperText="Upload a professional photo (Max 5MB)" />
                </div>
              </motion.div>
            )}

            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Full Name</Label>
                    <div className="relative group">
                      <Input value={personalDetails.fullName} disabled={preFilledFields.fullName} onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Nick Name *</Label>
                    <div className="relative">
                      <Input value={personalDetails.nickname} onChange={(e) => setPersonalDetails({ ...personalDetails, nickname: e.target.value })} className={inputClass} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">+</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Date of Birth *</Label>
                    <div className="relative">
                      <Input type="date" value={personalDetails.dob} onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })} className={inputClass} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Gender *</Label>
                    <div className="relative">
                      <select value={personalDetails.gender} onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })} className={selectClass}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-blue-500">♂</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-500">♀</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Current Year of Study *</Label>
                    <select value={personalDetails.yearOfStudy} onChange={(e) => setPersonalDetails({ ...personalDetails, yearOfStudy: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Year of Passing (Expected) *</Label>
                    <select value={personalDetails.yearOfPassing} onChange={(e) => setPersonalDetails({ ...personalDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Mobile Number</Label>
                    <div className="relative">
                      <Input value={personalDetails.mobileNumber} disabled={preFilledFields.mobileNumber} onChange={(e) => setPersonalDetails({ ...personalDetails, mobileNumber: e.target.value })} className={inputClass} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Email</Label>
                    <Input value={personalDetails.email} disabled className={inputClass + " opacity-60 cursor-not-allowed"} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Institution</Label>
                    <div className="relative">
                      <Input value={personalDetails.institution} disabled={preFilledFields.institution} onChange={(e) => setPersonalDetails({ ...personalDetails, institution: e.target.value })} className={inputClass} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                         <GraduationCap className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Choose ur domain *</Label>
                    <div className="relative">
                      <select value={personalDetails.educationLevel} onChange={(e) => setPersonalDetails({ ...personalDetails, educationLevel: e.target.value, customDomain: '' })} className={selectClass}>
                        <option value="">Select Domain</option>
                        {sectorOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500 font-medium">Department *</Label>
                    <div className="relative">
                      <Input value={personalDetails.department} disabled={preFilledFields.department} onChange={(e) => setPersonalDetails({ ...personalDetails, department: e.target.value })} className={inputClass} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                         <Briefcase className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: 10th Details */}
            {currentStep === 2 && (
              <motion.div key="tenth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Secondary School Level (Grade 10)</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><Label>School Name *</Label><Input value={tenthDetails.schoolName} onChange={(e) => setTenthDetails({ ...tenthDetails, schoolName: e.target.value })} className={inputClass} /></div>
                  <div><Label>Year of Passing *</Label><select value={tenthDetails.yearOfPassing} onChange={(e) => setTenthDetails({ ...tenthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div><Label>Percentage / CGPA *</Label><Input type="number" max="100" value={tenthDetails.percentage} onChange={(e) => setTenthDetails({ ...tenthDetails, percentage: e.target.value })} className={inputClass} /></div>
                  <div className="md:col-span-2"><Label>Upload Marksheet *</Label><FileUpload value={tenthDetails.marksheet} onChange={(fid, fdata) => setTenthDetails({ ...tenthDetails, marksheet: fdata?.url || fid })} helperText="Scan of original marksheet" /></div>
                </div>
              </motion.div>
            )}

            {/* Step 3: 12th Details */}
            {currentStep === 3 && (
              <motion.div key="twelfth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Higher Secondary Level (Grade 12)</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><Label>School/College Name *</Label><Input value={twelfthDetails.schoolName} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, schoolName: e.target.value })} className={inputClass} /></div>
                  <div><Label>Group *</Label><select value={twelfthDetails.stream} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, stream: e.target.value, customStream: '' })} className={selectClass}><option value="">Select</option><option value="Science">Science</option><option value="Commerce">Commerce</option><option value="Arts">Arts</option><option value="Others">Others</option></select></div>
                  {twelfthDetails.stream === "Others" && (
                    <div><Label>Specify your group *</Label><Input value={twelfthDetails.customStream || ''} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, customStream: e.target.value })} className={inputClass} placeholder="Enter your group" /></div>
                  )}
                  <div><Label>Year of Passing *</Label><select value={twelfthDetails.yearOfPassing} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div><Label>Percentage / CGPA *</Label><Input type="number" max="100" value={twelfthDetails.percentage} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, percentage: e.target.value })} className={inputClass} /></div>
                  <div className="md:col-span-2"><Label>Upload Marksheet *</Label><FileUpload value={twelfthDetails.marksheet} onChange={(fid, fdata) => setTwelfthDetails({ ...twelfthDetails, marksheet: fdata?.url || fid })} helperText="Scan of original marksheet" /></div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Higher Ed - Refined */}
            {currentStep === 4 && (
              <motion.div key="higher" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Higher Education</h2>
                  <Button onClick={addHigherEd} variant="outline" size="sm" className="gap-2 bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Degree</Button>
                </div>
                {higherEducation.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {higherEducation.length > 1 && <button onClick={() => removeHigherEd(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4">Degree #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Qualification Level *</Label><select value={item.qualificationLevel} onChange={(e) => { const n = [...higherEducation]; n[index].qualificationLevel = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select</option><option value="UG Diploma">Undergraduate Diploma (UG Diploma)</option><option value="PG Diploma">Postgraduate Diploma (PG Diploma)</option><option value="UG">Undergraduate Degree (UG)</option><option value="PG">Postgraduate Degree (PG)</option><option value="MPhil">MPhil (Master of Philosophy)</option><option value="PhD">Doctoral Degree (PhD / Doctorate)</option><option value="Post-Doctoral">Post-Doctoral Level</option></select></div>
                      <div><Label>Academic Qualification Name *</Label><Input value={item.degree} onChange={(e) => { const n = [...higherEducation]; n[index].degree = e.target.value; setHigherEducation(n); }} className={inputClass} placeholder="e.g. B.E, B.Sc, BBA,  BA, BCA, B.Com" /></div>
                      <div><Label>Specialization</Label><Input value={item.specialization} onChange={(e) => { const n = [...higherEducation]; n[index].specialization = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                      <div><Label>Institution *</Label><Input value={item.institutionName} onChange={(e) => { const n = [...higherEducation]; n[index].institutionName = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                      <div><Label>University *</Label><Input value={item.university} onChange={(e) => { const n = [...higherEducation]; n[index].university = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                      <div><Label>Year of Passing (Expected) *</Label><select value={item.yearOfPassing} onChange={(e) => { const n = [...higherEducation]; n[index].yearOfPassing = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                      <div><Label>CGPA / Percentage*</Label><Input type="number" max="100" value={item.cgpaPercentage} onChange={(e) => { const n = [...higherEducation]; n[index].cgpaPercentage = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                      <div><Label>Status *</Label><select value={item.degreeStatus} onChange={(e) => { const n = [...higherEducation]; n[index].degreeStatus = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select</option><option value="pursuing">Pursuing</option><option value="completed">Completed</option></select></div>
                      <div className="md:col-span-2"><Label>Upload Certificate *</Label><FileUpload value={item.certificate} onChange={(fid, fdata) => { const n = [...higherEducation]; n[index].certificate = fdata?.url || fid; setHigherEducation(n); }} /></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 5: Activities */}
            {currentStep === 5 && (
              <motion.div key="activities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Significant Accomplishments & Extracurricular Activities</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!extracurricular.isApplicable} onChange={(e) => setExtracurricular({ ...extracurricular, isApplicable: !e.target.checked })} /><span className="text-sm">Not Applicable</span></label>
                    {extracurricular.isApplicable && <Button onClick={addExtracurricular} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add</Button>}
                  </div>
                </div>
                {extracurricular.isApplicable ? extracurricular.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {extracurricular.items.length > 1 && <button onClick={() => removeExtracurricular(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4">Activity #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Type *</Label><select value={item.activityType} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].activityType = e.target.value; n.items[index].customActivityType = ''; setExtracurricular(n); }} className={selectClass}><option value="">Select</option><option value="Sports">Sports</option><option value="Arts">Arts</option><option value="Volunteering">Volunteering</option><option value="Leadership roles">Leadership roles</option><option value="Others">Others</option></select></div>
                      {item.activityType === "Others" && (
                        <div><Label>Specify Activity Type *</Label><Input value={item.customActivityType || ''} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].customActivityType = e.target.value; setExtracurricular(n); }} className={inputClass} placeholder="Enter your activity type" /></div>
                      )}
                      <div><Label>Level *</Label><select value={item.level} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].level = e.target.value; setExtracurricular(n); }} className={selectClass}><option value="">Select</option><option value="School">School</option><option value="College">College</option><option value="District">District</option><option value="State">State</option><option value="National">National</option><option value="International">International</option></select></div>
                      <div className="md:col-span-2"><Label>Achievements *</Label><Input value={item.achievements} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].achievements = e.target.value; setExtracurricular(n); }} className={inputClass} /></div>
                      <div className="md:col-span-2"><Label>Description *</Label><textarea value={item.description} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].description = e.target.value; setExtracurricular(n); }} className={textareaClass} /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400">No activities to add.</div>}
              </motion.div>
            )}

            {/* Step 6: Job Prefs - Refined Salary */}
            {currentStep === 6 && (
              <motion.div key="jobpref" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Job Preferences</h2>
                  <Button onClick={addJobPref} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add</Button>
                </div>
                {jobPreferences.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {jobPreferences.items.length > 1 && <button onClick={() => removeJobPref(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4">Pref #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative">
                        <Label>Job Role / Position*</Label>
                        <Input
                          value={item.preferredRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            const n = { ...jobPreferences, items: [...jobPreferences.items] };
                            n.items[index].preferredRole = val;
                            setJobPreferences(n);

                            // Update suggestions
                            if (val.length > 1) {
                              const matches = excelData.roles
                                .filter(r => r.toLowerCase().includes(val.toLowerCase()))
                                .slice(0, 10);
                              setRoleSuggestions(matches);
                              setActiveSearchIndex(index);
                            } else {
                              setRoleSuggestions([]);
                            }
                          }}
                          onFocus={() => setActiveSearchIndex(index)}
                          className={inputClass}
                          placeholder="Search or enter your preferred role"
                        />
                        {activeSearchIndex === index && roleSuggestions.length > 0 && (
                          <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-none shadow-2xl max-h-60 overflow-y-auto no-scrollbar ring-1 ring-black/5">
                            <div className="p-2 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-3">
                              SMAART Role Suggestions
                            </div>
                            {roleSuggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 transition-colors"
                                onClick={() => {
                                  const n = { ...jobPreferences, items: [...jobPreferences.items] };
                                  n.items[index].preferredRole = suggestion;
                                  setJobPreferences(n);
                                  setRoleSuggestions([]);
                                }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div><Label>Type *</Label><select value={item.jobType} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].jobType = e.target.value; setJobPreferences(n); }} className={selectClass}>
                        <option value="">Select</option>
                        <option value="full-time">Full-Time</option>
                        <option value="part-time">Part-Time</option>
                        <option value="internship-full">Internship (Full-Time)</option>
                        <option value="internship-part">Internship (Part-Time)</option>
                        <option value="freelance">Freelance / Gig Work</option>
                        <option value="remote">Fully Remote / Distributed</option>
                      </select></div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Location Preference 1*</Label><Input value={item.preferredLocation1} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].preferredLocation1 = e.target.value; setJobPreferences(n); }} className={inputClass} placeholder="e.g. Remote" /></div>
                        <div><Label>Location Preference 2</Label><Input value={item.preferredLocation2} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].preferredLocation2 = e.target.value; setJobPreferences(n); }} className={inputClass} placeholder="e.g. Bangalore" /></div>
                        <div><Label>Location Preference 3</Label><Input value={item.preferredLocation3} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].preferredLocation3 = e.target.value; setJobPreferences(n); }} className={inputClass} placeholder="e.g. Mumbai" /></div>
                      </div>
                      <div><Label>Relocate *</Label><select value={item.willingToRelocate} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].willingToRelocate = e.target.value; setJobPreferences(n); }} className={selectClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                      <div>
                        <Label>Expected Salary *</Label>
                        <select value={item.expectedSalary} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].expectedSalary = e.target.value; setJobPreferences(n); }} className={selectClass}>
                          <option value="">Select Range</option>
                          {salaryRanges.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 7: Sectors - Refined 7+ options */}
            {currentStep === 7 && (
              <motion.div key="sectors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Sector Preferences</h2>
                <div>
                  <Label>Preferred Sectors *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sectorOptions.map(s => (
                      <button key={s}
                        onClick={() => {
                          const isSelected = sectorPreferences.preferredSectors.includes(s);
                          if (isSelected) {
                            const updated = sectorPreferences.preferredSectors.filter(x => x !== s);
                            setSectorPreferences({ ...sectorPreferences, preferredSectors: updated });
                          } else {
                            if (sectorPreferences.preferredSectors.length >= 3) {
                              toast.error("You can select maximum 3 choices");
                              return;
                            }
                            setSectorPreferences({ ...sectorPreferences, preferredSectors: [...sectorPreferences.preferredSectors, s] });
                          }
                        }}
                        className={`px-4 py-2 rounded-full border transition-colors ${sectorPreferences.preferredSectors.includes(s) ? "bg-[#1a3884] text-white border-[#1a3884]" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#1a3884]"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {sectorPreferences.preferredSectors.includes("Other") && (
                    <div className="mt-4">
                      <Label>Specify Other Sector *</Label>
                      <Input value={sectorPreferences.otherSector} onChange={(e) => setSectorPreferences({ ...sectorPreferences, otherSector: e.target.value })} className={inputClass} placeholder="e.g. Aerospace, Robotics" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 8: Goals - Refined Placeholders */}
            {currentStep === 8 && (
              <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Career Goals</h2>
                <div>
                  <Label>Short-term Goal (0-1 year) *</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">Goals that can be achieved in the near future and focus on building basic skills, habits, or immediate improvements.</p>
                  <textarea value={careerGoals.shortTerm} onChange={(e) => setCareerGoals({ ...careerGoals, shortTerm: e.target.value })} className={textareaClass} placeholder="e.g. Gain hands-on experience through projects or internships, and secure an entry-level role." />
                </div>
                <div>
                  <Label>Medium-term Goal (1-5 years) *</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">Goals planned for the next phase of growth that focus on strengthening abilities, gaining experience, and progressing toward bigger responsibilities.</p>
                  <textarea value={careerGoals.mediumTerm} onChange={(e) => setCareerGoals({ ...careerGoals, mediumTerm: e.target.value })} className={textareaClass} placeholder="e.g. Build advanced role-specific skills, take ownership of key work responsibilities, and progress to a higher position or better organization." />
                </div>
                <div>
                  <Label>Long-term Goal (5+ years) *</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">Goals set for the future that focus on overall direction, long-lasting impact, leadership, and sustained personal and professional growth.</p>
                  <textarea value={careerGoals.longTerm} onChange={(e) => setCareerGoals({ ...careerGoals, longTerm: e.target.value })} className={textareaClass} placeholder="e.g. Move into leadership or specialist roles, continuously reskill with new technologies, and contribute to organizational and industry growth." />
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                  <h2 className="text-2xl font-bold">Personal Development Goals</h2>
                  <div className="space-y-6 mt-6">
                    <div>
                      <Label>Short term (0–1 year) *</Label>
                      <textarea
                        value={personalDevelopmentGoals.shortTerm}
                        onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, shortTerm: e.target.value })}
                        className={textareaClass}
                        placeholder="e.g. Improve spoken and written communication, manage time effectively, build self-confidence, and establish consistent daily routines."
                      />
                    </div>
                    <div>
                      <Label>Medium term (1–5 years) *</Label>
                      <textarea
                        value={personalDevelopmentGoals.mediumTerm}
                        onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, mediumTerm: e.target.value })}
                        className={textareaClass}
                        placeholder="e.g. Develop leadership presence, manage stress and feedback constructively, strengthen decision-making, and adapt confidently to change at work."
                      />
                    </div>
                    <div>
                      <Label>Long term (5+ years) *</Label>
                      <textarea
                        value={personalDevelopmentGoals.longTerm}
                        onChange={(e) => setPersonalDevelopmentGoals({ ...personalDevelopmentGoals, longTerm: e.target.value })}
                        className={textareaClass}
                        placeholder="e.g. Demonstrate strong emotional intelligence, ethical judgment, resilience, and maintain a lifelong habit of continuous learning."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 9: Work */}
            {currentStep === 9 && (
              <motion.div key="work" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Work Experience</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!workExperience.isApplicable} onChange={(e) => setWorkExperience({ ...workExperience, isApplicable: !e.target.checked })} /><span className="text-sm">Not Applicable</span></label>
                    {workExperience.isApplicable && <Button onClick={addWorkExperience} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add</Button>}
                  </div>
                </div>
                {workExperience.isApplicable ? workExperience.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {workExperience.items.length > 1 && <button onClick={() => removeWorkExperience(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4">Exp #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Experience Type *</Label><select value={item.experienceType} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].experienceType = e.target.value; setWorkExperience(n); }} className={selectClass}><option value="">Select</option><option value="full-time">Full-Time</option><option value="part-time">Part-Time</option><option value="internship">Internship</option><option value="freelance">Freelance</option><option value="volunteering">Volunteering</option></select></div>
                      <div><Label>Organization Name *</Label><Input value={item.organizationName} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].organizationName = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder="e.g. Google, Startup Inc" /></div>
                      <div><Label>Designation / Role *</Label><Input value={item.jobTitle} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].jobTitle = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder="e.g. Software Engineer" /></div>
                      <div><Label>Industry / Sector *</Label><Input value={item.industry} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].industry = e.target.value; setWorkExperience(n); }} className={inputClass} placeholder="e.g. IT, Healthcare" /></div>
                      <div><Label>Start Date *</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].startDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>
                      {!item.currentlyWorking && <div><Label>End Date *</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].endDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>}
                      <div className="md:col-span-2"><input type="checkbox" checked={item.currentlyWorking} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].currentlyWorking = e.target.checked; if (e.target.checked) n.items[index].endDate = ""; setWorkExperience(n); }} /> Currently working</div>
                      <div className="md:col-span-2"><Label>Key Responsibilities *</Label><textarea value={item.keyResponsibilities} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].keyResponsibilities = e.target.value; setWorkExperience(n); }} className={textareaClass} placeholder="Outline your primary duties and the scope of your work in this role." /></div>
                      <div className="md:col-span-2"><Label>Significant Accomplishments *</Label><textarea value={item.significantAccomplishments} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].significantAccomplishments = e.target.value; setWorkExperience(n); }} className={textareaClass} placeholder="Highlight major achievements, contributions, or impacts you made during your tenure." /></div>
                      <div className="md:col-span-2 space-y-4">
                        <Label>Document Type (Select all that apply) *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-none border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                          {[
                            { id: "offerLetter", label: "Offer Letter" },
                            { id: "appointmentLetter", label: "Appointment Letter" },
                            { id: "appreciationLetter", label: "Appreciation Letter" },
                            { id: "experienceLetter", label: "Experience Letter" }
                          ].map(doc => (
                            <label key={doc.id} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={item.selectedDocs.includes(doc.id)}
                                onChange={(e) => {
                                  const n = { ...workExperience, items: [...workExperience.items] };
                                  if (e.target.checked) {
                                    n.items[index].selectedDocs = [...n.items[index].selectedDocs, doc.id];
                                  } else {
                                    n.items[index].selectedDocs = n.items[index].selectedDocs.filter(t => t !== doc.id);
                                    n.items[index].documents[doc.id] = null;
                                  }
                                  setWorkExperience(n);
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884]"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#1a3884] transition-colors">{doc.label}</span>
                            </label>
                          ))}
                        </div>

                        {item.selectedDocs.length > 0 && (
                          <div className="grid md:grid-cols-2 gap-6 pt-2">
                            {item.selectedDocs.map(docId => (
                              <div key={docId} className="space-y-2 p-4 rounded-none border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                                <Label className="text-[#1a3884] dark:text-blue-400 font-semibold">
                                  Upload {docId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} *
                                </Label>
                                <FileUpload
                                  value={item.documents[docId]}
                                  onChange={(fid, fdata) => {
                                    const n = { ...workExperience, items: [...workExperience.items] };
                                    n.items[index].documents[docId] = fdata?.url || fid;
                                    setWorkExperience(n);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400">No experience to add.</div>}
              </motion.div>
            )}

            {/* Step 10: Projects */}
            {currentStep === 10 && (
              <motion.div key="proj" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Projects</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!projects.isApplicable} onChange={(e) => setProjects({ ...projects, isApplicable: !e.target.checked })} /><span className="text-sm">Not Applicable</span></label>
                    {projects.isApplicable && <Button onClick={addProject} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add</Button>}
                  </div>
                </div>
                {projects.isApplicable ? projects.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {projects.items.length > 1 && <button onClick={() => removeProject(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4">Project #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Project Title *</Label><Input value={item.title} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].title = e.target.value; setProjects(n); }} className={inputClass} placeholder="e.g. E-commerce Website" /></div>
                      <div><Label>Project developed in *</Label><select value={item.doneIn} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].doneIn = e.target.value; setProjects(n); }} className={selectClass}><option value="">Select</option><option value="Institution">Institution</option><option value="Organization">Organization</option><option value="Others">Others</option></select></div>
                      {item.doneIn === 'Institution' && <div><Label>College / University Name *</Label><Input value={item.institution} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].institution = e.target.value; setProjects(n); }} className={inputClass} placeholder="e.g. Stanford University" /></div>}
                      {item.doneIn === 'Organization' && <div><Label>Company / Organization Name *</Label><Input value={item.companyName} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].companyName = e.target.value; setProjects(n); }} className={inputClass} placeholder="e.g. Acme Corp" /></div>}
                      <div><Label>Team Type *</Label><select value={item.teamType} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].teamType = e.target.value; setProjects(n); }} className={selectClass}><option value="">Select</option><option value="Individual">Individual</option><option value="Team">Team</option></select></div>
                      <div><Label>Start Date *</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].startDate = e.target.value; setProjects(n); }} className={inputClass} /></div>
                      {!item.currentlyWorking && <div><Label>End Date *</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].endDate = e.target.value; setProjects(n); }} className={inputClass} /></div>}
                      <div className="md:col-span-2"><Label>Project Description *</Label><textarea value={item.description} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].description = e.target.value; setProjects(n); }} className={textareaClass} placeholder="Describe your role and the technologies used..." /></div>
                      <div className="md:col-span-2"><Label>Significant Achievements *</Label><textarea value={item.significantAchievements} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].significantAchievements = e.target.value; setProjects(n); }} className={textareaClass} placeholder="Highlight key results, performance wins, or unique contributions..." /></div>
                      <div className="md:col-span-2"><Label>Professional Project Link (GitHub / Google Docs Link Only)</Label><Input value={item.projectUrl} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].projectUrl = e.target.value; setProjects(n); }} className={inputClass} placeholder="e.g. github.com/username/repo or docs.google.com/..." /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400">No projects to add.</div>}
              </motion.div>
            )}
            {/* Step 11: Certificates */}
            {currentStep === 11 && (
              <motion.div key="certs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Certificates</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!certificates.isApplicable} 
                        onChange={(e) => setCertificates({ ...certificates, isApplicable: !e.target.checked })} 
                      />
                      <span className="text-sm">Not Applicable</span>
                    </label>
                    {certificates.isApplicable && (
                      <Button onClick={addCertificate} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10">
                        <Plus size={16} /> Add
                      </Button>
                    )}
                  </div>
                </div>
                {certificates.isApplicable ? certificates.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {certificates.items.length > 1 && (
                      <button onClick={() => removeCertificate(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2">
                        <Trash2 size={18} />
                      </button>
                    )}
                    <h3 className="font-semibold mb-4 text-[#002147]">Cert #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 p-4 rounded-none border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                          <div>
                            <Label>Certificate Name / Title *</Label>
                            <Input value={item.title} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].title = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. AWS Certified Solutions Architect" />
                          </div>
                          <div>
                            <Label>Upload Certificate *</Label>
                            <FileUpload value={item.certificateFile} onChange={(fid, fdata) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].certificateFile = fdata?.url || fid; setCertificates(n); }} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Issuing Organization *</Label>
                        <Input value={item.issuingOrg} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].issuingOrg = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. Amazon Web Services, Coursera" />
                      </div>
                      <div>
                        <Label>Year of Completion *</Label>
                        <select value={item.yearOfCompletion} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].yearOfCompletion = e.target.value; setCertificates(n); }} className={selectClass}>
                          <option value="">Select Year</option>
                          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Verification Mode *</Label>
                        <select value={item.verificationType} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationType = e.target.value; setCertificates(n); }} className={selectClass}>
                          <option value="">Select</option>
                          <option value="url">Link / URL</option>
                          <option value="qr">QR Code</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      {item.verificationType === "url" && (
                        <div className="md:col-span-1">
                          <Label>Verification Link / URL *</Label>
                          <Input value={item.verificationUrl} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationUrl = e.target.value; setCertificates(n); }} className={inputClass} placeholder="https://..." />
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400">No certificates to add.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Redesigned Footer - Inside the torn paper card */}
              <div className="w-full flex justify-end items-center gap-8">
                {currentStep > 0 && (
                  <button 
                    onClick={handlePrevStep}
                    className="text-lg font-sans text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button 
                    onClick={handleNextStep}
                    className="text-lg font-sans text-[#1a3884] font-bold hover:opacity-80 transition-opacity"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="text-lg font-sans text-[#C0C0C0] font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
};

export default ComprehensiveSignup;


