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

    const [personalDetails, setPersonalDetails] = useState({ fullName: "", nickname: "", dob: "", gender: "", mobileNumber: "", email: "", institution: "", department: "", yearOfStudy: "", yearOfPassing: "", educationLevel: "", profilePhoto: null });
    const [tenthDetails, setTenthDetails] = useState({ schoolName: "", yearOfPassing: "", percentage: "", marksheet: null });
    const [twelfthDetails, setTwelfthDetails] = useState({ schoolName: "", stream: "", yearOfPassing: "", percentage: "", marksheet: null });
    const [higherEducation, setHigherEducation] = useState([{ id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }]);
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
                        setHigherEducation(regData.higherEducation.map(h => ({ ...h, id: h.id || Math.random() })));
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
        if (!existingData) return false;
        if (section === 'personal' && existingData[field]) return true;
        if (section === 'tenth' && existingData.tenthDetails?.[field]) return true;
        if (section === 'twelfth' && existingData.twelfthDetails?.[field]) return true;
        return false;
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
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

    const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#BC9B6A] focus:ring-0 px-0 py-2 text-base transition-all duration-300 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed";
    const selectClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#BC9B6A] focus:ring-0 px-0 py-2 text-base transition-all duration-300 appearance-none disabled:opacity-60 disabled:cursor-not-allowed";
    const textareaClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:border-[#BC9B6A] focus:ring-0 px-0 py-2 text-base transition-all duration-300 resize-none placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed";
    const yearOptions = Array.from({ length: 30 }, (_, i) => 2010 + i);

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1a3884]" />
                    <p className="font-serif italic text-slate-500">Loading your profile data...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex items-center justify-center flex-col p-6 text-center">
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
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-[#BC9B6A]/30 pb-12">
            <header className="bg-[#002147] text-white py-2 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-[100] shadow-md border-b-2 border-[#BC9B6A]">
                <div className="flex items-center gap-3">
                    <img src={logoWhite} alt="SMAART INSTITUTE" className="h-8 w-auto" />
                    <div className="h-8 w-[1px] bg-white/20 hidden md:block mx-2" />
                    <h1 className="text-xl md:text-2xl font-serif text-white/90">
                        {steps[currentStep].title}
                        <div className="h-[2px] w-1/2 bg-[#BC9B6A] mt-1 mx-auto md:mx-0" />
                    </h1>
                </div>
                <div className="hidden sm:block">
                    <p className="text-sm font-serif italic text-white/80 tracking-wide">"Enhance Your Profile, Unlock Opportunities!"</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto py-10 px-4 relative">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] border-2 border-[#BC9B6A] relative flex flex-col min-h-[600px]">
                    
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
                                         {!existingData?.profilePhoto && (
                                             <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#1a3884] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
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
                                         )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg">Your Profile Picture</h3>
                                        <p className="text-sm text-slate-500">This photo will be visible to potential employers and on your certificates.</p>
                                    </div>
                                    {existingData?.profilePhoto && (
                                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 text-left">
                                            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-amber-700 font-medium">To change your primary profile photo, please visit the main Profile page settings.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Personal Details */}
                        {currentStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1">
                                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Full Name</Label>
                                        <Input value={personalDetails.fullName} disabled={isFieldDisabled('personal', 'fullName')} className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nick Name</Label>
                                        <Input value={personalDetails.nickname} onChange={(e) => setPersonalDetails({ ...personalDetails, nickname: e.target.value })} disabled={isFieldDisabled('personal', 'nickname')} className={inputClass} placeholder="Enter your nickname" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Date of Birth</Label>
                                        <Input type="date" value={personalDetails.dob} disabled={isFieldDisabled('personal', 'dob')} className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gender</Label>
                                        <select value={personalDetails.gender} disabled={isFieldDisabled('personal', 'gender')} className={selectClass}>
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Education Level</Label>
                                        <Input value={personalDetails.educationLevel} disabled={isFieldDisabled('personal', 'educationLevel')} className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Mobile Number</Label>
                                        <Input value={personalDetails.mobileNumber} disabled={isFieldDisabled('personal', 'mobileNumber')} className={inputClass} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Higher Education */}
                        {currentStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">Add multiple degrees or diplomas you have completed or are pursuing.</p>
                                    <Button onClick={() => setHigherEducation([...higherEducation, { id: Date.now(), qualificationLevel: "", degree: "", specialization: "", institutionName: "", university: "", yearOfPassing: "", cgpaPercentage: "", degreeStatus: "", certificate: null }])} variant="outline" size="sm" className="gap-2 border-[#BC9B6A] text-[#BC9B6A] hover:bg-[#BC9B6A]/10 rounded-full px-4">
                                        <Plus size={16} /> Add New Degree
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                {higherEducation.map((item, index) => {
                                    const isExisting = index < (existingData?.higherEducation?.length || 0);
                                    return (
                                        <div key={item.id} className={`p-8 border-2 ${isExisting ? 'border-slate-100 bg-slate-50/30' : 'border-[#BC9B6A]/30 bg-[#BC9B6A]/5 shadow-sm'} relative transition-all duration-300`}>
                                            {!isExisting && <button onClick={() => setHigherEducation(higherEducation.filter(h => h.id !== item.id))} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>}
                                            <div className="flex items-center gap-2 mb-6">
                                                <GraduationCap className={`w-5 h-5 ${isExisting ? 'text-slate-400' : 'text-[#BC9B6A]'}`} />
                                                <h3 className="font-bold text-slate-800 tracking-tight">Academic Record #{index + 1} {isExisting && <span className="ml-3 text-[9px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Saved</span>}</h3>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Degree / Qualification *</Label><Input value={item.degree} disabled={isExisting} onChange={(e) => { const n = [...higherEducation]; n[index].degree = e.target.value; setHigherEducation(n); }} className={inputClass} placeholder="e.g. B.Tech Computer Science" /></div>
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Institution / College *</Label><Input value={item.institutionName} disabled={isExisting} onChange={(e) => { const n = [...higherEducation]; n[index].institutionName = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Year of Passing *</Label><select value={item.yearOfPassing} disabled={isExisting} onChange={(e) => { const n = [...higherEducation]; n[index].yearOfPassing = e.target.value; setHigherEducation(n); }} className={selectClass}><option value="">Select Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">CGPA / Percentage *</Label><Input value={item.cgpaPercentage} disabled={isExisting} onChange={(e) => { const n = [...higherEducation]; n[index].cgpaPercentage = e.target.value; setHigherEducation(n); }} className={inputClass} /></div>
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
                                    <Button onClick={() => setCertificates({...certificates, items: [...certificates.items, { id: Date.now(), title: "", issuingOrg: "", certificateFile: null, yearOfCompletion: "", verificationType: "", verificationUrl: "" }]})} variant="outline" size="sm" className="gap-2 border-[#BC9B6A] text-[#BC9B6A] hover:bg-[#BC9B6A]/10 rounded-full px-4">
                                        <Plus size={16} /> Add New Certificate
                                    </Button>
                                </div>
                                <div className="space-y-8">
                                {certificates.items.map((item, index) => {
                                    const isExisting = index < (existingData?.certificates?.length || 0);
                                    return (
                                        <div key={item.id} className={`p-8 border-2 ${isExisting ? 'border-slate-100 bg-slate-50/30' : 'border-[#BC9B6A]/30 bg-[#BC9B6A]/5 shadow-sm'} relative transition-all duration-300`}>
                                            {!isExisting && <button onClick={() => setCertificates({...certificates, items: certificates.items.filter(c => c.id !== item.id)})} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>}
                                            <div className="flex items-center gap-2 mb-6">
                                                <Award className={`w-5 h-5 ${isExisting ? 'text-slate-400' : 'text-[#BC9B6A]'}`} />
                                                <h3 className="font-bold text-slate-800 tracking-tight">Professional Certificate #{index + 1}</h3>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Certificate Title *</Label><Input value={item.title} disabled={isExisting} onChange={(e) => { const n = {...certificates, items: [...certificates.items]}; n.items[index].title = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. AWS Solutions Architect" /></div>
                                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Issuing Organization *</Label><Input value={item.issuingOrg} disabled={isExisting} onChange={(e) => { const n = {...certificates, items: [...certificates.items]}; n.items[index].issuingOrg = e.target.value; setCertificates(n); }} className={inputClass} placeholder="e.g. Amazon, Coursera, Google" /></div>
                                                {!isExisting && (
                                                    <div className="md:col-span-2 mt-4">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Upload Certificate Document *</Label>
                                                        <FileUpload value={item.certificateFile} onChange={(fid, fdata) => { const n = {...certificates, items: [...certificates.items]}; n.items[index].certificateFile = fdata?.url || fid; setCertificates(n); }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </motion.div>
                        )}

                        {/* Generic Section Template for others */}
                        {![0, 1, 4, 11].includes(currentStep) && (
                             <motion.div key="generic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-8 flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <FolderOpen className="w-10 h-10 text-slate-200" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[currentStep].title} Section</h3>
                                    <p className="text-slate-500 leading-relaxed">Verified and previously submitted data in this section cannot be altered. If you've gained new experience or finished new projects, you can add them here.</p>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl max-w-sm flex gap-3 text-left">
                                     <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                     <p className="text-[11px] text-amber-700 leading-normal font-medium">To add new entries to this section, please use the specific 'Add New' buttons provided in relevant tabs. This ensures your verified history remains intact.</p>
                                </div>
                             </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 pt-8 flex justify-between items-center border-t-2 border-slate-50">
                        <Button
                            variant="ghost"
                            onClick={handlePrevStep}
                            disabled={currentStep === 0}
                            className="text-slate-400 hover:text-slate-700 font-serif disabled:opacity-0"
                        >
                            Previous
                        </Button>
                        
                        <div className="flex gap-4">
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-[#1a3884] hover:bg-[#002147] text-white px-10 py-6 rounded-none font-bold font-serif text-lg transition-all group"
                                >
                                    Next Section
                                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-[#BC9B6A] hover:bg-[#a68a5c] text-white px-12 py-6 rounded-none font-bold font-serif text-lg shadow-xl shadow-[#BC9B6A]/20 disabled:opacity-70"
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
                            <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${idx <= currentStep ? 'bg-[#BC9B6A] border-[#BC9B6A] scale-125' : 'bg-white border-slate-200'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${idx === currentStep ? 'text-[#BC9B6A]' : 'text-slate-300'}`}>{step.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddDetails;
