import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import {
  IconCalculator,
  IconTrash,
  IconHistory,
  IconPlus,
  IconArrowLeft,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconEraser,
  IconInfoCircle,
  IconSettings,
  IconClipboardList,
  IconLoader2,
  IconDownload,
  IconTarget,
  IconChartLine
} from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import NeuralBackground from '@/components/ui/NeuralBackground';
import PageTransition from '@/components/PageTransition';

// --- CONFIG & CONSTANTS ---
const GRADE_MAPPING = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5 };
const FAIL_GRADES = ["RA", "SA", "AB", "W", "U", "F"];

const METHODS = [
  { id: "slab", name: "Slab-Based Method", badge: "Anna University" },
  { id: "continuous", name: "Continuous Method", badge: "Madras University" },
  { id: "equal", name: "Equal-Credit Method", badge: "Autonomous Colleges" },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const getEmptySubjects = () => [
  { id: Date.now() + 1, code: "", name: "", input: "", credits: "" },
  { id: Date.now() + 2, code: "", name: "", input: "", credits: "" },
  { id: Date.now() + 3, code: "", name: "", input: "", credits: "" },
  { id: Date.now() + 4, code: "", name: "", input: "", credits: "" },
];

export default function CGPACalculator() {
  const navigate = useNavigate();

  // The constellation canvas paints from a prop, not CSS, so it has to be
  // told when the dark class flips -- same observer the dashboard uses.
  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // --- STATE ---
  const [activeMethod, setActiveMethod] = useState("slab");
  const [activeSemester, setActiveSemester] = useState(1);
  
  // Data structure: { 1: [subjects], 2: [subjects], ... }
  const [semestersData, setSemestersData] = useState({
    1: getEmptySubjects()
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Configure Points (Slab-Based / Anna University method) -- session-only,
  // resets to these defaults on reload.
  const [showGradeConfigModal, setShowGradeConfigModal] = useState(false);
  const [gradeMapping, setGradeMapping] = useState(
    Object.entries(GRADE_MAPPING).map(([grade, points], i) => ({ id: i, grade, points }))
  );
  const [failGrades, setFailGrades] = useState([...FAIL_GRADES]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [targetGoal, setTargetGoal] = useState({
    active: false,
    targetCGPA: "",
    totalDegreeUnits: "",
  });

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      const printDiv = document.createElement('div');
      printDiv.style.position = 'absolute';
      printDiv.style.left = '-9999px';
      printDiv.style.top = '0';
      printDiv.style.width = '800px';
      printDiv.style.backgroundColor = '#ffffff';
      printDiv.style.padding = '40px';
      printDiv.style.fontFamily = "'Cambria', 'Times New Roman', serif";
      printDiv.style.color = '#0a192f';
      
      const methodNames = {
        slab: "Slab-Based Method (Anna University)",
        continuous: "Continuous Method (Madras University)",
        equal: "Equal-Credit Method (Autonomous)"
      };

      const tableRows = calculation?.rows?.map((row, index) => {
        const activeInput = activeMethod === "slab" 
          ? (row.inputSlab !== undefined ? row.inputSlab : row.input) 
          : (row.inputNumeric !== undefined ? row.inputNumeric : row.input);
        
        const isEven = index % 2 === 0;
        const rowBg = isEven ? '#ffffff' : '#f8fafc';
        
        // Coloring the grade to make it stand out
        let gradeColor = '#0a192f';
        let gradeBg = '#f1f5f9';
        if (activeMethod === "slab") {
          const grade = (activeInput || "").toString().trim().toUpperCase();
          if (["O", "A+", "A"].includes(grade)) {
            gradeColor = '#166534';
            gradeBg = '#dcfce7';
          } else if (["B+", "B", "C"].includes(grade)) {
            gradeColor = '#854d0e';
            gradeBg = '#fef08a';
          } else if (["RA", "SA", "AB", "W", "U", "F"].includes(grade)) {
            gradeColor = '#991b1b';
            gradeBg = '#fee2e2';
          }
        }
        
        return `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 16px 24px; font-weight: 600; color: #1e293b; font-size: 13px; letter-spacing: 0.5px;">${row.code || '-'}</td>
            <td style="padding: 16px 24px; color: #0a192f; font-size: 14px; font-weight: 600;">${row.name || '-'}</td>
            <td style="padding: 16px 24px; text-align: center; vertical-align: middle;">
              <div style="display: flex; justify-content: center; align-items: center;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: ${gradeColor}; background-color: ${gradeBg}; min-width: 40px; text-align: center;">${activeInput || '-'}</span>
              </div>
            </td>
            <td style="padding: 16px 24px; color: #475569; text-align: center; font-weight: 600; font-size: 14px;">${activeMethod === "equal" ? "-" : row.credits || "-"}</td>
          </tr>
        `;
      }).join('') || '';

      printDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #0a192f; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">SMAART <span style="color: #1e3a8a;">INSTITUTE</span></h1>
          <h2 style="color: #475569; margin: 12px 0 0 0; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">CGPA Report</h2>
          <p style="color: #64748b; margin: 12px 0 0 0; font-size: 14px; font-weight: 500;">Methodology: <strong style="color: #1e293b;">${methodNames[activeMethod]}</strong></p>
        </div>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 18px 24px; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Subject Code</th>
                <th style="padding: 18px 24px; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Subject Name</th>
                <th style="padding: 18px 24px; text-align: center; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">${activeMethod === "slab" ? "Grade" : "Marks / GP"}</th>
                <th style="padding: 18px 24px; text-align: center; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Credits</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="flex: 1; text-align: center;">
            <p style="margin: 0; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Semester ${activeSemester} SGPA</p>
            <p style="margin: 12px 0 0 0; color: #0a192f; font-size: 32px; font-weight: 900;">${calculation?.sgpa?.toFixed(2) || '0.00'}</p>
          </div>
          <div style="flex: 1; text-align: center; border-left: 2px solid #e2e8f0; border-right: 2px solid #e2e8f0; padding: 0 20px;">
            <p style="margin: 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Cumulative CGPA</p>
            <p style="margin: 12px 0 0 0; color: #1e3a8a; font-size: 42px; font-weight: 900; line-height: 1;">${calculation?.cgpa?.toFixed(2) || '0.00'}<span style="font-size: 20px; color: #64748b; font-weight: 700;">/10</span></p>
          </div>
          <div style="flex: 1; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Estimated Percentage</p>
            <p style="margin: 12px 0 0 0; color: #16a34a; font-size: 32px; font-weight: 900;">${calculation?.percentage || '0'}%</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Document generated automatically by <strong>SMAART Institute AI Engine</strong>.</p>
          <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 11px;">This is a system-generated report and does not require a signature.</p>
        </div>
      `;

      document.body.appendChild(printDiv);
      
      const canvas = await html2canvas(printDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate width and height in mm
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Use dynamic height so it fits on one page no matter how long
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, Math.max(297, pdfHeight)] // at least A4 height
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('SMAART_CGPA_Report.pdf');
      
      document.body.removeChild(printDiv);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("smaart_cgpa_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse CGPA history", e);
      }
    }

    const fetchCgpaFromDB = async () => {
      try {
        const response = await apiCall('/cgpa');
        if (response.success && response.data) {
          if (response.data.semestersData && Object.keys(response.data.semestersData).length > 0) {
            setSemestersData(response.data.semestersData);
          }
          if (response.data.activeMethod && METHODS.some((m) => m.id === response.data.activeMethod)) {
            setActiveMethod(response.data.activeMethod);
          }
        }
      } catch (error) {
        console.error("Failed to load CGPA from DB:", error);
      }
    };
    
    fetchCgpaFromDB();
  }, []);

  // Ensure current semester has data array
  useEffect(() => {
    if (!semestersData[activeSemester]) {
      setSemestersData(prev => ({ ...prev, [activeSemester]: getEmptySubjects() }));
    }
  }, [activeSemester, semestersData]);

  const currentSubjects = semestersData[activeSemester] || [];

  // Live grade->points lookup built from the (editable) Configure Points rows
  const gradeMappingObj = useMemo(() => (
    Object.fromEntries(
      gradeMapping
        .filter((row) => row.grade.trim())
        .map((row) => [row.grade.trim().toUpperCase(), parseFloat(row.points) || 0])
    )
  ), [gradeMapping]);

  // --- CALCULATION ENGINE ---
  const calculation = useMemo(() => {
    let allValidSubjects = [];
    let currentSemValidSubjects = [];

    // Collect all valid subjects across all semesters
    Object.entries(semestersData).forEach(([semString, subjects]) => {
      const valid = subjects.filter((s) => {
        const activeInput = activeMethod === "slab" 
          ? (s.inputSlab !== undefined ? s.inputSlab : s.input) 
          : (s.inputNumeric !== undefined ? s.inputNumeric : s.input);
        return (activeInput || "").toString().trim() !== "";
      });
      allValidSubjects.push(...valid);
      if (parseInt(semString) === activeSemester) {
        currentSemValidSubjects = valid;
      }
    });

    if (allValidSubjects.length === 0) return null;

    let isPending = false;
    let failedSet = new Set();

    const processSubjects = (subjectList) => {
      return subjectList.map((subject) => {
        const activeInput = activeMethod === "slab" 
          ? (subject.inputSlab !== undefined ? subject.inputSlab : subject.input) 
          : (subject.inputNumeric !== undefined ? subject.inputNumeric : subject.input);
          
        const rawInput = (activeInput || "").toString().toUpperCase().trim();
        let gp = 0;
        let credits = parseFloat(subject.credits) || 1;

        if (gradeMappingObj[rawInput] !== undefined) {
          if (activeMethod !== "slab") {
            gp = 0;
            isPending = true;
            failedSet.add(`${subject.name || "Subject"} (Requires Numbers)`);
          } else {
            gp = gradeMappingObj[rawInput];
          }
        } else if (failGrades.includes(rawInput) || parseFloat(rawInput) === 0) {
          gp = 0;
          isPending = true;
          failedSet.add(subject.name || "Unnamed Subject");
        } else {
          gp = parseFloat(rawInput);
          if (isNaN(gp)) gp = 0;
          if (gp > 10) gp = gp / 10; // Normalize marks out of 100 to 10-point scale
          if (gp < 5 && gp > 0) {
            isPending = true;
            failedSet.add(subject.name || "Unnamed Subject");
          }
        }

        return { ...subject, parsedGP: gp, creditGP: credits * gp };
      });
    };

    const processedAll = processSubjects(allValidSubjects);
    const processedCurrent = processSubjects(currentSemValidSubjects);

    if (isPending) {
      return { isPending: true, failedSubjects: Array.from(failedSet), rows: processedCurrent };
    }

    const computeStats = (processedRows) => {
      let gpa = 0, totalPoints = 0, totalCredits = 0, count = processedRows.length;
      if (count === 0) return { gpa, totalPoints, totalCredits, count };
      if (activeMethod === "equal") {
        totalPoints = processedRows.reduce((sum, row) => sum + row.parsedGP, 0);
        totalCredits = count; // using count as units
        gpa = totalPoints / count;
      } else {
        totalPoints = processedRows.reduce((sum, row) => sum + row.creditGP, 0);
        totalCredits = processedRows.reduce((sum, row) => sum + (parseFloat(row.credits) || 1), 0);
        gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
      }
      return { gpa, totalPoints, totalCredits, count };
    };

    const statsAll = computeStats(processedAll);
    const statsCurrent = computeStats(processedCurrent);

    return {
      isPending: false,
      cgpa: Math.round(statsAll.gpa * 100) / 100,
      sgpa: Math.round(statsCurrent.gpa * 100) / 100,
      percentage: Math.round(statsAll.gpa * 10 * 10) / 10,
      totalPoints: statsAll.totalPoints,
      totalCredits: statsAll.totalCredits,
      totalSubjects: statsAll.count,
      rows: processedCurrent,
    };
  }, [semestersData, activeMethod, activeSemester, gradeMappingObj, failGrades]);

  const trendData = useMemo(() => {
    let trends = [];
    Object.entries(semestersData).forEach(([semString, subjects]) => {
      const valid = subjects.filter((s) => {
        const activeInput = activeMethod === "slab" 
          ? (s.inputSlab !== undefined ? s.inputSlab : s.input) 
          : (s.inputNumeric !== undefined ? s.inputNumeric : s.input);
        return (activeInput || "").toString().trim() !== "";
      });
      if (valid.length > 0) {
        let totalPoints = 0;
        let totalCredits = 0;
        let count = valid.length;
        
        valid.forEach(subject => {
          const activeInput = activeMethod === "slab" 
            ? (subject.inputSlab !== undefined ? subject.inputSlab : subject.input) 
            : (subject.inputNumeric !== undefined ? subject.inputNumeric : subject.input);
          const rawInput = (activeInput || "").toString().toUpperCase().trim();
          let gp = 0;
          let credits = parseFloat(subject.credits) || 1;

          if (gradeMappingObj[rawInput] !== undefined) {
             gp = activeMethod === "slab" ? gradeMappingObj[rawInput] : 0;
          } else if (!failGrades.includes(rawInput) && parseFloat(rawInput) > 0) {
             gp = parseFloat(rawInput);
             if (gp > 10) gp = gp / 10;
          }

          if (activeMethod === "equal") {
            totalPoints += gp;
            totalCredits = count;
          } else {
            totalPoints += (gp * credits);
            totalCredits += credits;
          }
        });
        
        const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
        trends.push({
          semester: `Sem ${semString}`,
          sgpa: Math.round(sgpa * 100) / 100,
        });
      }
    });
    return trends.sort((a, b) => parseInt(a.semester.split(" ")[1]) - parseInt(b.semester.split(" ")[1]));
  }, [semestersData, activeMethod, gradeMappingObj, failGrades]);

  // --- HANDLERS ---
  const handleAddSubject = () => {
    setSemestersData(prev => ({
      ...prev,
      [activeSemester]: [...prev[activeSemester], { id: Date.now(), code: "", name: "", input: "", credits: "" }]
    }));
  };

  const handleRemoveSubject = (id) => {
    setSemestersData(prev => ({
      ...prev,
      [activeSemester]: prev[activeSemester].filter((s) => s.id !== id)
    }));
  };

  const handleSubjectChange = (id, field, value) => {
    setSemestersData(prev => ({
      ...prev,
      [activeSemester]: prev[activeSemester].map((s) => (s.id === id ? { ...s, [field]: value } : s))
    }));
  };

  const handleClearSemester = () => {
    setSemestersData(prev => ({
      ...prev,
      [activeSemester]: getEmptySubjects()
    }));
  };

  // Deterministic paste parser -- every line must be "Code | Name | Credits | Grade",
  // so a malformed line is reported and nothing is applied, rather than guessing.
  const handleParseSubjects = () => {
    const lines = pasteText.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length === 0) {
      setPasteError("Paste at least one subject line first.");
      return;
    }

    const errors = [];
    const parsedSubjects = [];

    lines.forEach((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length !== 4) {
        errors.push(`Line ${index + 1}: expected 4 columns (Code | Name | Credits | Grade), found ${parts.length}.`);
        return;
      }

      const [code, name, creditsRaw, gradeRaw] = parts;
      const credits = parseFloat(creditsRaw);

      if (!code) {
        errors.push(`Line ${index + 1}: subject code is missing.`);
      } else if (!name) {
        errors.push(`Line ${index + 1}: subject name is missing.`);
      } else if (isNaN(credits) || credits <= 0) {
        errors.push(`Line ${index + 1}: credits must be a number greater than 0.`);
      } else if (!gradeRaw) {
        errors.push(`Line ${index + 1}: grade is missing.`);
      } else {
        const grade = gradeRaw.toUpperCase();
        parsedSubjects.push({
          id: Date.now() + Math.random(),
          code: code.toUpperCase(),
          name,
          credits: creditsRaw,
          input: grade,
          inputSlab: grade,
          inputNumeric: grade,
        });
      }
    });

    if (errors.length > 0) {
      setPasteError(errors.slice(0, 4).join("  "));
      return;
    }

    while (parsedSubjects.length < 4) {
      parsedSubjects.push({ id: Date.now() + Math.random(), code: "", name: "", input: "", inputSlab: "", inputNumeric: "", credits: "" });
    }

    setSemestersData((prev) => ({
      ...prev,
      [activeSemester]: parsedSubjects,
    }));
    setShowPasteModal(false);
    setPasteText("");
    setPasteError("");
  };

  // --- CONFIGURE POINTS (Grade Mapping) HANDLERS ---
  const updateGradeRow = (id, field, value) => {
    setGradeMapping((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addGradeRow = () => {
    setGradeMapping((prev) => [...prev, { id: Date.now(), grade: "", points: 0 }]);
  };

  const removeGradeRow = (id) => {
    setGradeMapping((prev) => prev.filter((row) => row.id !== id));
  };

  const updateFailGrade = (index, value) => {
    setFailGrades((prev) => prev.map((g, i) => (i === index ? value : g)));
  };

  const addFailGrade = () => {
    setFailGrades((prev) => [...prev, ""]);
  };

  const removeFailGrade = (index) => {
    setFailGrades((prev) => prev.filter((_, i) => i !== index));
  };

  const resetGradeMapping = () => {
    setGradeMapping(Object.entries(GRADE_MAPPING).map(([grade, points], i) => ({ id: i, grade, points })));
    setFailGrades([...FAIL_GRADES]);
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("smaart_cgpa_history", JSON.stringify(newHistory));
  };

  const handleSaveResult = async () => {
    if (!calculation || calculation.isPending) return;
    
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      method: METHODS.find((m) => m.id === activeMethod)?.name,
      cgpa: calculation.cgpa,
      percentage: calculation.percentage,
      semestersData: semestersData, // save the whole structure
    };
    const newHistory = [newEntry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("smaart_cgpa_history", JSON.stringify(newHistory));

    // Auto-sync to profile
    setIsSyncing(true);
    try {
      await apiCall('/cgpa/save', {
        method: 'POST',
        body: JSON.stringify({
          activeMethod,
          semestersData,
          cgpa: calculation.cgpa,
          percentage: calculation.percentage,
          totalPoints: calculation.totalPoints,
          totalCredits: calculation.totalCredits,
          totalSubjects: calculation.totalSubjects
        })
      });
    } catch (error) {
      console.error("Failed to auto-sync profile:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadHistoryItem = (item) => {
    setSemestersData(item.semestersData);
    const methodObj = METHODS.find((m) => m.name === item.method);
    if (methodObj) setActiveMethod(methodObj.id);
    setShowHistory(false);
  };

  return (
    <PageTransition>
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-12 font-sans transition-colors duration-300">
      {/* Same ambient layer as the dashboard, courses, assessments,
          dictionary, notes and toolkit pages */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
        {/* Header & Back Button */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard/smaart-toolkit")}
            className="group flex items-center gap-3 w-fit"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
              <IconArrowLeft stroke={1.5} className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
              Back to Toolkit
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to start a new calculation? Current data will be cleared.")) {
                  setSemestersData({ 1: getEmptySubjects() });
                  setActiveSemester(1);
                  setPasteText("");
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-white px-3 sm:px-4 py-2 text-[12px] font-bold text-[#072036] shadow-sm transition-colors hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-200 dark:hover:bg-[#0d3a5f]/70"
            >
              <IconPlus size={16} stroke={2.5} />
              <span className="hidden sm:inline">New Calculation</span>
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#045C9A]/25 bg-[#EAF7FD] px-3 sm:px-4 py-2 text-[12px] font-bold text-[#045C9A] shadow-sm transition-colors hover:bg-[#045C9A] hover:text-white dark:border-white/15 dark:bg-white/[0.06] dark:text-[#A6D7E8] dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
            >
              <IconInfoCircle size={16} />
              <span className="hidden sm:inline">How it works</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-white px-3 sm:px-4 py-2 text-[12px] font-bold text-[#072036] shadow-sm transition-colors hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-200 dark:hover:bg-[#0d3a5f]/70"
            >
              <IconHistory size={16} />
              <span className="hidden sm:inline">View History</span>
            </button>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mb-6 w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

          <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
            {/* Left Content */}
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                <IconCalculator stroke={1.75} className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  CGPA Calculator
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                  Compare your CGPA across grading methods, or paste your result table to fill it in automatically.
                </p>
              </div>
            </div>

            {/* Paste Results */}
            <button
              onClick={() => setShowPasteModal(true)}
              className="group flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0E2136] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1b3457] active:scale-[0.98] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
            >
              <IconClipboardList size={16} stroke={2} />
              Paste Results
              <IconChevronRight size={16} stroke={2} className="opacity-70 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.section>

        {/* --- METHOD SELECTOR --- */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Calculation Method
          </p>
          {activeMethod === "slab" && (
            <button
              onClick={() => setShowGradeConfigModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-white px-3 py-1.5 text-xs font-semibold text-[#045C9A] shadow-sm transition-colors hover:bg-[#EAF7FD] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-[#A6D7E8] dark:hover:bg-white/5"
            >
              <IconSettings size={14} />
              Configure Points
            </button>
          )}
        </div>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {METHODS.map((method) => {
            const isActive = activeMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setActiveMethod(method.id)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors duration-300 ${
                  isActive
                    ? "border-[#045C9A] bg-[#EAF7FD] dark:border-[#A6D7E8]/50 dark:bg-[#045C9A]/20"
                    : "border-[#d7ebf5] bg-white hover:border-[#045C9A]/30 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:hover:border-white/20"
                }`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-bold ${isActive ? "text-[#045C9A] dark:text-[#A6D7E8]" : "text-[#072036] dark:text-slate-200"}`}>
                    {method.name}
                  </p>
                  <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wider ${isActive ? "text-[#045C9A]/70 dark:text-[#A6D7E8]/70" : "text-slate-400 dark:text-slate-500"}`}>
                    {method.badge}
                  </p>
                </div>
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                    isActive
                      ? "border-[#045C9A] bg-[#045C9A] dark:border-[#A6D7E8] dark:bg-[#A6D7E8]"
                      : "border-slate-300 dark:border-white/20"
                  }`}
                >
                  {isActive && <IconCheck size={12} stroke={3} className="text-white dark:text-[#072036]" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* --- INPUT PANEL --- */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#d7ebf5] bg-white p-6 shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]">
              
              {/* Semester Dropdown */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#045C9A]/20">
                <div>
                  <h3 className="text-sm font-bold text-[#072036] dark:text-white">Semester Details</h3>
                  <p className="text-[11px] text-slate-400">Switch semesters to add cumulative data</p>
                </div>
                <div className="relative">
                  <select
                    value={activeSemester}
                    onChange={(e) => setActiveSemester(parseInt(e.target.value))}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-bold text-[#045C9A] outline-none focus:border-[#045C9A] focus:ring-1 focus:ring-[#045C9A] dark:border-slate-700 dark:bg-[#072036] dark:text-blue-400"
                  >
                    {SEMESTERS.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                  <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#045C9A] dark:text-blue-400" />
                </div>
              </div>

              {/* Subject Table */}
              <div className="overflow-hidden rounded-2xl border border-[#d7ebf5] dark:border-white/10">
                <div className="grid grid-cols-12 gap-2 bg-[#F1F5F9] px-3 py-2.5 dark:bg-[#072036]">
                  <div className={`text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${activeMethod === "equal" ? "col-span-3" : "col-span-2"}`}>Code</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${activeMethod === "equal" ? "col-span-5" : "col-span-4"}`}>Subject Name</div>
                  <div className="col-span-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {activeMethod === "slab" ? "Grade / GP" : "Marks / GP"}
                  </div>
                  {activeMethod !== "equal" && (
                    <div className="col-span-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Credits
                    </div>
                  )}
                  <div className="col-span-1"></div>
                </div>

                <AnimatePresence mode="popLayout">
                  {currentSubjects.map((subject, idx) => {
                    const subjectPlaceholders = [
                      { code: "CS8391", name: "Data Structures",        grade: "O",   credits: "4" },
                      { code: "MA8351", name: "Discrete Mathematics",   grade: "A+",  credits: "4" },
                      { code: "EC8395", name: "Communication Engg.",    grade: "A",   credits: "3" },
                      { code: "CS8392", name: "Object Oriented Prog.",  grade: "B+",  credits: "3" },
                      { code: "CS8381", name: "DS Laboratory",          grade: "8.5", credits: "2" },
                      { code: "CS8451", name: "Design & Analysis",      grade: "9.0", credits: "3" },
                      { code: "IT8451", name: "Embedded Systems",       grade: "O",   credits: "3" },
                      { code: "CS8493", name: "Operating Systems",      grade: "A+",  credits: "4" },
                    ];
                    const ph = subjectPlaceholders[idx % subjectPlaceholders.length];
                    const isLast = idx === currentSubjects.length - 1;
                    return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`group grid grid-cols-12 gap-2 items-center px-3 py-2 transition-colors hover:bg-[#F1F5F9] dark:hover:bg-white/5 ${isLast ? "" : "border-b border-[#d7ebf5] dark:border-white/10"}`}
                    >
                      <div className={activeMethod === "equal" ? "col-span-3" : "col-span-2"}>
                        <input
                          type="text"
                          title={subject.code || ""}
                          value={subject.code || ""}
                          onChange={(e) => handleSubjectChange(subject.id, "code", e.target.value.toUpperCase())}
                          placeholder={ph.code}
                          className="w-full rounded-lg border border-[#d7ebf5] bg-white px-2 py-1.5 text-[12px] font-bold tracking-wide text-[#045C9A] text-ellipsis placeholder:font-medium placeholder:text-slate-400 focus:border-[#045C9A] focus:outline-none focus:ring-1 focus:ring-[#045C9A] dark:border-white/10 dark:bg-[#072036] dark:text-[#A6D7E8] dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div className={activeMethod === "equal" ? "col-span-5" : "col-span-4"}>
                        <input
                          type="text"
                          title={subject.name || ""}
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(subject.id, "name", e.target.value)}
                          placeholder={ph.name}
                          className="w-full rounded-lg border border-[#d7ebf5] bg-white px-2 py-1.5 text-[13px] font-semibold text-[#072036] text-ellipsis placeholder:font-medium placeholder:text-slate-400 focus:border-[#045C9A] focus:outline-none focus:ring-1 focus:ring-[#045C9A] dark:border-white/10 dark:bg-[#072036] dark:text-white dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          inputMode={activeMethod === "slab" ? "text" : "numeric"}
                          value={activeMethod === "slab"
                            ? (subject.inputSlab !== undefined ? subject.inputSlab : (subject.input || ""))
                            : (subject.inputNumeric !== undefined ? subject.inputNumeric : (subject.input || ""))}
                          onChange={(e) => handleSubjectChange(subject.id, activeMethod === "slab" ? "inputSlab" : "inputNumeric", e.target.value)}
                          placeholder={activeMethod === "slab" ? ph.grade : (ph.grade === "O" ? "95" : ph.grade === "A+" ? "85" : "75")}
                          className="w-full text-center rounded-lg border border-[#d7ebf5] bg-white px-2 py-1.5 text-[13px] font-bold text-[#045C9A] uppercase placeholder:font-medium placeholder:text-slate-400 focus:border-[#045C9A] focus:outline-none focus:ring-1 focus:ring-[#045C9A] dark:border-white/10 dark:bg-[#072036] dark:text-[#A6D7E8] dark:placeholder:text-slate-500"
                        />
                      </div>
                      {activeMethod !== "equal" && (
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={subject.credits}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || parseFloat(val) >= 0) {
                                handleSubjectChange(subject.id, "credits", val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder={ph.credits}
                            className="w-full text-center rounded-lg border border-[#d7ebf5] bg-white px-2 py-1.5 text-[13px] font-bold text-[#072036] placeholder:font-medium placeholder:text-slate-400 focus:border-[#045C9A] focus:outline-none focus:ring-1 focus:ring-[#045C9A] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#072036] dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-white/5"
                          />
                        </div>
                      )}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => handleRemoveSubject(subject.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleAddSubject}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-4 text-sm font-semibold text-slate-500 transition-colors hover:border-[#045C9A] hover:bg-blue-50 hover:text-[#045C9A] dark:border-slate-700 dark:bg-[#072036]/50 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-[#0d3a5f] dark:hover:text-blue-400"
                >
                  <IconPlus size={16} /> Add Subject
                </button>
                <button
                  onClick={handleClearSemester}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 dark:border-slate-700/60 dark:bg-[#0d3a5f] dark:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  <IconEraser size={16} /> Clear All
                </button>
              </div>
            </div>
          </div>

          {/* --- RESULT PANEL --- */}
          <div className="lg:col-span-5">
            <div id="cgpa-result-panel" className="sticky top-6 rounded-3xl border border-[#d7ebf5] bg-white p-6 shadow-xl shadow-[#045C9A]/5 dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]">
              <h3 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400" data-html2canvas-ignore>
                Calculation Result
              </h3>

              {!calculation ? (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-[#072036]">
                    <IconCalculator size={32} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Enter subject data to see your CGPA
                  </p>
                </div>
              ) : calculation.isPending ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-900/10"
                >
                  <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <IconAlertTriangle size={24} />
                    <h4 className="font-bold">Result Pending</h4>
                  </div>
                  <p className="mb-3 text-[13px] leading-relaxed text-amber-800 dark:text-amber-200/80">
                    You must clear your outstanding courses before a CGPA can be officially computed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {calculation.failedSubjects.map((name, i) => (
                      <span key={i} className="rounded-lg bg-amber-200/50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={activeMethod + activeSemester} // Forces re-animation on switch
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cumulative CGPA</p>

                  {/* CGPA Display */}
                  <div className="relative mb-5 mt-2 flex items-baseline justify-center">
                    <span className="text-6xl font-extrabold tracking-tight text-[#072036] dark:text-white">
                      {calculation.cgpa.toFixed(2)}
                    </span>
                    <span className="ml-2 text-lg font-bold text-slate-400/80">/ 10</span>
                  </div>

                  {/* SGPA + Percentage stat strip */}
                  <div className="mb-6 grid w-full grid-cols-2 divide-x divide-[#d7ebf5] overflow-hidden rounded-2xl border border-[#d7ebf5] dark:divide-white/10 dark:border-white/10">
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Semester {activeSemester} SGPA
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">
                        {calculation.sgpa > 0 ? calculation.sgpa.toFixed(2) : "--"}
                      </p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Est. Percentage
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">
                        {calculation.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* More Insights -- Target Goal + Performance Trend, collapsed by
                      default so the panel's default view stays CGPA + stats + actions */}
                  <div className="mb-6 w-full" data-html2canvas-ignore>
                    <button
                      onClick={() => setShowTrend(!showTrend)}
                      className="flex w-full items-center justify-between rounded-xl bg-[#F1F5F9] px-4 py-3 text-sm font-bold text-[#045C9A] transition-colors hover:bg-[#d7ebf5]/60 dark:bg-[#072036]/50 dark:text-[#A6D7E8] dark:hover:bg-[#072036]"
                    >
                      <div className="flex items-center gap-2">
                        <IconChartLine size={18} />
                        More Insights
                      </div>
                      <IconChevronDown size={16} className={`transition-transform duration-300 ${showTrend ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {showTrend && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-4">
                            {/* Target Goal Tracker */}
                            {targetGoal.active ? (
                              <div className="rounded-2xl border border-[#d7ebf5] bg-[#EAF7FD] p-4 dark:border-[#045C9A]/30 dark:bg-[#045C9A]/10 relative group cursor-pointer transition-colors hover:bg-[#d7ebf5]/60 dark:hover:bg-[#045C9A]/20" onClick={() => setShowTargetModal(true)}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#045C9A] dark:text-[#A6D7E8]">Target Goal: {targetGoal.targetCGPA}</span>
                                  <IconTarget size={14} className="text-[#045C9A] dark:text-[#A6D7E8]" />
                                </div>
                                {(() => {
                                  const c1 = calculation.totalCredits || 0;
                                  const p1 = calculation.totalPoints || 0;
                                  const c2 = Math.max(0, parseFloat(targetGoal.totalDegreeUnits) - c1);
                                  const targetT = parseFloat(targetGoal.targetCGPA);

                                  if (c2 === 0) {
                                    return <p className="text-xs font-bold text-[#045C9A] dark:text-[#A6D7E8]">You have completed all planned units!</p>;
                                  }

                                  const reqPoints = (targetT * (c1 + c2)) - p1;
                                  const reqAvg = reqPoints / c2;

                                  if (reqAvg > 10) {
                                    return <p className="text-xs font-semibold text-red-600 dark:text-red-400">Mathematically impossible with remaining units.</p>;
                                  } else if (reqAvg <= 0) {
                                    return <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Goal achieved securely!</p>;
                                  } else {
                                    return (
                                      <div>
                                        <p className="text-[13px] leading-tight text-[#072036] dark:text-slate-200">
                                          Need an average of <strong className="text-[#045C9A] dark:text-[#A6D7E8]">{reqAvg.toFixed(2)}</strong> across your remaining {c2} {activeMethod === "equal" ? "subjects" : "credits"}.
                                        </p>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowTargetModal(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-slate-700 dark:text-slate-400 dark:hover:border-[#A6D7E8]/40 dark:hover:bg-[#045C9A]/20 dark:hover:text-[#A6D7E8]"
                              >
                                <IconTarget size={16} /> Set Target CGPA
                              </button>
                            )}

                            {/* Performance Trend */}
                            {trendData.length > 1 && (
                              <div className="h-48 w-full rounded-2xl border border-slate-100 bg-white p-4 pt-6 shadow-sm dark:border-[#045C9A]/20 dark:bg-[#072036]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#045C9A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#045C9A" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: '#0d3a5f', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                      itemStyle={{ color: '#60a5fa' }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="sgpa"
                                      stroke="#045C9A"
                                      strokeWidth={3}
                                      fillOpacity={1}
                                      fill="url(#colorSgpa)"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="w-full space-y-2" data-html2canvas-ignore>
                    <button
                      onClick={handleSaveResult}
                      disabled={isSyncing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E2136] py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1b3457] disabled:opacity-70 dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                    >
                      {isSyncing ? (
                        <IconLoader2 size={18} className="animate-spin" />
                      ) : (
                        <IconCheck size={18} />
                      )}
                      {isSyncing ? "Saving Result..." : "Save This Result"}
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7ebf5] bg-white py-3.5 text-sm font-bold text-slate-600 transition-colors hover:border-[#045C9A] hover:text-[#045C9A] active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-300 dark:hover:border-[#A6D7E8] dark:hover:text-[#A6D7E8]"
                    >
                      {isGeneratingPDF ? (
                        <IconLoader2 size={18} className="animate-spin" />
                      ) : (
                        <IconDownload size={18} />
                      )}
                      {isGeneratingPDF ? "Generating PDF..." : "Download as PDF"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- PASTE RESULTS MODAL --- */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072036]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#045C9A]/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                    <IconClipboardList size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-[#072036] dark:text-white">Paste Results</h2>
                </div>
                <button
                  onClick={() => { setShowPasteModal(false); setPasteError(""); }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">
                  Copy a table of results (Code | Name | Credits | Grade) from your marksheet, Excel, or a PDF, and paste it below.
                </p>

                <textarea
                  value={pasteText}
                  onChange={(e) => { setPasteText(e.target.value); setPasteError(""); }}
                  placeholder={"Example:\nR21UCE971 | Development of Smart Cities | 3.0 | A+\nR21UGS531 | Reasoning and Aptitude | 1.0 | O"}
                  className="h-36 w-full resize-none rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] p-4 font-mono text-[13px] text-[#072036] placeholder:font-mono placeholder:text-slate-400 focus:border-[#045C9A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#045C9A] dark:border-white/10 dark:bg-[#072036] dark:text-white dark:placeholder:text-slate-600"
                />

                {pasteError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                    <IconAlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{pasteError}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-[#045C9A]/20 dark:bg-[#072036]">
                <button
                  onClick={handleParseSubjects}
                  disabled={!pasteText.trim()}
                  className="w-full rounded-xl bg-[#0E2136] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1b3457] disabled:opacity-50 dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                >
                  Parse & Add Subjects
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- GRADE MAPPING MODAL (Configure Points) --- */}
      <AnimatePresence>
        {showGradeConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072036]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#045C9A]/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                    <IconSettings size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#072036] dark:text-white">Grade Mapping</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Define points & arrears for the Slab-Based method.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGradeConfigModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]"
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] p-3 text-[12.5px] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/10 dark:text-[#A6D7E8]">
                  <IconInfoCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Customize point multipliers for standard grades. Define arrear grades explicitly below.</span>
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Standard Passing Grades
                </p>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {gradeMapping.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2 rounded-xl border border-[#d7ebf5] bg-white p-2 dark:border-white/10 dark:bg-[#072036]"
                    >
                      <input
                        value={row.grade}
                        onChange={(e) => updateGradeRow(row.id, "grade", e.target.value.toUpperCase())}
                        maxLength={3}
                        className="w-14 rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-2 py-1.5 text-center text-sm font-bold text-[#072036] focus:border-[#045C9A] focus:outline-none dark:border-white/10 dark:bg-[#0d3a5f] dark:text-white"
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={row.points}
                        onChange={(e) => updateGradeRow(row.id, "points", e.target.value)}
                        className="w-16 rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-2 py-1.5 text-center text-sm font-semibold text-[#072036] focus:border-[#045C9A] focus:outline-none dark:border-white/10 dark:bg-[#0d3a5f] dark:text-white"
                      />
                      <button
                        onClick={() => removeGradeRow(row.id)}
                        className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addGradeRow}
                  className="mb-6 flex items-center gap-1.5 rounded-xl border border-dashed border-[#d7ebf5] px-3 py-2 text-xs font-semibold text-[#045C9A] hover:bg-[#EAF7FD] dark:border-white/20 dark:text-[#A6D7E8] dark:hover:bg-white/5"
                >
                  <IconPlus size={14} /> Add Passing Grade
                </button>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-500">
                  Arrear / Special (0 pts)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {failGrades.map((grade, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 py-1 pl-3 pr-1.5 dark:border-rose-900/40 dark:bg-rose-900/20"
                    >
                      <input
                        value={grade}
                        onChange={(e) => updateFailGrade(index, e.target.value.toUpperCase())}
                        maxLength={3}
                        className="w-10 bg-transparent text-center text-xs font-bold text-rose-600 focus:outline-none dark:text-rose-300"
                      />
                      <button
                        onClick={() => removeFailGrade(index)}
                        className="rounded-full p-0.5 text-rose-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40"
                      >
                        <IconX size={12} />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={addFailGrade}
                    className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-[#045C9A] hover:text-[#045C9A] dark:border-white/20 dark:text-slate-400"
                  >
                    <IconPlus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-[#045C9A]/20 dark:bg-[#072036]">
                <button
                  onClick={resetGradeMapping}
                  className="text-xs font-semibold text-slate-400 hover:text-[#045C9A] dark:hover:text-[#A6D7E8]"
                >
                  Reset to defaults
                </button>
                <button
                  onClick={() => setShowGradeConfigModal(false)}
                  className="rounded-xl bg-[#0E2136] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HISTORY DRAWER / MODAL --- */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#072036]/40 p-4 backdrop-blur-sm dark:bg-black/60">
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0d3a5f] dark:border dark:border-[#045C9A]/30"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#045C9A]/20">
                <h2 className="text-xl font-bold text-[#072036] dark:text-white">Saved Results</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {history.length === 0 ? (
                  <p className="text-center text-sm text-slate-400">No saved calculations yet.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => {
                      // Count total subjects saved across semesters
                      const totalSubjects = item.semestersData 
                        ? Object.values(item.semestersData).flat().filter(s => s.input.toString().trim() !== "").length 
                        : (item.subjects?.length || 0);

                      // Determine active semesters
                      let activeSemesters = [];
                      if (item.semestersData) {
                        Object.entries(item.semestersData).forEach(([sem, subjects]) => {
                          const hasData = subjects.some(s => s.input.toString().trim() !== "");
                          if (hasData) activeSemesters.push(sem);
                        });
                      }
                      
                      const semestersText = activeSemesters.length > 0 
                        ? `Semester${activeSemesters.length > 1 ? 's' : ''} ${activeSemesters.join(", ")}`
                        : "";

                      return (
                        <div
                          key={item.id}
                          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#045C9A] hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-[#072036] dark:hover:border-blue-500 dark:hover:bg-[#0d3a5f]"
                          onClick={() => loadHistoryItem(item)}
                        >
                          <div className="mb-2 flex items-center justify-between relative z-10">
                            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {item.date}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-blue-500">{item.method}</span>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-black text-[#072036] dark:text-white">{item.cgpa.toFixed(2)}</span>
                            <span className="text-sm font-semibold text-slate-400">CGPA</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 relative z-10">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {totalSubjects} subjects recorded
                            </span>
                            {semestersText && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="text-[11px] font-bold text-[#045C9A] dark:text-blue-400">
                                  {semestersText}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* Delete Button (Visible on Hover) */}
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="absolute right-3 bottom-3 z-20 flex translate-y-2 items-center justify-center rounded-lg border border-red-100 bg-white p-2 text-red-500 opacity-0 shadow-sm transition-all hover:bg-red-50 group-hover:translate-y-0 group-hover:opacity-100 dark:border-red-900/30 dark:bg-[#072036] dark:hover:bg-red-900/20"
                            title="Delete Saved Result"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- GUIDE MODAL --- */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072036]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#045C9A]/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <IconInfoCircle size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[#072036] dark:text-white">How Each Method Works</h2>
                </div>
                <button onClick={() => setShowGuideModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]">
                  <IconX size={20} />
                </button>
              </div>
              
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#045C9A] dark:text-blue-400">1. Slab-Based Method <span className="text-sm font-normal text-slate-500">(Anna University)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Converts your Letter Grade into a predefined Grade Point, multiplies it by the subject's credits, and then divides the total points by your total credits.</p>
                  
                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Letter Grades or exact Points -- customize these anytime with <strong>Configure Points</strong> above the method selector.
                    <div className="mt-2 flex flex-wrap gap-2">
                      {gradeMapping.filter((row) => row.grade.trim()).map((row) => (
                        <span key={row.id} className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {row.grade} = {row.points}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#072036] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You get an <span className="font-bold text-blue-600 dark:text-blue-400">A+</span> in a <span className="font-bold text-blue-600 dark:text-blue-400">4-credit</span> course.<br/>
                    A+ translates to 9 points.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (9 points × 4 credits) ÷ 4 total credits = 9.0 GPA</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#045C9A] dark:text-blue-400">2. Continuous Method <span className="text-sm font-normal text-slate-500">(Madras University)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Uses your exact marks divided by 10 to get a precise decimal grade point, then calculates the credit-weighted average.</p>
                  
                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Exact Decimal Points (e.g., <span className="font-bold dark:text-white">8.7</span>) or total Marks (e.g., <span className="font-bold dark:text-white">87</span>). The calculator automatically divides marks by 10.
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#072036] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You score <span className="font-bold text-blue-600 dark:text-blue-400">87 marks</span> in a <span className="font-bold text-blue-600 dark:text-blue-400">3-credit</span> course.<br/>
                    87 marks ÷ 10 = 8.7 Grade Points.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (8.7 points × 3 credits) ÷ 3 total credits = 8.7 GPA</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#045C9A] dark:text-blue-400">3. Equal-Credit Method <span className="text-sm font-normal text-slate-500">(Autonomous)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Treats every subject equally by completely ignoring the credits. It calculates a simple average of your grade points.</p>

                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Grade Points or Marks. Credits can be left blank or will be completely ignored.
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#072036] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You score <span className="font-bold text-blue-600 dark:text-blue-400">8.5</span> in Math (4 credits) and <span className="font-bold text-blue-600 dark:text-blue-400">9.5</span> in Lab (1 credit).<br/>
                    The credits are completely ignored.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (8.5 + 9.5) ÷ 2 = 9.0 CGPA</div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-900/10">
                    <h3 className="mb-2 text-lg font-bold text-[#045C9A] dark:text-blue-400">How is GPA calculated?</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li><strong className="text-slate-900 dark:text-white">GPA (Semester):</strong> (Total Points) ÷ (Total Credits in semester).</li>
                      <li><strong className="text-slate-900 dark:text-white">CGPA (Cumulative):</strong> (Total Points across ALL semesters) ÷ (Total Credits across ALL semesters).</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
                    <div className="mb-2 flex items-center gap-2">
                      <IconAlertTriangle size={18} className="text-red-500" />
                      <h3 className="text-[16px] font-bold text-red-700 dark:text-red-400">What about Failures/Arrears?</h3>
                    </div>
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                      You do <strong className="text-slate-900 dark:text-white">not</strong> need to enter these!
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Grades like <span className="font-bold text-red-600 dark:text-red-400">RA, SA, AB, W, U, F</span> mean incomplete. If detected, the calculator flags the semester as <strong className="text-slate-900 dark:text-white">Result Pending</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TARGET GOAL MODAL --- */}
      <AnimatePresence>
        {showTargetModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#072036]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#045C9A]/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <IconTarget size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[#072036] dark:text-white">Set Target Goal</h2>
                </div>
                <button
                  onClick={() => setShowTargetModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g., 8.5"
                    value={targetGoal.targetCGPA}
                    onChange={(e) => setTargetGoal(prev => ({ ...prev, targetCGPA: e.target.value }))}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-lg font-bold text-[#045C9A] placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700/60 dark:bg-[#072036] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {activeMethod === "equal" ? "Total Degree Subjects" : "Total Degree Credits"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={activeMethod === "equal" ? "e.g., 40" : "e.g., 165"}
                    value={targetGoal.totalDegreeUnits}
                    onChange={(e) => setTargetGoal(prev => ({ ...prev, totalDegreeUnits: e.target.value }))}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-lg font-bold text-[#045C9A] placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700/60 dark:bg-[#072036] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Enter the total number of {activeMethod === "equal" ? "subjects" : "credits"} required to complete your entire degree.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-[#045C9A]/20 dark:bg-[#072036]">
                {targetGoal.active && (
                  <button
                    onClick={() => {
                      setTargetGoal({ active: false, targetCGPA: "", totalDegreeUnits: "" });
                      setShowTargetModal(false);
                    }}
                    className="flex-1 rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    Clear Goal
                  </button>
                )}
                <button
                  onClick={() => {
                    if (targetGoal.targetCGPA && targetGoal.totalDegreeUnits) {
                      setTargetGoal(prev => ({ ...prev, active: true }));
                      setShowTargetModal(false);
                    }
                  }}
                  disabled={!targetGoal.targetCGPA || !targetGoal.totalDegreeUnits}
                  className="flex-[2] rounded-xl bg-[#0E2136] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1b3457] disabled:opacity-50 dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                >
                  Set Target
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
    </PageTransition>
  );
}
