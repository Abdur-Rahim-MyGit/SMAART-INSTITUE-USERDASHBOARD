import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import {
  IconCalculator,
  IconWand,
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
  IconScan,
  IconLoader2,
  IconDownload,
  IconTarget,
  IconChartLine,
  IconCloudUpload
} from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const SUBJECT_CODE_REGEX = /^(?:(?=.*[A-Z])(?=.*\d)[A-Z0-9]{3,15}|\d{5,10})$/;
const HEADER_WORDS = new Set([
  "SIT", "COE", "REG", "NO", "NAME", "DEPARTMENT", "DOB", "TECHNOLOGY",
  "SEM", "SUBJECT", "CODE", "GRADE", "PRINT", "RESULT", "B", "TECH",
  "INFORMATION", "STUDENT"
]);
const KNOWN_SUBJECTS = {
  R21CSV505: "Digital Marketing",
  R21UIT508: "Mining and Analysis of Big Data Laboratory",
  R21UIT507: "Creative Thinking and Innovation",
  R21UIT506: "Internet and Web Technology Laboratory",
  R21UIT503: "Mining and Analysis of Big Data",
  R21UIT501: "Internet and Web Technology",
  R21UGS532: "Soft Skills Laboratory",
  R21UGS531: "Reasoning and Aptitude",
  R21UGM535: "Universal Human Values - II",
  R21UCS509: "Mobile Applications Design and Development Laboratory",
  R21UCS502: "Mobile Applications Design and Development",
  R21UCE971: "Development of Smart Cities",
  R21UIT861: "Generative AI"
};
const KNOWN_SUBJECT_ORDER = Object.keys(KNOWN_SUBJECTS);
const KNOWN_SUBJECT_ALIASES = {
  R21UIT508: ["MININGANDANALYSISOFBIGDATALABORATORY", "MININGANDANALYSISOFBIGDATALAB"],
  R21UIT507: ["CREATIVETHINKINGANDINNOVATION", "CREATIVETHINKING"],
  R21UIT506: ["INTERNETANDWEBTECHNOLOGYLABORATORY", "INTERNETANDWEBTECHNOLOGYLAB"],
  R21UIT503: ["MININGANDANALYSISOFBIGDATA"],
  R21UIT501: ["INTERNETANDWEBTECHNOLOGY"],
  R21UGS532: ["SOFTSKILLS"],
  R21UGS531: ["REASONINGANDAPTITUDE", "REASONINGANDOSAPTITUDE", "REASONINGAPTITUDE"],
  R21UGM535: ["UNIVERSALHUMANVALUESII", "UNIVERSALHUMANVALUES", "UGM535", "UGMS35"],
  R21UCS509: ["MOBILEAPPLICATIONSDESIGNANDDEVELOPMENTLABORATORY", "MOBILEAPPLICATIONSDESIGNANDDEVELOPMENTLAB"],
  R21UCS502: ["MOBILEAPPLICATIONSDESIGNANDDEVELOPMENT"],
  R21UCE971: ["DEVELOPMENTOFSMARTCITIES"],
  R21UIT861: ["GENERATIVEAI", "GENERATIVEAL"]
};

const normalizeSubjectCode = (value) => {
  let code = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^RI/, "R1")
    .replace(/^R2I/, "R21")
    .replace(/^R2T/, "R21")
    .replace(/^RZ1/, "R21");

  if (/^21[A-Z]/.test(code)) code = `R${code}`;
  if (/^R1U/.test(code)) code = code.replace(/^R1U/, "R21U");
  code = code
    .replace(/^R21UITS/, "R21UIT5")
    .replace(/^R21UCES/, "R21UCE5");

  return code;
};

const normalizeGrade = (value) => {
  const token = value.toUpperCase().replace(/[^A-Z0-9+]/g, "");
  const numericToken = value.trim().replace(/[^0-9.]/g, "");
  if (/^\d{1,2}\.\d+$/.test(numericToken) || numericToken === "10") {
    const numericGrade = parseFloat(numericToken);
    if (numericGrade >= 0 && numericGrade <= 10) return numericToken;
  }

  const gradeMap = {
    "0": "O",
    "Q": "O",
    "D": "O",
    "O": "O",
    "A+": "A+",
    "AT": "A+",
    "A1": "A+",
    "A": "A",
    "B+": "B+",
    "BT": "B+",
    "B": "B",
    "C": "C",
    "RA": "RA",
    "SA": "SA",
    "AB": "AB",
    "W": "W",
    "U": "U",
    "F": "F"
  };

  return gradeMap[token] || "";
};

const isLikelySubjectCode = (value) => SUBJECT_CODE_REGEX.test(normalizeSubjectCode(value));

const cleanSubjectName = (tokens) => {
  const ignored = new Set(["S", "5", "|", ":", "-", "II"]);
  const words = tokens
    .map((token) => token.replace(/^[|:;,.]+|[|:;,.]+$/g, ""))
    .filter(Boolean)
    .filter((token) => !ignored.has(token.toUpperCase()))
    .filter((token) => !HEADER_WORDS.has(token.toUpperCase()))
    .filter((token) => !/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(token))
    .filter((token) => !/^\d+$/.test(token))
    .map((token) => token.replace(/[^a-zA-Z0-9\s&.+-]/g, ""));

  return words
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\bAl\b/g, "AI")
    .replace(/\bli\b/g, "II")
    .trim();
};

const compactText = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const getKnownSubjectAliases = (code) => [
  compactText(KNOWN_SUBJECTS[code] || ""),
  ...(KNOWN_SUBJECT_ALIASES[code] || [])
];

const subjectNameMatchesKnownCode = (name, code) => {
  const compactName = compactText(name);
  if (compactName.length < 6) return false;

  return getKnownSubjectAliases(code).some((alias) => (
    alias.includes(compactName) || compactName.includes(alias)
  ));
};

const inferKnownSubjectCode = (rawCode, rawName, usedCodes = new Set()) => {
  const code = normalizeSubjectCode(rawCode || "");
  const name = rawName || "";

  if (KNOWN_SUBJECTS[code] && !usedCodes.has(code)) return code;

  const prefixMatches = KNOWN_SUBJECT_ORDER.filter((knownCode) => (
    code.length >= 6
    && knownCode.startsWith(code)
    && !usedCodes.has(knownCode)
  ));

  const nameMatches = KNOWN_SUBJECT_ORDER.filter((knownCode) => (
    !usedCodes.has(knownCode) && subjectNameMatchesKnownCode(name, knownCode)
  ));

  if (prefixMatches.length === 1) return prefixMatches[0];

  const prefixAndNameMatch = prefixMatches.find((knownCode) => (
    subjectNameMatchesKnownCode(name, knownCode)
  ));
  if (prefixAndNameMatch) return prefixAndNameMatch;

  if (nameMatches.length === 1) return nameMatches[0];

  if (nameMatches.length > 1) {
    const laboratoryMatch = nameMatches.find((knownCode) => (
      /LAB|LABORATORY/i.test(name) && /LABORATORY/i.test(KNOWN_SUBJECTS[knownCode])
    ));
    if (laboratoryMatch) return laboratoryMatch;

    const nonLaboratoryMatch = nameMatches.find((knownCode) => (
      !/LAB|LABORATORY/i.test(name) && !/LABORATORY/i.test(KNOWN_SUBJECTS[knownCode])
    ));
    if (nonLaboratoryMatch) return nonLaboratoryMatch;
  }

  return prefixMatches[0] || code;
};

const applyKnownSubjectFallbacks = (subjects, sourceText = "") => {
  const usedCodes = new Set();
  const sourceCompact = compactText(sourceText);
  const corrected = [];

  subjects.forEach((subject) => {
    const inferredCode = inferKnownSubjectCode(subject.code, subject.name, usedCodes);
    const knownName = KNOWN_SUBJECTS[inferredCode];

    if (usedCodes.has(inferredCode)) {
      const existing = corrected.find((item) => item.code === inferredCode);
      if (existing && !existing.input && subject.input) {
        existing.input = subject.input;
      }
      return;
    }

    usedCodes.add(inferredCode);
    corrected.push({
      ...subject,
      code: inferredCode,
      name: knownName || subject.name
    });
  });

  Object.entries(KNOWN_SUBJECTS).forEach(([code, name]) => {
    if (usedCodes.has(code)) return;
    const aliases = getKnownSubjectAliases(code);
    if (!aliases.some((alias) => sourceCompact.includes(alias))) return;

    corrected.push({
      id: Date.now() + Math.random(),
      code,
      name,
      input: "",
      credits: ""
    });
    usedCodes.add(code);
  });

  return corrected.sort((a, b) => {
    const aIndex = KNOWN_SUBJECT_ORDER.indexOf(a.code);
    const bIndex = KNOWN_SUBJECT_ORDER.indexOf(b.code);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

const splitNameAndGrade = (tokens) => {
  let grade = "";
  let credits = "";
  const nameTokens = [];

  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const possibleGrade = normalizeGrade(token);
    
    if (possibleGrade && !grade) {
      grade = possibleGrade;
    } else if (/^[1-9](\.0)?$/.test(token) && !credits) {
      credits = token.replace(".0", "");
    } else {
      nameTokens.unshift(token);
    }
  }

  return { nameTokens, grade, credits };
};

const parseResultTableText = (text) => {
  const normalizedText = text
    .replace(/[|]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"');

  const rows = [];
  let currentRow = null;

  normalizedText.split(/\n+/).forEach((line) => {
    const tokens = line.match(/[A-Za-z0-9+.-]+/g) || [];
    if (tokens.length === 0) return;

    const codeIndex = tokens.findIndex((token) => isLikelySubjectCode(token));

    if (codeIndex >= 0) {
      if (currentRow) rows.push(currentRow);

      const beforeCode = tokens.slice(0, codeIndex);
      const afterCode = tokens.slice(codeIndex + 1);
      const { nameTokens, grade, credits } = splitNameAndGrade([...beforeCode, ...afterCode]);

      currentRow = {
        code: normalizeSubjectCode(tokens[codeIndex]),
        nameTokens,
        grade,
        credits
      };
      return;
    }

    if (!currentRow) return;

    const { nameTokens, grade, credits } = splitNameAndGrade(tokens);
    currentRow.nameTokens.push(...nameTokens);
    if (grade) currentRow.grade = grade;
    if (credits) currentRow.credits = credits;
  });

  if (currentRow) rows.push(currentRow);

  const subjects = rows.map((row) => {
    return {
      id: Date.now() + Math.random(),
      code: row.code,
      name: KNOWN_SUBJECTS[row.code] || cleanSubjectName(row.nameTokens),
      input: row.grade,
      credits: row.credits || "",
    };
  }).filter((subject) => subject.code && (subject.name || subject.input));

  return applyKnownSubjectFallbacks(subjects, normalizedText);
};

const extractResultRowsFromOcrWords = (words) => {
  if (!words || !Array.isArray(words) || words.length === 0) return [];

  const lines = [];
  const wordHeights = words
    .filter((word) => word.bbox)
    .map((word) => Math.max(1, word.bbox.y1 - word.bbox.y0));
  const averageWordHeight = wordHeights.length
    ? wordHeights.reduce((sum, height) => sum + height, 0) / wordHeights.length
    : 18;
  const rowTolerance = Math.max(12, averageWordHeight * 0.7);

  words.forEach((word) => {
    if (!word.bbox || !word.text?.trim()) return;

    const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
    const existingLine = lines.find((line) => Math.abs(line.centerY - centerY) < rowTolerance);

    if (existingLine) {
      existingLine.words.push(word);
      existingLine.centerY = ((existingLine.centerY * (existingLine.words.length - 1)) + centerY) / existingLine.words.length;
    } else {
      lines.push({ centerY, words: [word] });
    }
  });

  const sortedLines = lines
    .sort((a, b) => a.centerY - b.centerY)
    .map((line) => {
      line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      return line.words.map((w) => w.text).join(" ");
    })
    .filter(line => line.trim().length > 0);

  return sortedLines;
};

const createImageCropBlob = (file, crop) => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    const canvas = document.createElement("canvas");
    const sourceX = Math.floor(image.naturalWidth * crop.x);
    const sourceY = Math.floor(image.naturalHeight * crop.y);
    const sourceWidth = Math.floor(image.naturalWidth * crop.width);
    const sourceHeight = Math.floor(image.naturalHeight * crop.height);

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    canvas.getContext("2d").drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to crop grade column"));
      }
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("Unable to load screenshot"));
  };

  image.src = objectUrl;
});

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Unable to read screenshot"));
  reader.readAsDataURL(file);
});

const extractTextFromOcrPayload = (payload) => {
  const wordRows = extractResultRowsFromOcrWords(payload?.words);
  if (wordRows.length > 0) return wordRows.join("\n");
  return payload?.text || "";
};

const extractGradesFromOcrText = (text) => {
  const tokens = text.match(/[A-Za-z0-9+]+/g) || [];
  return tokens.map(normalizeGrade).filter(Boolean);
};

const applyMissingGradesBySequence = (text, grades) => {
  if (!grades.length) return text;

  let gradeIndex = 0;
  const subjects = parseResultTableText(text);
  if (grades.length < Math.ceil(subjects.length * 0.6) || grades.length > subjects.length + 3) {
    return text;
  }

  return subjects.map((subject) => {
    const grade = subject.input || grades[gradeIndex++] || "";
    return `${subject.code} ${subject.name} ${grade}`.trim();
  }).join("\n");
};

export default function CGPACalculator() {
  const navigate = useNavigate();

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
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("Scanning Image");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
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
          if (response.data.activeMethod) {
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

        if (GRADE_MAPPING[rawInput] !== undefined) {
          if (activeMethod !== "slab") {
            gp = 0;
            isPending = true;
            failedSet.add(`${subject.name || "Subject"} (Requires Numbers)`);
          } else {
            gp = GRADE_MAPPING[rawInput];
          }
        } else if (FAIL_GRADES.includes(rawInput) || parseFloat(rawInput) === 0) {
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
  }, [semestersData, activeMethod, activeSemester]);

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

          if (GRADE_MAPPING[rawInput] !== undefined) {
             gp = activeMethod === "slab" ? GRADE_MAPPING[rawInput] : 0;
          } else if (!FAIL_GRADES.includes(rawInput) && parseFloat(rawInput) > 0) {
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
  }, [semestersData, activeMethod]);

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

  const handleSmartPaste = () => {
    const newSubjects = parseResultTableText(pasteText);

    if (newSubjects.length > 0) {
      const mappedSubjects = newSubjects.map(s => ({
        ...s,
        inputSlab: s.input,
        inputNumeric: s.input
      }));

      while (mappedSubjects.length < 4) {
        mappedSubjects.push({ id: Date.now() + Math.random(), code: "", name: "", input: "", inputSlab: "", inputNumeric: "", credits: "" });
      }
      setSemestersData(prev => ({
        ...prev,
        [activeSemester]: mappedSubjects
      }));
      setShowPasteModal(false);
      setPasteText("");
    } else {
      alert("Could not extract any valid subject data. Please make sure the text contains subject codes (e.g. CS8391) and grades.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus("Preparing image");

    try {
      try {
        setOcrProgress(5);
        setOcrStatus("Trying PaddleOCR");
        const imageData = await readFileAsDataUrl(file);
        const paddleResult = await apiCall('/ocr/paddle', {
          method: 'POST',
          body: JSON.stringify({ imageData }),
          timeout: 200000,
        });

        const paddleText = extractTextFromOcrPayload(paddleResult);
        if (paddleText.trim()) {
          setOcrProgress(100);
          setPasteText(prev => prev ? prev + "\n" + paddleText : paddleText);
          return;
        }
      } catch (paddleErr) {
        console.warn("PaddleOCR unavailable, falling back to browser OCR.", paddleErr);
      }

      setOcrStatus("Using browser OCR");
      setOcrProgress(10);
      const Tesseract = (await import('tesseract.js')).default || await import('tesseract.js');
      
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrStatus("Reading screenshot");
            setOcrProgress(Math.max(10, Math.round(m.progress * 100)));
          }
        }
      });
      
      const result = await worker.recognize(file);
      let gradeText = "";

      try {
        await worker.setParameters({
          tessedit_char_whitelist: "O0A+BCRSUFW",
          tessedit_pageseg_mode: "6"
        });

        const gradeCrops = await Promise.all([
          createImageCropBlob(file, { x: 0.44, y: 0.1, width: 0.14, height: 0.78 }),
          createImageCropBlob(file, { x: 0.76, y: 0.1, width: 0.22, height: 0.78 })
        ]);

        const gradeResults = [];
        for (const crop of gradeCrops) {
          const cropResult = await worker.recognize(crop);
          gradeResults.push(cropResult.data.text || "");
        }
        gradeText = gradeResults.join("\n");
      } catch (gradeErr) {
        console.warn("Grade-column OCR failed, continuing with full OCR text.", gradeErr);
      } finally {
        await worker.terminate();
      }
      
      let newText = result.data.text || "";

      // MATHEMATICAL BOUNDING BOX CLUSTERING (Safely Wrapped)
      try {
        const words = result.data.words;
        if (words && Array.isArray(words) && words.length > 0) {
          const extractedRows = extractResultRowsFromOcrWords(words);
          const rows = [];
          const rowTolerance = 15; // vertical pixel variance allowed

          words.forEach(word => {
            if (!word.bbox) return; // safety check
            
            const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
            let foundRow = rows.find(r => Math.abs(r.centerY - centerY) < rowTolerance);
            
            if (foundRow) {
              foundRow.words.push(word);
              foundRow.centerY = ((foundRow.centerY * (foundRow.words.length - 1)) + centerY) / foundRow.words.length;
            } else {
              rows.push({ centerY: centerY, words: [word] });
            }
          });

          rows.sort((a, b) => a.centerY - b.centerY);

          const reconstructedLines = rows.map(row => {
            row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
            return row.words.map(w => w.text).join(" ");
          });
          
          if (extractedRows.length > 0) {
            newText = extractedRows.join("\n");
          } else if (reconstructedLines.length > 0) {
            newText = reconstructedLines.join("\n");
          }
        }
      } catch (err) {
        console.warn("Bounding box clustering failed, falling back to default text extraction.", err);
      }

      if (!newText.trim()) throw new Error("No text found in image");

      newText = applyMissingGradesBySequence(newText, extractGradesFromOcrText(gradeText));

      setPasteText(prev => prev ? prev + "\n" + newText : newText);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to extract text from the image.");
    } finally {
      setIsOcrLoading(false);
      setOcrProgress(0);
      setOcrStatus("Scanning Image");
      e.target.value = null; // Reset input
    }
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
    <div className="min-h-screen bg-transparent pb-12 font-sans transition-colors duration-300">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        {/* Header & Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard/smaart-toolkit")}
            className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#112b6b] transition-all hover:text-[#1a3884] dark:text-slate-300"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
              <IconArrowLeft stroke={1.5} className="h-4 w-4" />
            </div>
            Back to Toolkit
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
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <IconPlus size={16} stroke={2.5} />
              <span className="hidden sm:inline">New Calculation</span>
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 sm:px-4 py-2 text-[12px] font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              <IconInfoCircle size={16} />
              <span className="hidden sm:inline">How it works</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 text-[12px] font-bold text-[#1a3884] shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-[#001a3d] dark:text-blue-300 dark:hover:bg-[#00204d]"
            >
              <IconHistory size={16} />
              <span className="hidden sm:inline">View History</span>
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-8 py-6 shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="flex-1 pr-6">
              <h1 className="text-[22px] font-extrabold text-[#0d1f4e] dark:text-white mb-1.5">
                CGPA Calculator
              </h1>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Effortlessly calculate and compare your CGPA across different methods. Enter your grade points or paste your result table directly.
              </p>
            </div>

            {/* Vertical Divider (Hidden on mobile) */}
            <div className="hidden md:block w-px h-16 bg-slate-200 dark:bg-slate-700/50"></div>

            {/* Right Content */}
            <div className="flex flex-col md:flex-row md:items-center gap-5 pl-0 md:pl-2">
              <div className="hidden md:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  QUICK IMPORT
                </p>
                <p className="text-[14px] font-bold text-[#0d1f4e] dark:text-white">
                  Extract from Result
                </p>
              </div>

              {/* Smart Paste Button */}
              <button
                onClick={() => setShowPasteModal(true)}
                className="group flex items-center justify-center gap-1.5 rounded-xl bg-[#2c52b3] px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-[#1a3884] active:scale-95"
              >
                <IconWand size={16} stroke={2} className="transition-transform group-hover:rotate-12" />
                <span className="text-[14px]">Smart Paste Data</span>
                <IconChevronRight size={16} stroke={2} className="opacity-70 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            
          </div>
        </motion.div>

        {/* --- METHOD SELECTOR --- */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {METHODS.map((method) => {
            const isActive = activeMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setActiveMethod(method.id)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${
                  isActive
                    ? "border-[#1a3884] bg-[#f5f8ff] shadow-md dark:border-blue-500/50 dark:bg-blue-900/20"
                    : "border-slate-200 bg-white hover:border-[#1a3884]/30 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#001024] dark:hover:border-slate-700"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="method-active"
                    className="absolute inset-0 rounded-2xl border-2 border-[#1a3884] dark:border-blue-400"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`text-[15px] font-bold ${isActive ? "text-[#1a3884] dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
                  {method.name}
                </span>
                <span className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${isActive ? "text-blue-600/70 dark:text-blue-400/70" : "text-slate-400 dark:text-slate-500"}`}>
                  {method.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* --- INPUT PANEL --- */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#d8e6f7] bg-white p-6 shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]">
              
              {/* Semester Dropdown */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#1a3884]/20">
                <div>
                  <h3 className="text-sm font-bold text-[#0d1f4e] dark:text-white">Semester Details</h3>
                  <p className="text-[11px] text-slate-400">Switch semesters to add cumulative data</p>
                </div>
                <div className="relative">
                  <select
                    value={activeSemester}
                    onChange={(e) => setActiveSemester(parseInt(e.target.value))}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-bold text-[#1a3884] outline-none focus:border-[#1a3884] focus:ring-1 focus:ring-[#1a3884] dark:border-slate-700 dark:bg-[#000a1a] dark:text-blue-400"
                  >
                    {SEMESTERS.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                  <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1a3884] dark:text-blue-400" />
                </div>
              </div>

              {/* Table Header */}
              <div className="mb-1 grid grid-cols-12 gap-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-[#000d20]">
                <div className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${activeMethod === "equal" ? "col-span-3" : "col-span-2"}`}>Code</div>
                <div className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${activeMethod === "equal" ? "col-span-5" : "col-span-4"}`}>Subject Name</div>
                <div className="col-span-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {activeMethod === "slab" ? "Grade / GP" : "Marks / GP"}
                </div>
                {activeMethod !== "equal" && (
                  <div className="col-span-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Credits
                  </div>
                )}
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2">
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
                    return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group grid grid-cols-12 gap-2 items-center rounded-xl border-l-4 border-l-[#1a3884] border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px] dark:border-slate-700/60 dark:bg-[#000d20]"
                    >
                      <div className={activeMethod === "equal" ? "col-span-3" : "col-span-2"}>
                        <input
                          type="text"
                          title={subject.code || ""}
                          value={subject.code || ""}
                          onChange={(e) => handleSubjectChange(subject.id, "code", e.target.value.toUpperCase())}
                          placeholder={ph.code}
                          className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-2 py-1.5 text-[12px] font-extrabold tracking-wider text-[#1a3884] text-ellipsis placeholder:font-semibold placeholder:tracking-wide placeholder:text-slate-400 focus:border-[#1a3884] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3884]/20 dark:border-slate-700/60 dark:bg-[#001630] dark:text-blue-400 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
                        />
                      </div>
                      <div className={activeMethod === "equal" ? "col-span-5" : "col-span-4"}>
                        <input
                          type="text"
                          title={subject.name || ""}
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(subject.id, "name", e.target.value)}
                          placeholder={ph.name}
                          className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-2 py-1.5 text-[13px] font-medium text-[#0d1f4e] text-ellipsis placeholder:font-medium placeholder:text-slate-400 focus:border-[#1a3884] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3884]/20 dark:border-slate-700/60 dark:bg-[#001630] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500"
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
                          className="w-full text-center rounded-lg border-2 border-blue-100 bg-blue-50 px-2 py-1.5 text-[13px] font-bold text-[#1a3884] uppercase placeholder:font-semibold placeholder:text-blue-300 focus:border-[#1a3884] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3884]/20 dark:border-blue-900/50 dark:bg-blue-900/10 dark:text-blue-300 dark:placeholder:text-blue-700 dark:focus:border-blue-500"
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
                            className="w-full text-center rounded-lg border-2 border-slate-100 bg-slate-50 px-2 py-1.5 text-[13px] font-bold text-[#0d1f4e] placeholder:font-semibold placeholder:text-slate-400 focus:border-[#1a3884] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3884]/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/60 dark:bg-[#001630] dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-800"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-4 text-sm font-semibold text-slate-500 transition-colors hover:border-[#1a3884] hover:bg-blue-50 hover:text-[#1a3884] dark:border-slate-700 dark:bg-[#001024]/50 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-[#001a3d] dark:hover:text-blue-400"
                >
                  <IconPlus size={16} /> Add Subject
                </button>
                <button
                  onClick={handleClearSemester}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 dark:border-slate-700/60 dark:bg-[#001630] dark:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  <IconEraser size={16} /> Clear All
                </button>
              </div>
            </div>
          </div>

          {/* --- RESULT PANEL --- */}
          <div className="lg:col-span-5">
            <div id="cgpa-result-panel" className="sticky top-6 rounded-3xl border border-[#d8e6f7] bg-white p-6 shadow-xl shadow-[#1a3884]/5 dark:border-[#1a3884]/20 dark:bg-[#001630]">
              <h3 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500" data-html2canvas-ignore>
                Calculation Result
              </h3>

              {!calculation ? (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-[#00204d]">
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
                  
                  {/* Semester GPA (SGPA) Badge */}
                  {calculation.sgpa > 0 && (
                    <div className="mb-4 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 dark:border-blue-900/50 dark:bg-blue-900/20">
                      <p className="text-[12px] font-bold text-blue-700 dark:text-blue-400">
                        Semester {activeSemester} GPA (SGPA): {calculation.sgpa.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cumulative CGPA</p>

                  {/* Refined CGPA Display */}
                  <div className="relative mb-4 mt-2 flex items-baseline justify-center">
                    <span className="bg-gradient-to-br from-[#0d1f4e] to-[#1a3884] bg-clip-text text-6xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-blue-400">
                      {calculation.cgpa.toFixed(2)}
                    </span>
                    <span className="ml-2 text-lg font-bold text-slate-400/80">/ 10</span>
                  </div>

                  <div className="mb-6 rounded-full bg-green-100/50 px-4 py-1.5 dark:bg-green-900/20">
                    <p className="text-[13px] font-bold text-green-700 dark:text-green-400">
                      Estimated Percentage: {calculation.percentage}%
                    </p>
                  </div>

                  {/* Target Goal Tracker */}
                  <div className="mb-8 w-full" data-html2canvas-ignore>
                    {targetGoal.active ? (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-900/10 relative group cursor-pointer transition-all hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20" onClick={() => setShowTargetModal(true)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Target Goal: {targetGoal.targetCGPA}</span>
                          <IconTarget size={14} className="text-indigo-400" />
                        </div>
                        {(() => {
                          const c1 = calculation.totalCredits || 0;
                          const p1 = calculation.totalPoints || 0;
                          const c2 = Math.max(0, parseFloat(targetGoal.totalDegreeUnits) - c1);
                          const targetT = parseFloat(targetGoal.targetCGPA);
                          
                          if (c2 === 0) {
                            return <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">You have completed all planned units!</p>;
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
                                <p className="text-[13px] leading-tight text-indigo-800 dark:text-indigo-200">
                                  Need an average of <strong className="text-indigo-600 dark:text-indigo-300">{reqAvg.toFixed(2)}</strong> across your remaining {c2} {activeMethod === "equal" ? "subjects" : "credits"}.
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTargetModal(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                      >
                        <IconTarget size={16} /> Set Target CGPA
                      </button>
                    )}
                  </div>

                  {trendData.length > 1 && (
                    <div className="mb-6 w-full" data-html2canvas-ignore>
                      <button
                        onClick={() => setShowTrend(!showTrend)}
                        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-[#1a3884] transition-colors hover:bg-slate-100 dark:bg-[#00204d]/50 dark:text-blue-400 dark:hover:bg-[#00204d]"
                      >
                        <div className="flex items-center gap-2">
                          <IconChartLine size={18} />
                          Performance Trend Analytics
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
                            <div className="mt-4 h-48 w-full rounded-2xl border border-slate-100 bg-white p-4 pt-6 shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001024]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#1a3884" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#1a3884" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                  <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                  <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: '#001630', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="sgpa" 
                                    stroke="#1a3884" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorSgpa)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="w-full space-y-2" data-html2canvas-ignore>
                    <button
                      onClick={handleSaveResult}
                      disabled={isSyncing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3884] py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#112b6b] active:translate-y-0 disabled:opacity-70 dark:bg-[#00204d] dark:hover:bg-[#00337a]"
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-[#1a3884] hover:text-[#1a3884] active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-[#001630] dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
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

      {/* --- SMART PASTE MODAL --- */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1f4e]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#1a3884]/30 dark:bg-[#001630]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#1a3884]/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2 text-white">
                    <IconWand size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0d1f4e] dark:text-white">Smart Paste</h2>
                </div>
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#00204d]"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">
                  Paste the result table directly, or <strong>upload a screenshot</strong> of your results!
                </p>

                {/* OCR Upload Area */}
                <div className="relative mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="ocr-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="ocr-upload"
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 ${isOcrLoading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {isOcrLoading ? (
                      <>
                        <IconLoader2 className="animate-spin" size={18} />
                        {ocrStatus} ({ocrProgress}%)...
                      </>
                    ) : (
                      <>
                        <IconScan size={18} />
                        Upload Screenshot for Auto-Fill
                      </>
                    )}
                  </label>
                </div>

                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g. Data Structures 4 A+&#10;Computer Networks 3 8.9"
                  className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-[#0d1f4e] placeholder:text-slate-300 focus:border-[#1a3884] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3884] dark:border-slate-700 dark:bg-[#000a1a] dark:text-white dark:placeholder:text-slate-600"
                />
              </div>
              <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-[#1a3884]/20 dark:bg-[#001024]">
                <button
                  onClick={handleSmartPaste}
                  disabled={!pasteText.trim()}
                  className="w-full rounded-xl bg-[#1a3884] py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:bg-blue-600"
                >
                  Extract Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HISTORY DRAWER / MODAL --- */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#0d1f4e]/40 p-4 backdrop-blur-sm dark:bg-black/60">
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#001630] dark:border dark:border-[#1a3884]/30"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#1a3884]/20">
                <h2 className="text-xl font-bold text-[#0d1f4e] dark:text-white">Saved Results</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#00204d]"
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
                          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#1a3884] hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-[#001024] dark:hover:border-blue-500 dark:hover:bg-[#001630]"
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
                            <span className="text-3xl font-black text-[#0d1f4e] dark:text-white">{item.cgpa.toFixed(2)}</span>
                            <span className="text-sm font-semibold text-slate-400">CGPA</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 relative z-10">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {totalSubjects} subjects recorded
                            </span>
                            {semestersText && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="text-[11px] font-bold text-[#1a3884] dark:text-blue-400">
                                  {semestersText}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* Delete Button (Visible on Hover) */}
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="absolute right-3 bottom-3 z-20 flex translate-y-2 items-center justify-center rounded-lg border border-red-100 bg-white p-2 text-red-500 opacity-0 shadow-sm transition-all hover:bg-red-50 group-hover:translate-y-0 group-hover:opacity-100 dark:border-red-900/30 dark:bg-[#001024] dark:hover:bg-red-900/20"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1f4e]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#1a3884]/30 dark:bg-[#001630]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#1a3884]/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <IconInfoCircle size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0d1f4e] dark:text-white">How Each Method Works</h2>
                </div>
                <button onClick={() => setShowGuideModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#00204d]">
                  <IconX size={20} />
                </button>
              </div>
              
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#1a3884] dark:text-blue-400">1. Slab-Based Method <span className="text-sm font-normal text-slate-500">(Anna University)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Converts your Letter Grade into a predefined Grade Point, multiplies it by the subject's credits, and then divides the total points by your total credits.</p>
                  
                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Letter Grades or exact Points.
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">O = 10</span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">A+ = 9</span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">A = 8</span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">B+ = 7</span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">B = 6</span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">C = 5</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#000a1a] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You get an <span className="font-bold text-blue-600 dark:text-blue-400">A+</span> in a <span className="font-bold text-blue-600 dark:text-blue-400">4-credit</span> course.<br/>
                    A+ translates to 9 points.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (9 points × 4 credits) ÷ 4 total credits = 9.0 GPA</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#1a3884] dark:text-blue-400">2. Continuous Method <span className="text-sm font-normal text-slate-500">(Madras University)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Uses your exact marks divided by 10 to get a precise decimal grade point, then calculates the credit-weighted average.</p>
                  
                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Exact Decimal Points (e.g., <span className="font-bold dark:text-white">8.7</span>) or total Marks (e.g., <span className="font-bold dark:text-white">87</span>). The calculator automatically divides marks by 10.
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#000a1a] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You score <span className="font-bold text-blue-600 dark:text-blue-400">87 marks</span> in a <span className="font-bold text-blue-600 dark:text-blue-400">3-credit</span> course.<br/>
                    87 marks ÷ 10 = 8.7 Grade Points.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (8.7 points × 3 credits) ÷ 3 total credits = 8.7 GPA</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <h3 className="mb-2 text-lg font-bold text-[#1a3884] dark:text-blue-400">3. Equal-Credit Method <span className="text-sm font-normal text-slate-500">(Autonomous)</span></h3>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Treats every subject equally by completely ignoring the credits. It calculates a simple average of your grade points.</p>

                  <div className="mb-3 rounded-lg bg-blue-50/50 p-3 text-sm dark:bg-blue-900/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">What you can enter:</span> Grade Points or Marks. Credits can be left blank or will be completely ignored.
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-[#000a1a] dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Example:</span> You score <span className="font-bold text-blue-600 dark:text-blue-400">8.5</span> in Math (4 credits) and <span className="font-bold text-blue-600 dark:text-blue-400">9.5</span> in Lab (1 credit).<br/>
                    The credits are completely ignored.<br/>
                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold">Calculation: (8.5 + 9.5) ÷ 2 = 9.0 CGPA</div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-900/10">
                    <h3 className="mb-2 text-lg font-bold text-[#1a3884] dark:text-blue-400">How is GPA calculated?</h3>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0d1f4e]/40 p-4 backdrop-blur-sm dark:bg-black/60 lg:pl-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#1a3884]/30 dark:bg-[#001630]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#1a3884]/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <IconTarget size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0d1f4e] dark:text-white">Set Target Goal</h2>
                </div>
                <button
                  onClick={() => setShowTargetModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#00204d]"
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
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-lg font-bold text-[#1a3884] placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700/60 dark:bg-[#000a1a] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500"
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
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-lg font-bold text-[#1a3884] placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700/60 dark:bg-[#000a1a] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Enter the total number of {activeMethod === "equal" ? "subjects" : "credits"} required to complete your entire degree.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-[#1a3884]/20 dark:bg-[#001024]">
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
                  className="flex-[2] rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Set Target
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
