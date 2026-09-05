// T1 Results Page - Enhanced Design with Download
// This section replaces the results display in BaseLineTest.jsx

// Add this helper function at the top of the component
const getBandColor = (level) => {
    switch (level) {
        case 'Advanced': return { bg: 'from-purple-500 to-violet-600', text: 'text-purple-700 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-500/20' };
        case 'Strong': return { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-500/20' };
        case 'Progressing': return { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-500/20' };
        case 'Developing': return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-500/20' };
        case 'Emerging': return { bg: 'from-rose-500 to-red-600', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-100 dark:bg-rose-500/20' };
        default: return { bg: 'from-slate-500 to-slate-600', text: 'text-slate-700 dark:text-slate-400', badge: 'bg-slate-100 dark:bg-slate-500/20' };
    }
};

const downloadReport = () => {
    const reportData = {
        studentName: user?.fullName || 'Student',
        studentId: user?.studentId || user?.email || 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        baselineScore: testResults?.baselineScore || 0,
        stageBand: testResults?.stageBand || 'Emerging',
        quotients: testResults?.t1Profile || {}
    };

    let reportContent = `╔═══════════════════════════════════════════════════════════════╗\n`;
    reportContent += `║          BASELINE ASSESSMENT REPORT - T1                      ║\n`;
    reportContent += `╚═══════════════════════════════════════════════════════════════╝\n\n`;
    reportContent += `Student: ${reportData.studentName}\n`;
    reportContent += `ID: ${reportData.studentId}\n`;
    reportContent += `Date: ${reportData.date}\n\n`;
    reportContent += `${'═'.repeat(65)}\n`;
    reportContent += `BASELINE READINESS INDEX: ${reportData.baselineScore}/100\n`;
    reportContent += `STAGE BAND: ${reportData.stageBand}\n`;
    reportContent += `${'═'.repeat(65)}\n\n`;
    reportContent += `QUOTIENT BREAKDOWN:\n\n`;

    const quotientNames = {
        CRQ: 'Cognitive Readiness Quotient',
        SRQ: 'Social Readiness Quotient',
        LQ: 'Learning Quotient',
        SIQ: 'Self-Identity Quotient',
        PEQ: 'Physical & Emotional Quotient',
        DAQ: 'Digital Age Quotient'
    };

    Object.entries(reportData.quotients).forEach(([key, data]) => {
        reportContent += `┌${'─'.repeat(63)}┐\n`;
        reportContent += `│ ${key} - ${quotientNames[key].padEnd(56)}│\n`;
        reportContent += `├${'─'.repeat(63)}┤\n`;
        reportContent += `│ Score: ${data.rawScore}%`.padEnd(64) + `│\n`;
        reportContent += `│ Level: ${data.level}`.padEnd(64) + `│\n`;
        reportContent += `│ Performance: ${data.earned}/${data.possible} correct`.padEnd(64) + `│\n`;
        reportContent += `└${'─'.repeat(63)}┘\n\n`;
    });

    reportContent += `${'═'.repeat(65)}\n\n`;
    reportContent += `BAND CLASSIFICATION SYSTEM:\n\n`;
    reportContent += `  Advanced    (81-100%): Exceptional mastery\n`;
    reportContent += `  Strong      (61-80%):  Solid competence\n`;
    reportContent += `  Progressing (41-60%):  Developing skills\n`;
    reportContent += `  Developing  (21-40%):  Early stage\n`;
    reportContent += `  Emerging    (0-20%):   Beginning journey\n\n`;
    reportContent += `${'═'.repeat(65)}\n`;
    reportContent += `\nThis is your baseline profile. Use this as your starting point\n`;
    reportContent += `for growth and development.\n`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `T1_Baseline_Report_${reportData.studentId}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully!');
};

// Quotient information with icons
const quotientInfo = {
    CRQ: { name: 'Cognitive Readiness', icon: '🧠', desc: 'Critical thinking & problem solving' },
    SRQ: { name: 'Social Readiness', icon: '🤝', desc: 'Interpersonal & communication skills' },
    LQ: { name: 'Learning Quotient', icon: '📚', desc: 'Adaptability & knowledge acquisition' },
    SIQ: { name: 'Self-Identity', icon: '🎯', desc: 'Self-awareness & personal values' },
    PEQ: { name: 'Physical & Emotional', icon: '💪', desc: 'Wellness & emotional intelligence' },
    DAQ: { name: 'Digital Age', icon: '💻', desc: 'Tech literacy & digital fluency' }
};
