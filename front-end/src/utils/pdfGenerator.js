import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { big5Explanations } from '../utils/big5Utils';

export const generateBig5Report = async (scores, userData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Colors
    const primaryColor = [20, 184, 166]; // Teal
    const darkGray = [55, 65, 81];
    const lightGray = [156, 163, 175];

    // Header with gradient background
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Big Five Personality Assessment', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive Personality Report', pageWidth / 2, 25, { align: 'center' });

    // User Information - Larger and Bold
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Name: ${userData.fullName || 'N/A'}`, 20, 50);
    pdf.text(`College: ${userData.collegeName || 'N/A'}`, 20, 57);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 50, { align: 'right' });

    let yPosition = 72;

    // Capture radar chart with maximum size
    const chartElement = document.getElementById('big5-radar-chart');
    if (chartElement) {
        try {
            const canvas = await html2canvas(chartElement, {
                scale: 4, // Maximum scale for best quality
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 180; // 180mm - nearly full page width
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 8;
        } catch (error) {
            console.error('Error capturing chart:', error);
            yPosition += 10;
        }
    }

    // Scores Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Your Scores', 20, yPosition);
    yPosition += 8;

    // Draw scores table
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

    traits.forEach((trait) => {
        const data = scores[trait];
        if (!data) return;

        const traitName = big5Explanations[trait].name;
        const score = data.raw;
        const percentage = score / 40;

        // Trait name
        pdf.setFont('helvetica', 'bold');
        pdf.text(traitName, 20, yPosition);

        // Draw progress bar
        const barWidth = 100;
        const barHeight = 4;
        const barX = pageWidth - 120;

        // Background bar
        pdf.setFillColor(229, 231, 235);
        pdf.roundedRect(barX, yPosition - 3, barWidth, barHeight, 1, 1, 'F');

        // Foreground bar with color based on percentage
        let barColor;
        if (percentage <= 0.25) barColor = [239, 68, 68];
        else if (percentage <= 0.50) barColor = [245, 158, 11];
        else if (percentage <= 0.75) barColor = [74, 222, 128];
        else barColor = [22, 163, 74];

        pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
        pdf.roundedRect(barX, yPosition - 3, barWidth * percentage, barHeight, 1, 1, 'F');

        yPosition += 10;
        pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        pdf.setFontSize(10);
    });

    // Add new page for explanations
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Understanding Your Results', 20, yPosition);
    yPosition += 10;

    // Detailed explanations
    traits.forEach((trait) => {
        const data = scores[trait];
        if (!data) return;

        const traitInfo = big5Explanations[trait];
        const level = data.level;
        const explanation = traitInfo[level];

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
        }

        // Trait header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text(traitInfo.name, 20, yPosition);
        yPosition += 8;

        // Explanation
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        const splitText = pdf.splitTextToSize(explanation, pageWidth - 40);
        pdf.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 8;
    });

    // Footer on last page
    pdf.setFontSize(8);
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.text(
        'This report is based on the Big Five personality model and provides insights into your personality traits.',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
    );

    // Save PDF
    const fileName = `Big5_Report_${userData.fullName?.replace(/\s+/g, '_') || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
};
