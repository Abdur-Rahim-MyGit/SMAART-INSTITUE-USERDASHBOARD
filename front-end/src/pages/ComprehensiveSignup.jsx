import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, GraduationCap, Award, Palette, Briefcase, Target, FolderOpen, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/FileUpload";
import { API_BASE_URL } from "@/services/api";

const ComprehensiveSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, selectedInstitution, isEditMode } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [preFilledFields, setPreFilledFields] = useState({});

  useEffect(() => {
    // Pre-fill logic based on navigation state
    if (selectedInstitution) {
      try {
        const institutionObj = typeof selectedInstitution === 'string' ? JSON.parse(selectedInstitution) : selectedInstitution;
        setPersonalDetails(prev => ({ ...prev, institution: institutionObj.name || selectedInstitution }));
        setPreFilledFields(prev => ({ ...prev, institution: true }));
      } catch {
        setPersonalDetails(prev => ({ ...prev, institution: selectedInstitution }));
        setPreFilledFields(prev => ({ ...prev, institution: true }));
      }
    }
    if (userData?.department) {
      setPersonalDetails(prev => ({ ...prev, department: userData.department }));
      setPreFilledFields(prev => ({ ...prev, department: true }));
    }
  }, [navigate, selectedInstitution, userData]);

  const [personalDetails, setPersonalDetails] = useState({
    fullName: "", nickname: "", dob: "", gender: "", mobileNumber: "", alternateMobile: "", email: "",
    institution: "", department: "", studentId: "", yearOfStudy: "", yearOfPassing: "", educationLevel: "",
    profilePhoto: null,
    address: { city: "", state: "", country: "" }
  }); const [tenthDetails, setTenthDetails] = useState({ schoolName: "", yearOfPassing: "", percentage: "", marksheet: null });
  const [twelfthDetails, setTwelfthDetails] = useState({ schoolName: "", stream: "", yearOfPassing: "", percentage: "", marksheet: null });
  const [higherEducation, setHigherEducation] = useState([{ id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
  const [extracurricular, setExtracurricular] = useState({ isApplicable: true, items: [{ id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] });
  const [jobPreferences, setJobPreferences] = useState({ items: [{ id: Date.now(), preferredRole: "", jobType: "", preferredLocation: "", willingToRelocate: "", expectedSalary: "" }] });
  const [sectorPreferences, setSectorPreferences] = useState({ preferredSectors: [], secondarySectors: [], otherSector: "" }); // added otherSector
  const [careerGoals, setCareerGoals] = useState({ shortTerm: "", mediumTerm: "", longTerm: "" });
  const [workExperience, setWorkExperience] = useState({ isApplicable: true, items: [{ id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, description: "", certificate: null, githubLink: "" }] });
  const [projects, setProjects] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", qualificationLevel: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", projectUrl: "" }] }); const [certificates, setCertificates] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }] }); // added verificationUrl

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

  const validateJobPreferences = () => {
    for (let i = 0; i < jobPreferences.items.length; i++) {
      const j = jobPreferences.items[i];
      if (!j.preferredRole?.trim()) { toast.error(`Job Pref ${i + 1}: Preferred Job Role is required`); return false; }
      if (!j.jobType) { toast.error(`Job Pref ${i + 1}: Job Type is required`); return false; }
      if (!j.preferredLocation?.trim()) { toast.error(`Job Pref ${i + 1}: Preferred Location is required`); return false; }
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

  const validateCareerGoals = () => { if (!careerGoals.shortTerm?.trim() || !careerGoals.mediumTerm?.trim() || !careerGoals.longTerm?.trim()) { toast.error("All career goals are required"); return false; } return true; };

  const validateWorkExperience = () => {
    if (!workExperience.isApplicable) return true;
    for (let i = 0; i < workExperience.items.length; i++) {
      const w = workExperience.items[i];
      if (!w.experienceType || !w.organizationName?.trim() || !w.jobTitle?.trim() || !w.industry?.trim() || !w.startDate || !w.description?.trim() || !w.certificate) { toast.error(`Experience ${i + 1}: All fields marked * are required`); return false; }
      if (new Date(w.startDate) > new Date()) { toast.error(`Experience ${i + 1}: Start Date cannot be in the future`); return false; }
      if (!w.currentlyWorking && !w.endDate) { toast.error(`Experience ${i + 1}: End Date is required`); return false; }
    }
    return true;
  };

  const validateProjects = () => {
    if (!projects.isApplicable) return true;
    for (let i = 0; i < projects.items.length; i++) {
      const p = projects.items[i];
      if (!p.title?.trim() || !p.qualificationLevel || !p.teamType || !p.startDate || !p.description?.trim()) { toast.error(`Project ${i + 1}: All fields marked * are required`); return false; }
      if (p.qualificationLevel === 'Company' && !p.companyName?.trim()) { toast.error(`Project ${i + 1}: Company Name is required`); return false; }
      if (p.qualificationLevel === 'College' && !p.institution?.trim()) { toast.error(`Project ${i + 1}: Institution is required`); return false; }
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

  const handleNextStep = () => {
    let isValid = true;
    switch (currentStep) {
      case 0: isValid = !!personalDetails.profilePhoto; if (!isValid) toast.error("Please upload a profile photo"); break;
      case 1: isValid = validatePersonalDetails(); break;
      case 2: isValid = validateTenthDetails(); break;
      case 3: isValid = validateTwelfthDetails(); break;
      case 4: isValid = validateHigherEducation(); break;
      case 5: isValid = true; break;
      case 6: isValid = validateJobPreferences(); break;
      case 7: isValid = validateSectorPreferences(); break;
      case 8: isValid = validateCareerGoals(); break;
      case 9: isValid = validateWorkExperience(); break;
      case 10: isValid = validateProjects(); break;
      case 11: isValid = validateCertificates(); break;
      default: isValid = true;
    }
    if (isValid && currentStep < steps.length - 1) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); }
  };
  const handlePrevStep = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); } };

  const addHigherEd = () => setHigherEducation([...higherEducation, { id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
  const removeHigherEd = (id) => { if (higherEducation.length > 1) setHigherEducation(higherEducation.filter(h => h.id !== id)); };
  const addExtracurricular = () => setExtracurricular(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] }));
  const removeExtracurricular = (id) => setExtracurricular(prev => ({ ...prev, items: prev.items.filter(e => e.id !== id) }));
  const addJobPref = () => { if (jobPreferences.items.length >= 4) { toast.error("Maximum 4 Job Preferences allowed"); return; } setJobPreferences(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), preferredRole: "", jobType: "", preferredLocation: "", willingToRelocate: "", expectedSalary: "" }] })); };
  const removeJobPref = (id) => setJobPreferences(prev => ({ ...prev, items: prev.items.filter(j => j.id !== id) }));
  const addWorkExperience = () => setWorkExperience(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, description: "", certificate: null, githubLink: "" }] }));
  const removeWorkExperience = (id) => setWorkExperience(prev => ({ ...prev, items: prev.items.filter(w => w.id !== id) }));
  const addProject = () => setProjects(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), title: "", qualificationLevel: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", projectUrl: "" }] })); const removeProject = (id) => setProjects(prev => ({ ...prev, items: prev.items.filter(p => p.id !== id) }));
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
      const finalSectors = {
        preferredSectors: [...sectorPreferences.preferredSectors],
        secondarySectors: [...sectorPreferences.secondarySectors]
      };

      const processSectors = (list) => {
        let updated = list.filter(s => s !== "Other");
        if (list.includes("Other") && sectorPreferences.otherSector.trim()) {
          updated.push(sectorPreferences.otherSector.trim());
        }
        return updated;
      };

      finalSectors.preferredSectors = processSectors(finalSectors.preferredSectors);
      finalSectors.secondarySectors = processSectors(finalSectors.secondarySectors);
      formData.append("sectorPreferences", JSON.stringify(finalSectors));

      formData.append("careerGoals", JSON.stringify(careerGoals));
      const workData = workExperience.isApplicable ? workExperience.items.map(w => ({ ...w, certificate: w.certificate?.publicId || w.certificate })) : [];
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

  const inputClass = "h-12 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#30919D] mt-2 transition-all duration-200 shadow-sm dark:shadow-none placeholder:text-slate-400 dark:placeholder:text-white/20";
  const selectClass = "w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1120] px-3 text-slate-900 dark:text-white mt-2 transition-all duration-200 shadow-sm dark:shadow-none focus:border-[#30919D]";
  const textareaClass = "w-full h-24 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mt-2 p-3 resize-none transition-all duration-200 shadow-sm dark:shadow-none";
  const yearOptions = Array.from({ length: 30 }, (_, i) => 2010 + i);
  const salaryRanges = ["0-3 LPA", "3-5 LPA", "5-8 LPA", "8-12 LPA", "12-18 LPA", "18-25 LPA", "25+ LPA"];
  const sectorOptions = ["IT/Software", "Core Engineering", "Finance", "Consulting", "Marketing", "Data Science", "Education", "Healthcare", "Government", "Startups", "Other"];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#001229] flex items-center justify-center flex-col">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center shadow-2xl">
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
    <div className="min-h-screen py-8 px-4 bg-slate-50 dark:bg-[#001229] relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          Skip <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-100 dark:bg-[#30919D]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100 dark:bg-blue-900/10 blur-[100px]" />
      </div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col mb-10 gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">Profile Completion</h1>
              <div className="flex items-center gap-2 mt-2">
                <Quote className="w-4 h-4 text-slate-400 transform rotate-180" />
                <p className="text-slate-600 dark:text-slate-300 italic font-medium">"You're good to go! Only a few steps left to get you career ready."</p>
              </div>
            </div>
            <div className="flex gap-2">
              {steps.map((_, i) => (<div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-teal-500" : i < currentStep ? "w-2 bg-teal-500/50" : "w-2 bg-slate-200 dark:bg-white/10"}`} />))}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white dark:bg-[#0B1120] rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden">
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
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Personal Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><Label>Full Name (Locked)</Label><Input value={personalDetails.fullName} disabled placeholder="Full Name" className={inputClass + " bg-slate-100 opacity-80"} /></div>
                  <div><Label>Nick Name *</Label><Input value={personalDetails.nickname} onChange={(e) => setPersonalDetails({ ...personalDetails, nickname: e.target.value })} placeholder="Enter your nickname" className={inputClass} /></div>
                  <div><Label>Date of Birth *</Label><Input type="date" value={personalDetails.dob} onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })} className={inputClass + " [color-scheme:light] dark:[color-scheme:dark]"} /></div>
                  <div><Label>Gender *</Label><select value={personalDetails.gender} onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })} className={selectClass}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                  <div><Label>Phone Number (Locked)</Label><Input value={personalDetails.mobileNumber} disabled placeholder="Mobile Number" className={inputClass + " bg-slate-100 opacity-80"} /></div>
                  <div><Label>Alternate Mobile *</Label><Input type="number" value={personalDetails.alternateMobile} onChange={(e) => setPersonalDetails({ ...personalDetails, alternateMobile: e.target.value })} placeholder="Enter alternate mobile number" className={inputClass} /></div>
                  <div><Label>Email ID (Locked)</Label><Input value={personalDetails.email} disabled placeholder="Email Address" className={inputClass + " bg-slate-100 opacity-80"} /></div>
                  <div><Label>Student ID (Optional)</Label><Input value={personalDetails.studentId} onChange={(e) => setPersonalDetails({ ...personalDetails, studentId: e.target.value })} placeholder="Enter your Student ID/Roll No" className={inputClass} /></div>

                  <div><Label>College Name (Locked)</Label><Input value={personalDetails.institution} disabled placeholder="College Name" className={inputClass + " bg-slate-100 opacity-80"} /></div>
                  <div><Label>Department (Locked)</Label><Input value={personalDetails.department} disabled placeholder="Department" className={inputClass + " bg-slate-100 opacity-80"} /></div>

                  <div><Label>Year of Study *</Label><Input type="date" value={personalDetails.yearOfStudy} onChange={(e) => setPersonalDetails({ ...personalDetails, yearOfStudy: e.target.value })} className={inputClass + " [color-scheme:light] dark:[color-scheme:dark]"} /></div>
                  <div><Label>Year of Passing *</Label><Input type="date" value={personalDetails.yearOfPassing} onChange={(e) => setPersonalDetails({ ...personalDetails, yearOfPassing: e.target.value })} className={inputClass + " [color-scheme:light] dark:[color-scheme:dark]"} /></div>

                  <div className="md:col-span-2"><Label>Qualification Level *</Label>
                    <select value={personalDetails.educationLevel} onChange={(e) => setPersonalDetails({ ...personalDetails, educationLevel: e.target.value })} className={selectClass}>
                      <option value="">Select Qualification Level</option>
                      <option value="Diploma">Diploma</option>
                      <option value="UG">Undergraduate (UG)</option>
                      <option value="PG">Postgraduate (PG)</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-white/10">
                    <h3 className="text-sm font-semibold mb-3 text-slate-500">Current Address</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label>City *</Label><Input value={personalDetails.address.city} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, city: e.target.value } })} placeholder="e.g. Pune" className={inputClass} /></div>
                      <div><Label>State *</Label><Input value={personalDetails.address.state} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, state: e.target.value } })} placeholder="e.g. Maharashtra" className={inputClass} /></div>
                      <div><Label>Country *</Label><Input value={personalDetails.address.country} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, country: e.target.value } })} placeholder="e.g. India" className={inputClass} /></div>
                    </div>
                  </div>                </div>
              </motion.div>
            )}

            {/* Step 2: 10th Details */}
            {currentStep === 2 && (
              <motion.div key="tenth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">10th Standard Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><Label>School Name *</Label><Input value={tenthDetails.schoolName} onChange={(e) => setTenthDetails({ ...tenthDetails, schoolName: e.target.value })} placeholder="Enter your 10th school name" className={inputClass} /></div>
                  <div><Label>Year of Passing *</Label><select value={tenthDetails.yearOfPassing} onChange={(e) => setTenthDetails({ ...tenthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div><Label>Percentage (%) *</Label><Input type="number" max="100" value={tenthDetails.percentage} onChange={(e) => setTenthDetails({ ...tenthDetails, percentage: e.target.value })} placeholder="e.g. 85.5" className={inputClass} /></div>
                  <div className="md:col-span-2"><Label>Upload Marksheet *</Label><FileUpload value={tenthDetails.marksheet} onChange={(fid, fdata) => setTenthDetails({ ...tenthDetails, marksheet: fdata?.url || fid })} helperText="Scan of original 10th marksheet (PDF/JPG)" /></div>                </div>
              </motion.div>
            )}

            {/* Step 3: 12th Details */}
            {currentStep === 3 && (
              <motion.div key="twelfth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">12th Standard Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><Label>School/College Name *</Label><Input value={twelfthDetails.schoolName} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, schoolName: e.target.value })} placeholder="Enter your 12th school/college name" className={inputClass} /></div>
                  <div><Label>Stream *</Label><select value={twelfthDetails.stream} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, stream: e.target.value })} className={selectClass}><option value="">Select Stream</option><option value="Science">Science</option><option value="Commerce">Commerce</option><option value="Arts">Arts</option><option value="Other">Other</option></select></div>
                  <div><Label>Year of Passing *</Label><select value={twelfthDetails.yearOfPassing} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, yearOfPassing: e.target.value })} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div><Label>Percentage (%) *</Label><Input type="number" max="100" value={twelfthDetails.percentage} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, percentage: e.target.value })} placeholder="e.g. 92.0" className={inputClass} /></div>
                  <div className="md:col-span-2"><Label>Upload Marksheet *</Label><FileUpload value={twelfthDetails.marksheet} onChange={(fid, fdata) => setTwelfthDetails({ ...twelfthDetails, marksheet: fdata?.url || fid })} helperText="Scan of original 12th marksheet (PDF/JPG)" /></div>                </div>
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
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {higherEducation.length > 1 && <button onClick={() => removeHigherEd(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Degree #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Qualification Level *</Label><select value={item.qualificationLevel} onChange={(e) => { const n = [...higherEducation]; n[index].qualificationLevel = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Level</option><option value="Diploma">Diploma</option><option value="UG">Undergraduate (UG)</option><option value="PG">Postgraduate (PG)</option><option value="PhD">PhD</option></select></div>
                      <div><Label>Degree Name *</Label><Input value={item.degree} onChange={(e) => { const n = [...higherEducation]; n[index].degree = e.target.value; setHigherEducation(n); }} placeholder="e.g. B.Tech Computer Science" className={inputClass} /></div>
                      <div><Label>Specialization (Optional)</Label><Input value={item.specialization} onChange={(e) => { const n = [...higherEducation]; n[index].specialization = e.target.value; setHigherEducation(n); }} placeholder="e.g. Artificial Intelligence" className={inputClass} /></div>
                      <div><Label>Institution Name *</Label><Input value={item.institutionName} onChange={(e) => { const n = [...higherEducation]; n[index].institutionName = e.target.value; setHigherEducation(n); }} placeholder="Enter name of college/institute" className={inputClass} /></div>
                      <div><Label>University *</Label><Input value={item.university} onChange={(e) => { const n = [...higherEducation]; n[index].university = e.target.value; setHigherEducation(n); }} placeholder="Enter university name" className={inputClass} /></div>
                      <div><Label>Year of Passing *</Label><select value={item.yearOfPassing} onChange={(e) => { const n = [...higherEducation]; n[index].yearOfPassing = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                      <div><Label>CGPA / Percentage *</Label><Input type="number" max="100" value={item.cgpaPercentage} onChange={(e) => { const n = [...higherEducation]; n[index].cgpaPercentage = e.target.value; setHigherEducation(n); }} placeholder="e.g. 8.5 or 85" className={inputClass} /></div>
                      <div><Label>Degree Status *</Label><select value={item.degreeStatus} onChange={(e) => { const n = [...higherEducation]; n[index].degreeStatus = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Status</option><option value="Pursuing">Pursuing</option><option value="Completed">Completed</option></select></div>
                      <div className="md:col-span-2">
                        <Label>Degree Certificate / Provisional Upload {item.degreeStatus === 'Completed' ? '*' : '(Optional)'}</Label>
                        <FileUpload value={item.certificate} onChange={(fid, fdata) => { const n = [...higherEducation]; n[index].certificate = fdata?.url || fid; setHigherEducation(n); }} helperText="Upload your degree or provisional certificate" />
                      </div>                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 5: Activities */}
            {currentStep === 5 && (
              <motion.div key="activities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Extra-Curricular Activities</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-500"><input type="checkbox" checked={!extracurricular.isApplicable} onChange={(e) => setExtracurricular({ ...extracurricular, isApplicable: !e.target.checked })} className="accent-[#30919D]" /><span className="text-sm">Not Applicable</span></label>
                    {extracurricular.isApplicable && <Button onClick={addExtracurricular} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Activity</Button>}                  </div>
                </div>
                {extracurricular.isApplicable ? extracurricular.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {extracurricular.items.length > 1 && <button onClick={() => removeExtracurricular(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Activity #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Activity Type (Sports, Arts, Volunteering, etc.)</Label><Input value={item.activityType} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].activityType = e.target.value; setExtracurricular(n); }} placeholder="e.g. Football, Painting, NGO Volunteering" className={inputClass} /></div>
                      <div><Label>Level</Label><select value={item.level} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].level = e.target.value; setExtracurricular(n); }} className={selectClass}><option value="">Select Level</option><option value="School">School</option><option value="College">College</option><option value="District">District</option><option value="State">State</option><option value="National">National</option><option value="International">International</option></select></div>
                      <div className="md:col-span-2"><Label>Achievements (If any)</Label><textarea value={item.achievements} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].achievements = e.target.value; setExtracurricular(n); }} placeholder="e.g. Won 1st place in Inter-College debate competition" className={textareaClass} /></div>
                      <div className="md:col-span-2"><Label>Description (Optional)</Label><textarea value={item.description} onChange={(e) => { const n = { ...extracurricular, items: [...extracurricular.items] }; n.items[index].description = e.target.value; setExtracurricular(n); }} placeholder="Briefly describe your role and contributions" className={textareaClass} /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200">No activities to add. Check the box above if you have any!</div>}              </motion.div>
            )}

            {/* Step 6: Job Prefs - Refined Salary */}
            {currentStep === 6 && (
              <motion.div key="jobpref" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Job Preferences</h2>
                  <Button onClick={addJobPref} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Preference</Button>
                </div>
                {jobPreferences.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {jobPreferences.items.length > 1 && <button onClick={() => removeJobPref(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Preference #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Preferred Job Role *</Label><Input value={item.preferredRole} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].preferredRole = e.target.value; setJobPreferences(n); }} placeholder="e.g. Software Engineer, Data Analyst" className={inputClass} /></div>
                      <div><Label>Preferred Job Type *</Label><select value={item.jobType} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].jobType = e.target.value; setJobPreferences(n); }} className={selectClass}><option value="">Select Type</option><option value="Full-Time">Full-Time</option><option value="Internship">Internship</option></select></div>
                      <div><Label>Preferred Location *</Label><Input value={item.preferredLocation} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].preferredLocation = e.target.value; setJobPreferences(n); }} placeholder="e.g. Bangalore, Remote, Pune" className={inputClass} /></div>
                      <div><Label>Willing to Relocate *</Label><select value={item.willingToRelocate} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].willingToRelocate = e.target.value; setJobPreferences(n); }} className={selectClass}><option value="">Select Option</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div className="md:col-span-2">
                        <Label>Expected Salary Range (LPA) *</Label>                        <select value={item.expectedSalary} onChange={(e) => { const n = { ...jobPreferences, items: [...jobPreferences.items] }; n.items[index].expectedSalary = e.target.value; setJobPreferences(n); }} className={selectClass}>
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
                <p className="text-sm text-slate-500 mb-4">Select the sectors you are most interested in pursuing a career in.</p>

                <div className="space-y-8">
                  <div>
                    <Label className="text-base font-bold text-[#30919D]">Primary Sectors of Interest *</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sectorOptions.map(s => (
                        <button key={`primary-${s}`}
                          type="button"
                          onClick={() => { const updated = sectorPreferences.preferredSectors.includes(s) ? sectorPreferences.preferredSectors.filter(x => x !== s) : [...sectorPreferences.preferredSectors, s]; setSectorPreferences({ ...sectorPreferences, preferredSectors: updated }); }}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${sectorPreferences.preferredSectors.includes(s) ? "bg-[#30919D] text-white border-[#30919D] shadow-md shadow-teal-500/20" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#30919D]"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-bold text-slate-500">Secondary Sectors (Optional)</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sectorOptions.map(s => (
                        <button key={`secondary-${s}`}
                          type="button"
                          onClick={() => { const updated = sectorPreferences.secondarySectors.includes(s) ? sectorPreferences.secondarySectors.filter(x => x !== s) : [...sectorPreferences.secondarySectors, s]; setSectorPreferences({ ...sectorPreferences, secondarySectors: updated }); }}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${sectorPreferences.secondarySectors.includes(s) ? "bg-slate-500 text-white border-slate-500 shadow-md" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-400"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(sectorPreferences.preferredSectors.includes("Other") || sectorPreferences.secondarySectors.includes("Other")) && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <Label>Specify Other Sector *</Label>
                      <Input value={sectorPreferences.otherSector} onChange={(e) => setSectorPreferences({ ...sectorPreferences, otherSector: e.target.value })} className={inputClass} placeholder="e.g. Aerospace, Robotics, Renewable Energy" />                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 8: Goals - Refined Placeholders */}
            {currentStep === 8 && (
              <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Career Goals</h2>
                  <p className="text-sm text-slate-500 mt-1">Define your professional trajectory to help us match you with the right opportunities.</p>
                </div>
                <div>
                  <Label>Short-term Goal (0-1 year) *</Label>
                  <textarea value={careerGoals.shortTerm} onChange={(e) => setCareerGoals({ ...careerGoals, shortTerm: e.target.value })} className={textareaClass} placeholder="e.g. Secure a software developer role in a product-based company and master React by end of 2024. Plan to complete 3 major certifications." />
                </div>
                <div>
                  <Label>Medium-term Goal (1-3 years) *</Label>
                  <textarea value={careerGoals.mediumTerm} onChange={(e) => setCareerGoals({ ...careerGoals, mediumTerm: e.target.value })} className={textareaClass} placeholder="e.g. Transition into a Senior Project Manager role, lead a cross-functional team of 10+, and obtain PMP certification. Reach an annual income of 15 LPA." />
                </div>
                <div>
                  <Label>Long-term Goal (3-5 years) *</Label>
                  <textarea value={careerGoals.longTerm} onChange={(e) => setCareerGoals({ ...careerGoals, longTerm: e.target.value })} className={textareaClass} placeholder="e.g. Establish my own ed-tech startup or become a Chief Technology Officer (CTO) at a global firm. Focus on driving large-scale digital transformation." />
                </div>              </motion.div>
            )}

            {/* Step 9: Work */}
            {currentStep === 9 && (
              <motion.div key="work" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Work Experience</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-500"><input type="checkbox" checked={!workExperience.isApplicable} onChange={(e) => setWorkExperience({ ...workExperience, isApplicable: !e.target.checked })} className="accent-[#30919D]" /><span className="text-sm">Not Applicable</span></label>
                    {workExperience.isApplicable && <Button onClick={addWorkExperience} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Experience</Button>}                  </div>
                </div>
                {workExperience.isApplicable ? workExperience.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {workExperience.items.length > 1 && <button onClick={() => removeWorkExperience(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Experience #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><Label>Experience Type *</Label><select value={item.experienceType} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].experienceType = e.target.value; setWorkExperience(n); }} className={selectClass}><option value="">Select Type</option><option value="Internship">Internship</option><option value="Full-Time">Full-Time</option><option value="Contract">Contract</option></select></div>
                      <div><Label>Organization Name *</Label><Input value={item.organizationName} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].organizationName = e.target.value; setWorkExperience(n); }} placeholder="Enter name of the company" className={inputClass} /></div>
                      <div><Label>Job Title / Role *</Label><Input value={item.jobTitle} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].jobTitle = e.target.value; setWorkExperience(n); }} placeholder="e.g. Frontend Developer" className={inputClass} /></div>
                      <div><Label>Industry / Sector *</Label><Input value={item.industry} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].industry = e.target.value; setWorkExperience(n); }} placeholder="e.g. FinTech, E-commerce, Healthcare" className={inputClass} /></div>
                      <div><Label>Start Date *</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].startDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>
                      {!item.currentlyWorking && <div><Label>End Date *</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].endDate = e.target.value; setWorkExperience(n); }} className={inputClass} /></div>}
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input type="checkbox" id={`current-${item.id}`} checked={item.currentlyWorking} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].currentlyWorking = e.target.checked; if (e.target.checked) n.items[index].endDate = ""; setWorkExperience(n); }} className="w-4 h-4 accent-[#30919D]" />
                        <Label htmlFor={`current-${item.id}`} className="cursor-pointer">I am currently working here</Label>
                      </div>
                      <div className="md:col-span-2"><Label>Description *</Label><textarea value={item.description} onChange={(e) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].description = e.target.value; setWorkExperience(n); }} placeholder="Describe your key responsibilities and achievements..." className={textareaClass} /></div>
                      <div className="md:col-span-2"><Label>Experience Certificate / Offer Letter *</Label><FileUpload value={item.certificate} onChange={(fid, fdata) => { const n = { ...workExperience, items: [...workExperience.items] }; n.items[index].certificate = fdata?.url || fid; setWorkExperience(n); }} helperText="Upload certificate, offer letter or salary slips" /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200">No work experience to add.</div>}              </motion.div>
            )}

            {/* Step 10: Projects */}
            {currentStep === 10 && (
              <motion.div key="proj" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Projects</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-500"><input type="checkbox" checked={!projects.isApplicable} onChange={(e) => setProjects({ ...projects, isApplicable: !e.target.checked })} className="accent-[#30919D]" /><span className="text-sm">Not Applicable</span></label>
                    {projects.isApplicable && <Button onClick={addProject} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Project</Button>}                  </div>
                </div>
                {projects.isApplicable ? projects.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {projects.items.length > 1 && <button onClick={() => removeProject(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Project #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><Label>Project Title *</Label><Input value={item.title} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].title = e.target.value; setProjects(n); }} placeholder="e.g. AI-driven Traffic Management System" className={inputClass} /></div>
                      <div><Label>Associated Qualification Level *</Label><select value={item.qualificationLevel} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].qualificationLevel = e.target.value; setProjects(n); }} className={selectClass}><option value="">Select Level</option><option value="College">College/University Project</option><option value="Company">Company/Internship Project</option><option value="Independent">Independent/Personal Project</option></select></div>
                      {(item.qualificationLevel === 'College' || item.qualificationLevel === 'Company') && (
                        <div><Label>{item.qualificationLevel === 'College' ? 'Institution Name *' : 'Organization Name *'}</Label><Input value={item.qualificationLevel === 'College' ? item.institution : item.companyName} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; if (item.qualificationLevel === 'College') n.items[index].institution = e.target.value; else n.items[index].companyName = e.target.value; setProjects(n); }} placeholder={`Enter ${item.qualificationLevel.toLowerCase()} name`} className={inputClass} /></div>
                      )}
                      <div><Label>Team Type *</Label><select value={item.teamType} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].teamType = e.target.value; setProjects(n); }} className={selectClass}><option value="">Select Type</option><option value="Individual">Individual</option><option value="Team">Team</option></select></div>
                      <div><Label>Start Date *</Label><Input type="date" value={item.startDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].startDate = e.target.value; setProjects(n); }} className={inputClass} /></div>
                      {!item.currentlyWorking && <div><Label>End Date *</Label><Input type="date" value={item.endDate} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].endDate = e.target.value; setProjects(n); }} className={inputClass} /></div>}
                      <div className="md:col-span-2"><Label>Project Description *</Label><textarea value={item.description} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].description = e.target.value; setProjects(n); }} placeholder="Explain the project goal, your role, and tools/technologies used..." className={textareaClass} /></div>
                      <div className="md:col-span-2"><Label>Project URL / GitHub Link (Optional)</Label><Input value={item.projectUrl} onChange={(e) => { const n = { ...projects, items: [...projects.items] }; n.items[index].projectUrl = e.target.value; setProjects(n); }} placeholder="https://github.com/... or https://project-demo.com" className={inputClass} /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200">No projects to add.</div>}              </motion.div>
            )}

            {/* Step 11: Certs - Refined URL Input */}
            {currentStep === 11 && (
              <motion.div key="certs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Technical Certificates</h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-500"><input type="checkbox" checked={!certificates.isApplicable} onChange={(e) => setCertificates({ ...certificates, isApplicable: !e.target.checked })} className="accent-[#30919D]" /><span className="text-sm">Not Applicable</span></label>
                    {certificates.isApplicable && <Button onClick={addCertificate} variant="outline" size="sm" className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:bg-white/10"><Plus size={16} /> Add Certificate</Button>}                  </div>
                </div>
                {certificates.isApplicable ? certificates.items.map((item, index) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative group">
                    {certificates.items.length > 1 && <button onClick={() => removeCertificate(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>}
                    <h3 className="font-semibold mb-4 text-[#30919D]">Certificate #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><Label>Certificate Title *</Label><Input value={item.title} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].title = e.target.value; setCertificates(n); }} placeholder="e.g. AWS Certified Solutions Architect" className={inputClass} /></div>
                      <div><Label>Issuing Organization *</Label><Input value={item.issuingOrg} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].issuingOrg = e.target.value; setCertificates(n); }} placeholder="e.g. Amazon Web Services, Google, Coursera" className={inputClass} /></div>
                      <div><Label>Year of Completion *</Label><select value={item.yearOfCompletion} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].yearOfCompletion = e.target.value; setCertificates(n); }} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                      <div><Label>Verification Method *</Label><select value={item.verificationType} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationType = e.target.value; setCertificates(n); }} className={selectClass}><option value="">Select Method</option><option value="url">Verification URL</option><option value="qr">QR Code on PDF</option></select></div>
                      {item.verificationType === "url" && (
                        <div className="md:col-span-2"><Label>Verification URL *</Label><Input value={item.verificationUrl} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].verificationUrl = e.target.value; setCertificates(n); }} className={inputClass} placeholder="https://..." /></div>
                      )}

                      <div className="md:col-span-2"><Label>Upload Certificate (PDF/JPG) *</Label><FileUpload value={item.certificateFile} onChange={(fid, fdata) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].certificateFile = fdata?.url || fid; setCertificates(n); }} helperText="Upload the certificate file for verification" /></div>
                    </div>
                  </div>
                )) : <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200">No certificates to add.</div>}              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <div className="flex justify-between gap-4 mt-8">
          <Button onClick={handlePrevStep} disabled={currentStep === 0} className="flex-1 bg-white hover:bg-slate-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 h-12 rounded-xl text-lg disabled:opacity-50 transition-all font-semibold">← Previous</Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all shadow-teal-500/20">{isLoading ? <Loader2 className="animate-spin" /> : "Submit Registration"}</Button>
          ) : (
            <Button onClick={handleNextStep} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all shadow-teal-500/20">Next →</Button>
          )}
        </div>
      </div >
    </div >
  );
};

export default ComprehensiveSignup;
