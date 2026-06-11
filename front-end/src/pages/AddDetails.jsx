import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ChevronDown, User, GraduationCap, FileText, Award, CreditCard, Palette, Lock, Check, Briefcase, Target, FolderOpen, Plus, Trash2, ChevronRight, Quote, QrCode, Loader2, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiCall } from "@/services/api";
import FileUpload from "@/components/FileUpload";
import logoWhite from "@/assets/white.png";
const AddDetails = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [existingData, setExistingData] = useState(null);

    const [personalDetails, setPersonalDetails] = useState({ fullName: "", nickname: "", dob: "", gender: "", mobileNumber: "", email: "", institution: "", department: "", yearOfStudy: "", yearOfPassing: "", educationLevel: "", profilePhoto: null, address: { street: "", city: "", state: "", country: "" } });
    const [tenthDetails, setTenthDetails] = useState({ schoolName: "", yearOfPassing: "", percentage: "", board: "", marksheet: null });
    const [twelfthDetails, setTwelfthDetails] = useState({ schoolName: "", stream: "", yearOfPassing: "", percentage: "", board: "", marksheet: null });
    const [higherEducation, setHigherEducation] = useState([{ id: Date.now(), qualificationLevel: "", degree: "", degreeFullName: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
    const [extracurricular, setExtracurricular] = useState({ isApplicable: true, items: [{ id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] });
    const [jobPreferences, setJobPreferences] = useState({ items: [{ id: Date.now(), preferredRole: "", jobType: "", preferredLocation1: "", preferredLocation2: "", preferredLocation3: "", willingToRelocate: "", expectedSalary: "" }] });
    const [sectorPreferences, setSectorPreferences] = useState({ preferredSectors: [], secondarySectors: [], otherSector: "" });
    const [careerGoals, setCareerGoals] = useState({ shortTerm: "", mediumTerm: "", longTerm: "" });
    const [personalDevelopmentGoals, setPersonalDevelopmentGoals] = useState({ shortTerm: "", mediumTerm: "", longTerm: "" });
    const [workExperience, setWorkExperience] = useState({ isApplicable: true, items: [{ id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, keyResponsibilities: "", significantAccomplishments: "", documents: { offerLetter: null, appointmentLetter: null, appreciationLetter: null, experienceLetter: null }, selectedDocs: [], githubLink: "" }] });
    const [projects, setProjects] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", doneIn: "", institution: "", companyName: "", teamType: "", startDate: "", endDate: "", currentlyWorking: false, description: "", significantAchievements: "", projectUrl: "" }] });
    const [certificates, setCertificates] = useState({ isApplicable: true, items: [{ id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }] });

    const [excelData, setExcelData] = useState({ sectors: [], roles: [] });
    const [roleSuggestions, setRoleSuggestions] = useState([]);
    const [activeSearchIndex, setActiveSearchIndex] = useState(null);
    const suggestionsRef = useRef(null);

    // Degree Options State
    const [degreeOptions, setDegreeOptions] = useState({
        levels: [],
        domains: {},
        fullNames: {},
        specializations: {}
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
        const fetchData = async () => {
            try {
                const userDataStr = sessionStorage.getItem("user");
                if (!userDataStr) {
                    navigate('/');
                    return;
                }
                const user = JSON.parse(userDataStr);
                const email = user.email;

                const regData = await apiCall(`/users/register-details/${email}`);
                if (regData) {
                    setExistingData(regData);

                    // Populate states
                    if (regData.fullName) setPersonalDetails(prev => ({ ...prev, ...regData, email, dob: regData.dob ? new Date(regData.dob).toISOString().split('T')[0] : "" }));
                    if (regData.tenthDetails) setTenthDetails({ ...regData.tenthDetails });
                    if (regData.twelfthDetails) setTwelfthDetails({ ...regData.twelfthDetails });
                    if (regData.higherEducation?.length > 0) {
                        const higherEd = regData.higherEducation.map(h => ({ ...h, id: h.id || Math.random() }));
                        setHigherEducation(higherEd);
                        // Fetch sub-options for each existing degree to populate dropdowns correctly
                        higherEd.forEach((item, index) => {
                            if (item.qualificationLevel) fetchDegreeSubOptions('domains', { level: item.qualificationLevel }, index);
                            if (item.degree) fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: item.degree }, index);
                            if (item.degreeFullName) fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: item.degreeFullName }, index);
                        });
                    }
                    if (regData.extracurricular?.length > 0) {
                        setExtracurricular({ isApplicable: true, items: regData.extracurricular.map(e => ({ ...e, id: e.id || Math.random() })) });
                    }
                    if (regData.jobPreferences?.length > 0) {
                        setJobPreferences({ items: regData.jobPreferences.map(j => ({ ...j, id: j.id || Math.random() })) });
                    }
                    if (regData.sectorPreferences) setSectorPreferences(regData.sectorPreferences);
                    if (regData.careerGoals) setCareerGoals(regData.careerGoals);
                    if (regData.personalDevelopmentGoals) setPersonalDevelopmentGoals(regData.personalDevelopmentGoals);
                    if (regData.workExperience?.length > 0) {
                        setWorkExperience({ isApplicable: true, items: regData.workExperience.map(w => ({ ...w, id: w.id || Math.random() })) });
                    }
                    if (regData.projects?.length > 0) {
                        setProjects({ isApplicable: true, items: regData.projects.map(p => ({ ...p, id: p.id || Math.random() })) });
                    }
                    if (regData.certificates?.length > 0) {
                        setCertificates({ isApplicable: true, items: regData.certificates.map(c => ({ ...c, id: c.id || Math.random() })) });
                    }
                }

                const careerData = await apiCall('/career-intelligence/excel-data');
                if (careerData) {
                    setExcelData({
                        sectors: careerData.masterSectors || [],
                        roles: careerData.allRoles || []
                    });
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load your profile data");
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleRoleSearch = (value, index) => {
        setJobPreferences(prev => {
            const items = [...prev.items];
            items[index].preferredRole = value;
            return { ...prev, items };
        });

        if (value.length > 1) {
            const filtered = excelData.roles.filter(role =>
                role.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10);
            setRoleSuggestions(filtered);
            setActiveSearchIndex(index);
        } else {
            setRoleSuggestions([]);
            setActiveSearchIndex(null);
        }
    };

    const selectRole = (role, index) => {
        setJobPreferences(prev => {
            const items = [...prev.items];
            items[index].preferredRole = role;
            return { ...prev, items };
        });
        setRoleSuggestions([]);
        setActiveSearchIndex(null);
    };

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

    const isFieldDisabled = (section, field) => {
        return false;
    };

    const validateProfilePhoto = () => {
        if (!personalDetails.profilePhoto) { toast.error("Profile Photo is required"); return false; }
        return true;
    };

    const validatePersonalDetails = () => {
        if (!personalDetails.fullName?.trim()) { toast.error("Full name is required"); return false; }
        if (!personalDetails.nickname?.trim()) { toast.error("Nick name is required"); return false; }
        if (!personalDetails.dob) { toast.error("Date of Birth is required"); return false; }
        const dobDate = new Date(personalDetails.dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        if (age < 15) { toast.error("You must be at least 15 years old."); return false; }
        if (!personalDetails.gender) { toast.error("Gender is required"); return false; }
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
            if (!h.qualificationLevel) { toast.error(`Higher Ed ${i + 1}: Degree Level is required`); return false; }
            if (!h.degree) { toast.error(`Higher Ed ${i + 1}: Domain Field is required`); return false; }
            if (!h.degreeFullName) { toast.error(`Higher Ed ${i + 1}: Degree Full Name is required`); return false; }
            if (!h.institutionName?.trim()) { toast.error(`Higher Ed ${i + 1}: Institution Name is required`); return false; }
            if (!h.yearOfPassing) { toast.error(`Higher Ed ${i + 1}: Year of Passing is required`); return false; }
            if (!h.cgpaPercentage) { toast.error(`Higher Ed ${i + 1}: CGPA/Percentage is required`); return false; }
            if (!h.certificate) { toast.error(`Higher Ed ${i + 1}: Certificate upload is required`); return false; }
        }
        return true;
    };

    const validateJobPreferences = () => {
        for (let i = 0; i < jobPreferences.items.length; i++) {
            const j = jobPreferences.items[i];
            if (!j.preferredRole?.trim()) { toast.error(`Job Pref ${i + 1}: Preferred Job Role is required`); return false; }
            if (!j.jobType) { toast.error(`Job Pref ${i + 1}: Job Type is required`); return false; }
        }
        return true;
    };

    const validateSectorPreferences = () => {
        if (sectorPreferences.preferredSectors.length === 0) { toast.error("Please select at least one preferred sector"); return false; }
        return true;
    };

    const validateCareerGoals = () => {
        if (!careerGoals.shortTerm?.trim() || !careerGoals.mediumTerm?.trim() || !careerGoals.longTerm?.trim()) { toast.error("All career goals are required"); return false; }
        if (!personalDevelopmentGoals.shortTerm?.trim() || !personalDevelopmentGoals.mediumTerm?.trim() || !personalDevelopmentGoals.longTerm?.trim()) { toast.error("All personal development goals are required"); return false; }
        return true;
    };

    const validateProjects = () => {
        if (!projects.isApplicable) return true;
        for (let i = 0; i < projects.items.length; i++) {
            const p = projects.items[i];
            if (!p.title?.trim() || !p.doneIn || !p.teamType || !p.startDate || !p.description?.trim()) { toast.error(`Project ${i + 1}: All fields marked * are required`); return false; }
        }
        return true;
    };

    const validateWorkExperience = () => {
        if (!workExperience.isApplicable) return true;
        for (let i = 0; i < workExperience.items.length; i++) {
            const w = workExperience.items[i];
            if (!w.experienceType || !w.organizationName?.trim() || !w.jobTitle?.trim() || !w.startDate) { toast.error(`Experience ${i + 1}: All fields marked * are required`); return false; }
        }
        return true;
    };

    const validateCertificates = () => {
        if (!certificates.isApplicable) return true;
        for (let i = 0; i < certificates.items.length; i++) {
            const c = certificates.items[i];
            if (!c.title?.trim() || !c.issuingOrg?.trim() || !c.yearOfCompletion) { toast.error(`Certificate ${i + 1}: All fields marked * are required`); return false; }
        }
        return true;
    };

    const handleNextStep = () => {
        let isValid = true;
        switch (currentStep) {
            case 0: isValid = validateProfilePhoto(); break;
            case 1: isValid = validatePersonalDetails(); break;
            case 2: isValid = validateTenthDetails(); break;
            case 3: isValid = validateTwelfthDetails(); break;
            case 4: isValid = validateHigherEducation(); break;
            case 5: isValid = validateJobPreferences(); break;
            case 6: isValid = validateSectorPreferences(); break;
            case 7: isValid = validateCareerGoals(); break;
            case 8: isValid = validateProjects(); break;
            case 9: isValid = validateWorkExperience(); break;
            case 10: isValid = validateCertificates(); break;
            default: isValid = true;
        }

        if (isValid && currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
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

            const finalSectors = { ...sectorPreferences };
            formData.append("sectorPreferences", JSON.stringify(finalSectors));

            formData.append("careerGoals", JSON.stringify(careerGoals));
            formData.append("personalDevelopmentGoals", JSON.stringify(personalDevelopmentGoals));

            const workData = workExperience.isApplicable ? workExperience.items.map(w => {
                const cleanedDocs = {};
                if (w.documents) {
                    Object.keys(w.documents).forEach(type => {
                        cleanedDocs[type] = w.documents[type]?.publicId || w.documents[type];
                    });
                }
                return { ...w, documents: cleanedDocs };
            }) : [];
            formData.append("workExperience", JSON.stringify(workData));

            const projData = projects.isApplicable ? projects.items : [];
            formData.append("projects", JSON.stringify(projData));

            const certData = certificates.isApplicable ? certificates.items.map(c => ({ ...c, certificateFile: c.certificateFile?.publicId || c.certificateFile })) : [];
            formData.append("certificates", JSON.stringify(certData));

            formData.append("submissionDate", new Date().toISOString());

            await apiCall('/users/register-details', { method: "POST", body: formData });

            setIsLoading(false);
            setIsSuccess(true);
            toast.success("Profile details updated successfully!");

            setTimeout(() => {
                navigate("/profile", { replace: true });
            }, 3000);

        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to save details");
            setIsLoading(true); // Keep spinner if error? No, false.
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed";
    const selectClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 appearance-none disabled:opacity-60 disabled:cursor-not-allowed";
    const textareaClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#C0C0C0] focus:ring-0 px-0 py-2 text-base transition-all duration-300 resize-none placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed";
    const yearOptions = Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => 2010 + i);

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1a3884]" />
                    <p className="font-sans italic text-slate-500">Loading your profile data...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex items-center justify-center flex-col p-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="w-24 h-24 bg-[#1a3884] rounded-full flex items-center justify-center shadow-2xl mb-8">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Profile Details Updated!</h2>
                <p className="text-slate-600">Your new details have been successfully saved to the database.</p>
                <p className="text-slate-400 mt-8 text-sm">Redirecting to profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#C0C0C0]/30">
            <div className="max-w-4xl mx-auto py-10 px-4 relative">
                
                <div className="text-center mb-10">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-[#1a3884] mb-4 tracking-tight"
                    >
                        Activate Your Profile
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 max-w-2xl mx-auto"
                    >
                        Complete your profile with your best details to unlock top career opportunities and stand out to recruiters!
                    </motion.p>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1),0_0_20px_rgba(192,192,192,0.4)] border-2 border-[#C0C0C0] relative flex flex-col min-h-[600px]">

                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1a3884] rounded-lg flex items-center justify-center text-white">
                                {steps[currentStep].icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{steps[currentStep].title} Details</h2>
                                <p className="text-xs text-slate-400 font-medium">Step {currentStep + 1} of {steps.length}</p>
                            </div>
                        </div>
                        {existingData && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                                <Lock className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Verified Data Locked</span>
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 0: Profile Photo */}
                        {currentStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="max-w-xs mx-auto text-center space-y-6 py-4">
                                    <div className="relative inline-block group">
                                        <div className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                            {personalDetails.profilePhoto ? (
                                                <img src={personalDetails.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-16 h-16 text-slate-300" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#1a3884] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-[#1a3884] transition-colors">
                                                <Camera className="w-5 h-5" />
                                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const res = await apiCall('/upload', { method: 'POST', body: formData });
                                                            setPersonalDetails({ ...personalDetails, profilePhoto: res.url });
                                                        } catch (err) { toast.error("Upload failed"); }
                                                    }
                                                }} />
                                            </label>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg">Your Profile Picture</h3>
                                        <p className="text-sm text-slate-500">This photo will be visible to potential employers and on your certificates.</p>
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Personal Details */}
                        {currentStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Full Name</Label>
                                        <Input value={personalDetails.fullName} onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })} className={inputClass} placeholder="Enter your full name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nick Name</Label>
                                        <Input value={personalDetails.nickname} onChange={(e) => setPersonalDetails({ ...personalDetails, nickname: e.target.value })} className={inputClass} placeholder="Enter your nickname" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Date of Birth</Label>
                                        <Input type="date" value={personalDetails.dob} onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })} className={inputClass} min="1900-01-01" max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gender</Label>
                                        <select value={personalDetails.gender} className={selectClass} onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}>
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Education Level</Label>
                                        <Input value={personalDetails.educationLevel} onChange={(e) => setPersonalDetails({ ...personalDetails, educationLevel: e.target.value })} className={inputClass} placeholder="e.g. Undergraduate, Postgraduate" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Mobile Number</Label>
                                        <Input value={personalDetails.mobileNumber} onChange={(e) => setPersonalDetails({ ...personalDetails, mobileNumber: e.target.value })} className={inputClass} placeholder="Enter mobile number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                                        <Input value={personalDetails.email} disabled className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Address</Label>
                                        <Input value={personalDetails.address?.street || ""} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, street: e.target.value } })} className={inputClass} placeholder="Enter your address" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">City</Label>
                                        <Input value={personalDetails.address?.city || ""} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, city: e.target.value } })} className={inputClass} placeholder="Enter your city" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">State</Label>
                                        <Input value={personalDetails.address?.state || ""} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, state: e.target.value } })} className={inputClass} placeholder="Enter your state" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Country</Label>
                                        <Input value={personalDetails.address?.country || ""} onChange={(e) => setPersonalDetails({ ...personalDetails, address: { ...personalDetails.address, country: e.target.value } })} className={inputClass} placeholder="Enter your country" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: 10th Details */}
                        {currentStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">School Name</Label>
                                        <Input value={tenthDetails.schoolName} onChange={(e) => setTenthDetails({ ...tenthDetails, schoolName: e.target.value })} className={inputClass} placeholder="Enter school name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Board</Label>
                                        <select value={tenthDetails.board} onChange={(e) => setTenthDetails({ ...tenthDetails, board: e.target.value })} className={selectClass}>
                                            <option value="">Select Board</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="State Board">State Board</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Year of Passing</Label>
                                        <select value={tenthDetails.yearOfPassing} onChange={(e) => setTenthDetails({ ...tenthDetails, yearOfPassing: e.target.value })} className={selectClass}>
                                            <option value="">Select Year</option>
                                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Percentage / CGPA</Label>
                                        <Input value={tenthDetails.percentage} onChange={(e) => setTenthDetails({ ...tenthDetails, percentage: e.target.value })} className={inputClass} placeholder="e.g. 95% or 9.5" />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <FileUpload
                                        label="Upload 10th Marksheet"
                                        onUpload={(file) => setTenthDetails({ ...tenthDetails, marksheet: file })}
                                        value={tenthDetails.marksheet}
                                       
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: 12th Details */}
                        {currentStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">School/College Name</Label>
                                        <Input value={twelfthDetails.schoolName} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, schoolName: e.target.value })} className={inputClass} placeholder="Enter school/college name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Stream</Label>
                                        <select value={twelfthDetails.stream} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, stream: e.target.value })} className={selectClass}>
                                            <option value="">Select Stream</option>
                                            <option value="Science">Science</option>
                                            <option value="Commerce">Commerce</option>
                                            <option value="Arts">Arts</option>
                                            <option value="Vocational">Vocational</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Board</Label>
                                        <select value={twelfthDetails.board} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, board: e.target.value })} className={selectClass}>
                                            <option value="">Select Board</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="State Board">State Board</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Year of Passing</Label>
                                        <select value={twelfthDetails.yearOfPassing} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, yearOfPassing: e.target.value })} className={selectClass}>
                                            <option value="">Select Year</option>
                                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Percentage / CGPA</Label>
                                        <Input value={twelfthDetails.percentage} onChange={(e) => setTwelfthDetails({ ...twelfthDetails, percentage: e.target.value })} className={inputClass} placeholder="e.g. 95% or 9.5" />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <FileUpload
                                        label="Upload 12th Marksheet"
                                        onUpload={(file) => setTwelfthDetails({ ...twelfthDetails, marksheet: file })}
                                        value={twelfthDetails.marksheet}
                                       
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Higher Education */}
                        {currentStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Add multiple degrees or diplomas you have completed or are pursuing.</p>
                                    <Button onClick={() => setHigherEducation([...higherEducation, { id: Date.now(), qualificationLevel: "", degree: "", degreeFullName: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }])} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add New Degree
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {higherEducation.map((item, index) => {
                                        const isExisting = false;
                                        return (
                                            <div key={item.id} className={`p-8 border-2 ${isExisting ? 'border-slate-100 bg-slate-50/30' : 'border-[#C0C0C0]/30 bg-[#C0C0C0]/5 shadow-sm'} relative transition-all duration-300`}>
                                                {!isExisting && <button onClick={() => setHigherEducation(higherEducation.filter(h => h.id !== item.id))} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>}
                                                <div className="flex items-center gap-2 mb-6">
                                                    <GraduationCap className={`w-5 h-5 ${isExisting ? 'text-slate-400' : 'text-[#C0C0C0]'}`} />
                                                    <h3 className="font-bold text-slate-800 tracking-tight">Academic Record #{index + 1} {isExisting && <span className="ml-3 text-[9px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Saved</span>}</h3>
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Degree Level *</Label>
                                                        <select
                                                            value={item.qualificationLevel}
                                                           
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
                                                            className={selectClass}
                                                        >
                                                            <option value="">Select Level</option>
                                                            {degreeOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Domain Field *</Label>
                                                        <select
                                                            value={item.degree}
                                                            disabled={!item.qualificationLevel}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const n = [...higherEducation];
                                                                n[index].degree = val;
                                                                n[index].degreeFullName = "";
                                                                n[index].specialization = "";
                                                                setHigherEducation(n);
                                                                if (val) fetchDegreeSubOptions('fullNames', { level: item.qualificationLevel, domain: val }, index);
                                                            }}
                                                            className={selectClass}
                                                        >
                                                            <option value="">Select Degree</option>
                                                            {(degreeOptions.domains[index] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Degree Full Name *</Label>
                                                        <select
                                                            value={item.degreeFullName}
                                                            disabled={!item.degree}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const n = [...higherEducation];
                                                                n[index].degreeFullName = val;
                                                                n[index].specialization = "";
                                                                setHigherEducation(n);
                                                                if (val) fetchDegreeSubOptions('specializations', { level: item.qualificationLevel, domain: item.degree, fullName: val }, index);
                                                            }}
                                                            className={selectClass}
                                                        >
                                                            <option value="">Select Full Name</option>
                                                            {(degreeOptions.fullNames[index] || []).map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Specialization *</Label>
                                                        <select
                                                            value={item.specialization}
                                                            disabled={!item.degreeFullName}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const n = [...higherEducation];
                                                                n[index].specialization = val;
                                                                setHigherEducation(n);
                                                            }}
                                                            className={selectClass}
                                                        >
                                                            <option value="">Select Specialization</option>
                                                            {(degreeOptions.specializations[index] || []).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Institution / College *</Label><Input value={item.institutionName} onChange={(e) => { const n = [...higherEducation]; n[index].institutionName = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Year of Passing *</Label><select value={item.yearOfPassing} onChange={(e) => { const n = [...higherEducation]; n[index].yearOfPassing = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">CGPA / Percentage *</Label><Input value={item.cgpaPercentage} onChange={(e) => { const n = [...higherEducation]; n[index].cgpaPercentage = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                                                    {!isExisting && (
                                                        <div className="md:col-span-2 mt-4">
                                                            <Label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Upload Degree Certificate / Marksheet *</Label>
                                                            <FileUpload value={item.certificate} onChange={(fid, fdata) => { const n = [...higherEducation]; n[index].certificate = fdata?.url || fid; setHigherEducation(n); }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 11: Certificates */}
                        {currentStep === 11 && (
                            <motion.div key="step11" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Add professional certifications, courses, or training rewards.</p>
                                    <Button onClick={() => setCertificates({ ...certificates, items: [...certificates.items, { id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }] })} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add New Certificate
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {certificates.items.map((item, index) => {
                                        const isExisting = false;
                                        return (
                                            <div key={item.id} className={`p-8 border-2 ${isExisting ? 'border-slate-100 bg-slate-50/30' : 'border-[#C0C0C0]/30 bg-[#C0C0C0]/5 shadow-sm'} relative transition-all duration-300`}>
                                                {!isExisting && <button onClick={() => setCertificates({ ...certificates, items: certificates.items.filter(c => c.id !== item.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>}
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Award className={`w-5 h-5 ${isExisting ? 'text-slate-400' : 'text-[#C0C0C0]'}`} />
                                                    <h3 className="font-bold text-slate-800 tracking-tight">Professional Certificate #{index + 1}</h3>
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Certificate Title *</Label><Input value={item.title} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].title = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. AWS Solutions Architect" /></div>
                                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Issuing Organization *</Label><Input value={item.issuingOrg} onChange={(e) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].issuingOrg = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. Amazon, Coursera, Google" /></div>
                                                    {!isExisting && (
                                                        <div className="md:col-span-2 mt-4">
                                                            <Label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Upload Certificate Document *</Label>
                                                            <FileUpload value={item.certificateFile} onChange={(fid, fdata) => { const n = { ...certificates, items: [...certificates.items] }; n.items[index].certificateFile = fdata?.url || fid; setCertificates(n); }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Extracurricular Activities */}
                        {currentStep === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Highlight your achievements beyond academics.</p>
                                    <Button onClick={() => setExtracurricular({ ...extracurricular, items: [...extracurricular.items, { id: Date.now(), activityType: "", description: "", level: "", achievements: "" }] })} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add Activity
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {extracurricular.items.map((item, index) => (
                                        <div key={item.id} className="p-8 border-2 border-[#C0C0C0]/30 bg-[#C0C0C0]/5 relative">
                                            {extracurricular.items.length > 1 && (
                                                <button onClick={() => setExtracurricular({ ...extracurricular, items: extracurricular.items.filter(i => i.id !== item.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Activity Type</Label>
                                                    <select
                                                        value={item.activityType}
                                                        onChange={(e) => {
                                                            const n = [...extracurricular.items];
                                                            n[index].activityType = e.target.value;
                                                            setExtracurricular({ ...extracurricular, items: n });
                                                        }}
                                                        className={selectClass}
                                                    >
                                                        <option value="">Select Type</option>
                                                        <option value="Sports">Sports</option>
                                                        <option value="Arts">Arts</option>
                                                        <option value="Leadership">Leadership</option>
                                                        <option value="Volunteering">Volunteering</option>
                                                        <option value="Technical">Technical</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Level</Label>
                                                    <select
                                                        value={item.level}
                                                        onChange={(e) => {
                                                            const n = [...extracurricular.items];
                                                            n[index].level = e.target.value;
                                                            setExtracurricular({ ...extracurricular, items: n });
                                                        }}
                                                        className={selectClass}
                                                    >
                                                        <option value="">Select Level</option>
                                                        <option value="School">School</option>
                                                        <option value="College">College</option>
                                                        <option value="Zonal">Zonal</option>
                                                        <option value="District">District</option>
                                                        <option value="State">State</option>
                                                        <option value="National">National</option>
                                                        <option value="International">International</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Description</Label>
                                                    <Input value={item.description} onChange={(e) => {
                                                        const n = [...extracurricular.items];
                                                        n[index].description = e.target.value;
                                                        setExtracurricular({ ...extracurricular, items: n });
                                                    }} className={inputClass} placeholder="Briefly describe the activity" />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Achievements</Label>
                                                    <Input value={item.achievements} onChange={(e) => {
                                                        const n = [...extracurricular.items];
                                                        n[index].achievements = e.target.value;
                                                        setExtracurricular({ ...extracurricular, items: n });
                                                    }} className={inputClass} placeholder="e.g. Won 1st Prize, Captain of the team" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 6: Job Preferences */}
                        {currentStep === 6 && (
                            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Tell us about your career aspirations.</p>
                                    <Button onClick={() => setJobPreferences({ ...jobPreferences, items: [...jobPreferences.items, { id: Date.now(), preferredRole: "", jobType: "", preferredLocation1: "", preferredLocation2: "", preferredLocation3: "", willingToRelocate: "", expectedSalary: "" }] })} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add Preference
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {jobPreferences.items.map((item, index) => (
                                        <div key={item.id} className="p-8 border-2 border-[#C0C0C0]/30 bg-[#C0C0C0]/5 relative">
                                            {jobPreferences.items.length > 1 && (
                                                <button onClick={() => setJobPreferences({ ...jobPreferences, items: jobPreferences.items.filter(i => i.id !== item.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Role</Label>
                                                    <Input value={item.preferredRole} onChange={(e) => {
                                                        const n = [...jobPreferences.items];
                                                        n[index].preferredRole = e.target.value;
                                                        setJobPreferences({ ...jobPreferences, items: n });
                                                    }} className={inputClass} placeholder="e.g. Software Developer" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Job Type</Label>
                                                    <select
                                                        value={item.jobType}
                                                        onChange={(e) => {
                                                            const n = [...jobPreferences.items];
                                                            n[index].jobType = e.target.value;
                                                            setJobPreferences({ ...jobPreferences, items: n });
                                                        }}
                                                        className={selectClass}
                                                    >
                                                        <option value="">Select Type</option>
                                                        <option value="Full-time">Full-time</option>
                                                        <option value="Part-time">Part-time</option>
                                                        <option value="Internship">Internship</option>
                                                        <option value="Contract">Contract</option>
                                                        <option value="Remote">Remote</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Location</Label>
                                                    <Input value={item.preferredLocation1} onChange={(e) => {
                                                        const n = [...jobPreferences.items];
                                                        n[index].preferredLocation1 = e.target.value;
                                                        setJobPreferences({ ...jobPreferences, items: n });
                                                    }} className={inputClass} placeholder="e.g. Bangalore, Remote" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Expected Salary</Label>
                                                    <Input value={item.expectedSalary} onChange={(e) => {
                                                        const n = [...jobPreferences.items];
                                                        n[index].expectedSalary = e.target.value;
                                                        setJobPreferences({ ...jobPreferences, items: n });
                                                    }} className={inputClass} placeholder="e.g. 5-8 LPA" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 7: Sector Preferences */}
                        {currentStep === 7 && (
                            <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Which sectors interest you the most?</Label>
                                        <p className="text-xs text-slate-400 mb-4">Select up to 3 sectors you would like to work in.</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {excelData.sectors.map((sector) => (
                                                <div
                                                    key={sector}
                                                    onClick={() => {
                                                        const isSelected = sectorPreferences.preferredSectors.includes(sector);
                                                        if (isSelected) {
                                                            setSectorPreferences({ ...sectorPreferences, preferredSectors: sectorPreferences.preferredSectors.filter(s => s !== sector) });
                                                        } else if (sectorPreferences.preferredSectors.length < 3) {
                                                            setSectorPreferences({ ...sectorPreferences, preferredSectors: [...sectorPreferences.preferredSectors, sector] });
                                                        } else {
                                                            toast.info("You can select up to 3 preferred sectors");
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold text-center ${sectorPreferences.preferredSectors.includes(sector) ? 'border-[#1a3884] bg-[#1a3884]/5 text-[#1a3884]' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                                                >
                                                    {sector}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 8: Career Goals */}
                        {currentStep === 8 && (
                            <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Short Term Goal (1-2 years)</Label>
                                        <textarea value={careerGoals.shortTerm} onChange={(e) => setCareerGoals({ ...careerGoals, shortTerm: e.target.value })} className={textareaClass} rows={3} placeholder="What do you want to achieve in the next 1-2 years?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Medium Term Goal (3-5 years)</Label>
                                        <textarea value={careerGoals.mediumTerm} onChange={(e) => setCareerGoals({ ...careerGoals, mediumTerm: e.target.value })} className={textareaClass} rows={3} placeholder="What is your vision for the next 3-5 years?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Long Term Goal (5+ years)</Label>
                                        <textarea value={careerGoals.longTerm} onChange={(e) => setCareerGoals({ ...careerGoals, longTerm: e.target.value })} className={textareaClass} rows={3} placeholder="Where do you see yourself in the long run?" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 9: Work Experience */}
                        {currentStep === 9 && (
                            <motion.div key="step9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Add your previous work experience or internships.</p>
                                    <Button onClick={() => setWorkExperience({ ...workExperience, items: [...workExperience.items, { id: Date.now(), experienceType: "", organizationName: "", jobTitle: "", industry: "", startDate: "", endDate: "", currentlyWorking: false, description: "" }] })} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add Experience
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {workExperience.items.map((item, index) => (
                                        <div key={item.id} className="p-8 border-2 border-[#C0C0C0]/30 bg-[#C0C0C0]/5 relative">
                                            <button onClick={() => setWorkExperience({ ...workExperience, items: workExperience.items.filter(i => i.id !== item.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2">
                                                <Trash2 size={20} />
                                            </button>
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Organization Name</Label>
                                                    <Input value={item.organizationName} onChange={(e) => {
                                                        const n = [...workExperience.items];
                                                        n[index].organizationName = e.target.value;
                                                        setWorkExperience({ ...workExperience, items: n });
                                                    }} className={inputClass} placeholder="Company name" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Job Title</Label>
                                                    <Input value={item.jobTitle} onChange={(e) => {
                                                        const n = [...workExperience.items];
                                                        n[index].jobTitle = e.target.value;
                                                        setWorkExperience({ ...workExperience, items: n });
                                                    }} className={inputClass} placeholder="Role title" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</Label>
                                                    <Input type="date" value={item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ""} onChange={(e) => {
                                                        const n = [...workExperience.items];
                                                        n[index].startDate = e.target.value;
                                                        setWorkExperience({ ...workExperience, items: n });
                                                    }} className={inputClass} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">End Date</Label>
                                                    <Input type="date" value={item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ""} disabled={item.currentlyWorking} onChange={(e) => {
                                                        const n = [...workExperience.items];
                                                        n[index].endDate = e.target.value;
                                                        setWorkExperience({ ...workExperience, items: n });
                                                    }} className={inputClass} />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Description</Label>
                                                    <textarea value={item.description} onChange={(e) => {
                                                        const n = [...workExperience.items];
                                                        n[index].description = e.target.value;
                                                        setWorkExperience({ ...workExperience, items: n });
                                                    }} className={textareaClass} rows={3} placeholder="Key responsibilities and accomplishments" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 10: Projects */}
                        {currentStep === 10 && (
                            <motion.div key="step10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Showcase your technical projects or research work.</p>
                                    <Button onClick={() => setProjects({ ...projects, items: [...projects.items, { id: Date.now(), title: "", description: "", projectUrl: "", startDate: "", endDate: "" }] })} variant="outline" size="sm" className="gap-2 border-[#C0C0C0] text-[#C0C0C0] hover:bg-[#C0C0C0]/10 rounded-full px-4">
                                        <Plus size={16} /> Add Project
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                    {projects.items.map((item, index) => (
                                        <div key={item.id} className="p-8 border-2 border-[#C0C0C0]/30 bg-[#C0C0C0]/5 relative">
                                            <button onClick={() => setProjects({ ...projects, items: projects.items.filter(i => i.id !== item.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2">
                                                <Trash2 size={20} />
                                            </button>
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Project Title</Label>
                                                    <Input value={item.title} onChange={(e) => {
                                                        const n = [...projects.items];
                                                        n[index].title = e.target.value;
                                                        setProjects({ ...projects, items: n });
                                                    }} className={inputClass} placeholder="Name of your project" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Project URL</Label>
                                                    <Input value={item.projectUrl} onChange={(e) => {
                                                        const n = [...projects.items];
                                                        n[index].projectUrl = e.target.value;
                                                        setProjects({ ...projects, items: n });
                                                    }} className={inputClass} placeholder="GitHub link or live URL" />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Description</Label>
                                                    <textarea value={item.description} onChange={(e) => {
                                                        const n = [...projects.items];
                                                        n[index].description = e.target.value;
                                                        setProjects({ ...projects, items: n });
                                                    }} className={textareaClass} rows={3} placeholder="Briefly describe what the project does and your role in it" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 pt-8 flex justify-between items-center border-t-2 border-slate-50">
                        <Button
                            variant="ghost"
                            onClick={handlePrevStep}
                            disabled={currentStep === 0}
                            className="text-slate-400 hover:text-slate-700 font-sans disabled:opacity-0"
                        >
                            Previous
                        </Button>

                        <div className="flex gap-4">
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-[#1a3884] hover:bg-[#002147] text-white px-10 py-6 rounded-xl font-bold font-sans text-lg transition-all group"
                                >
                                    Next Section
                                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-[#C0C0C0] hover:bg-[#A8A8A8] text-white px-12 py-6 rounded-xl font-bold font-sans text-lg shadow-xl shadow-[#C0C0C0]/20 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving Changes...
                                        </div>
                                    ) : (
                                        "Complete & Save All New Details"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Visual Progress Bar */}
                <div className="mt-8 flex justify-between items-center px-4">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${idx <= currentStep ? 'bg-[#C0C0C0] border-[#C0C0C0] scale-125' : 'bg-white border-slate-200'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${idx === currentStep ? 'text-[#C0C0C0]' : 'text-slate-300'}`}>{step.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddDetails;


