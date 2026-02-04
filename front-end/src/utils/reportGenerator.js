import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Quotient information with full names and descriptions
const quotientInfo = {
    CRQ: { name: 'Cognitive Reasoning', fullName: 'Cognitive Reasoning Quotient', desc: 'Critical thinking & logical reasoning' },
    SRQ: { name: 'Self-regulation & Drive', fullName: 'Self-regulation & Drive Quotient', desc: 'Motivation, resilience & emotional control' },
    LQ: { name: 'Learning Agility', fullName: 'Learning Agility Quotient', desc: 'Adaptability & continuous learning' },
    SIQ: { name: 'Social Interaction', fullName: 'Social Interaction Quotient', desc: 'Collaboration, empathy & communication' },
    PEQ: { name: 'Professional Execution', fullName: 'Professional Execution Quotient', desc: 'Work ethic, reliability & delivery' },
    DAQ: { name: 'Digital & AI Literacy', fullName: 'Digital & AI Literacy Quotient', desc: 'Tech proficiency & AI readiness' }
};

// Helper: Get score color based on percentage
const getScoreColor = (score) => {
    if (score >= 81) return [0, 200, 83]; // Super Green (Bright Green)
    if (score >= 61) return [76, 175, 80]; // Green
    if (score >= 41) return [255, 235, 59]; // Yellow
    if (score >= 21) return [255, 152, 0]; // Orange
    return [244, 67, 54]; // Red
};

// Helper: Get feedback based on level (Simulated AI Response)
const getFeedback = (quotient, level) => {
    const feedbacks = {
        CRQ: {
            Advanced: "Demonstrates exceptional critical thinking and logical reasoning capabilities. You can deconstruct complex problems efficiently and identify nuanced patterns that others might miss. Your cognitive processing speed and accuracy are extremely high.",
            Strong: "Shows strong analytical skills and solid reasoning ability. You can handle most complex situations effectively and make sound decisions based on logic. Continue to challenge yourself with multi-faceted problems.",
            Progressing: "Your reasoning skills are developing well. You can handle standard problems but may need more time or structure for highly complex scenarios. Focus on breaking down problems into smaller components.",
            Developing: "You are in the early stages of developing structured reasoning. You may find complex logical puzzles challenging. Practice deliberate problem-solving techniques to build this muscle.",
            Emerging: "Foundational reasoning skills are present but require significant nurturing. You may rely more on intuition than logic. Structured exercises in logic and pattern recognition will be very beneficial."
        },
        SRQ: {
            Advanced: "Exhibits outstanding emotional control and drive. You stay calm under extreme pressure and are self-motivated to a rarely seen degree. You are a natural anchor for others during turbulent times.",
            Strong: "Very good self-regualtion and motivation. You bounce back from setbacks quickly and generally maintain focus on your goals. Occasional high-stress situations may still test you, but you handle them well.",
            Progressing: "You are learning to manage your emotions and drive. While you have good days, stress can sometimes derail your focus. Building consistent daily habits will help stabilize your performance.",
            Developing: "You struggle somewhat with self-motivation or emotional regulation. Setbacks might discourage you easily. Focus on small wins to build confidence and resilience.",
            Emerging: "Significant challenges with motivation or emotional control detected. You may often feel overwhelmed. Priority should be placed on stress-management techniques and setting very achievable micro-goals."
        },
        LQ: {
            Advanced: "A voracious and agile learner. You adapt to new information instantly and seek out knowledge proactively. Your ability to unlearn and relearn is a major competitive advantage.",
            Strong: "Good learning agility. You are open to new ideas and adapt reasonably well to change. You are willing to learn new skills when required by the situation.",
            Progressing: "You can learn new things but prefer structured environments. Rapid change might feel uncomfortable. Try to push your comfort zone by exploring unfamiliar topics proactively.",
            Developing: "Learning new skills takes effort and time for you. You may value tradition over novelty. To grow, try to adopt a 'beginner's mindset' more often.",
            Emerging: "You may be resistant to new learning or change. This rigidity can hinder growth. Focus on curiosity and asking 'why' to spark the learning process."
        },
        SIQ: {
            Advanced: "Masterful social intelligence. You read rooms instantly, empathize deeply, and communicate with high impact. You can build consensus and lead diverse groups effortlessly.",
            Strong: "Strong collaborator and communicator. You work well in team settings and can resolve standard conflicts. You are generally liked and trusted by peers.",
            Progressing: "You are developing your social radar. You communicate clearly but may miss subtle non-verbal cues. Practice active listening to deepen your connections.",
            Developing: "Social situations may drain you or feel confusing. You might prefer solitary work. Developing a few key communication scripts can help you navigate teamwork more comfortably.",
            Emerging: "Social interaction is a significant challenge. You may struggle to understand others' perspectives. tailored coaching in communication and empathy is recommended."
        },
        PEQ: {
            Advanced: "The epitome of reliability and professional excellence. You deliver high-quality work consistently and ethically. Your reputation is likely one of your strongest assets.",
            Strong: "Highly reliable and professional. You meet deadlines and maintain good standards of quality. You are a dependable team member who takes ownership of tasks.",
            Progressing: "You are building your professional identity. You usually deliver, but consistency might vary. Focus on time management and attention to detail to level up.",
            Developing: "You are still learning professional norms. Deadlines or quality standards might occasionally slip. mentorship on workplace expectations would be valuable.",
            Emerging: "Significant gaps in professional execution. Reliability or quality issues needs addressing immediately. Focus on the basics: punctuality, honesty, and finishing what you start."
        },
        DAQ: {
            Advanced: "A digital native with high AI readiness. You leverage technology to multiply your output and are comfortable with cutting-edge tools. You see technology as an extension of your mind.",
            Strong: "Competent with digital tools and modern workflows. You can use AI and tech effectively for work. You adapt to new software with relative ease.",
            Progressing: "You are comfortable with standard tools but may hesitate with advanced tech or AI. Training in specific modern digital tools will boost your confidence.",
            Developing: "You might find new technology intimidating. You stick to what you know. Guided exploration of user-friendly AI tools can help demystify tech for you.",
            Emerging: "Digital literacy is a hurdle. You may avoid technology where possible. Fundamental training in digital basics is the first step."
        }
    };
    return feedbacks[quotient]?.[level] || "Analysis pending further data. Continue monitoring progress.";
};

// Exported Generator Function
export const generateAssessmentReport = (user, testResults) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Theme styling
    const navy = [0, 33, 71];
    const teal = [48, 145, 157];
    const grey = [100, 100, 100];

    const addHeader = (y = 0) => {
        doc.setFillColor(...navy);
        doc.rect(0, y, pageWidth, 35, 'F');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("SMAART INSTITUTE", margin, y + 18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("INTELLIGENCE ASSESSMENT REPORT", margin, y + 28);
    };

    const addFooter = () => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by SMAART Institute AI System • All Rights Reserved", margin, pageHeight - 10);
        doc.text("Confidential Report", pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    // --- CONSOLIDATED SINGLE PAGE LAYOUT ---
    addHeader();

    // 1. Candidate Info Row
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CANDIDATE:", margin, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`${user?.fullName || 'Student'}`, margin + 25, 45);

    doc.setFont("helvetica", "bold");
    doc.text("STUDENT ID:", pageWidth / 2, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`${user?.studentId || user?.email || 'N/A'}`, pageWidth / 2 + 25, 45);

    doc.setFont("helvetica", "bold");
    doc.text("GENERATED:", margin, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date().toLocaleDateString()}`, margin + 25, 50);

    doc.setDrawColor(...teal);
    doc.setLineWidth(0.3);
    doc.line(margin, 55, pageWidth - margin, 55);

    // 2. Overall Readiness (Condensed)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text("Readiness Profile Index", margin, 65);

    const baselineScore = testResults?.baselineScore || 0;

    doc.setFontSize(10);
    doc.setTextColor(...grey);
    doc.text(`Current Band: ${testResults?.stageBand || 'N/A'}`, margin, 71);

    const barWidth = pageWidth - (margin * 2);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, 73, barWidth, 8, 2, 2, 'F');
    const fillWidth = (barWidth * baselineScore) / 100;
    doc.setFillColor(...getScoreColor(baselineScore));
    if (fillWidth > 0) doc.roundedRect(margin, 73, fillWidth, 8, 2, 2, 'F');

    // 3. Executive Summary (Very Condensed)
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text("Executive Summary", margin, 92);

    const summaryText = `Based on your analysis, you exhibit an '${testResults?.stageBand || 'Emerging'}' level of readiness. This profile integrates your performance across six specialized quotients. Your scores suggest a foundation that can be significantly enhanced through targeted growth in the lower-performing areas identified below.`;
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "normal");
    const splitSummary = doc.splitTextToSize(summaryText, barWidth);
    doc.text(splitSummary, margin, 98);

    // 4. Quotient Breakdown (2-Column Layout)
    const quotients = testResults?.t1Profile || {};
    const quotientKeys = Object.keys(quotients);
    const colWidth = (pageWidth - (margin * 2) - 10) / 2; // 10mm gap
    let yPos = 120;

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 115, pageWidth - margin, 115);

    quotientKeys.forEach((key, index) => {
        const isRightCol = index % 2 === 1;
        const xPos = isRightCol ? margin + colWidth + 10 : margin;
        if (isRightCol) {
            // No need to update yPos yet as we are in the same row
        } else if (index > 0) {
            yPos += 55; // Move to next row
        }

        const data = quotients[key];
        const info = quotientInfo[key];
        const feedback = getFeedback(key, data.level);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...navy);
        doc.text(`${info?.name || key}`, xPos, yPos);

        // Mini Bar
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(xPos, yPos + 3, colWidth, 4, 1, 1, 'F');
        doc.setFillColor(...getScoreColor(data.rawScore));
        doc.roundedRect(xPos, yPos + 3, (colWidth * data.rawScore) / 100, 4, 1, 1, 'F');

        // AI Insight
        doc.setFontSize(8);
        doc.setTextColor(...teal);
        doc.setFont("helvetica", "bold");
        doc.text("AI INSIGHT", xPos, yPos + 13);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        const splitFeedback = doc.splitTextToSize(feedback, colWidth);
        const limitedFeedback = splitFeedback.slice(0, 7); // Prevent overlap by limiting lines
        doc.text(limitedFeedback, xPos, yPos + 18);
    });

    addFooter();

    // Save
    doc.save(`SMAART_Analysis_${user?.studentId || 'Report'}.pdf`);
    toast.success('📥 AI Report downloaded successfully!');
};
