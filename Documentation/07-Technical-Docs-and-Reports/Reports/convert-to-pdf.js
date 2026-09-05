const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');
const path = require('path');

// Professional PDF styling
const pdfConfig = {
    stylesheet: [],
    css: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a2e;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    
    h1 {
      color: #004D99;
      font-size: 24pt;
      font-weight: 700;
      border-bottom: 3px solid #42A89B;
      padding-bottom: 10px;
      margin-top: 30px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #004D99;
      font-size: 16pt;
      font-weight: 600;
      margin-top: 25px;
      margin-bottom: 15px;
      border-left: 4px solid #42A89B;
      padding-left: 12px;
    }
    
    h3 {
      color: #333;
      font-size: 13pt;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    h4 {
      color: #555;
      font-size: 11pt;
      font-weight: 600;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    
    p {
      margin-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    th {
      background: linear-gradient(135deg, #004D99, #42A89B);
      color: white;
      font-weight: 600;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #ddd;
    }
    
    td {
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    tr:hover {
      background-color: #e8f4fc;
    }
    
    code {
      background-color: #f4f4f4;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 9pt;
      color: #c7254e;
    }
    
    pre {
      background-color: #1e1e2e;
      color: #cdd6f4;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
      margin: 15px 0;
    }
    
    pre code {
      background: none;
      border: none;
      padding: 0;
      color: inherit;
    }
    
    blockquote {
      border-left: 4px solid #B58539;
      background-color: #fff8e1;
      padding: 10px 15px;
      margin: 15px 0;
      font-style: italic;
    }
    
    ul, ol {
      margin-bottom: 15px;
      padding-left: 25px;
    }
    
    li {
      margin-bottom: 5px;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 25px 0;
    }
    
    strong {
      color: #004D99;
      font-weight: 600;
    }
    
    a {
      color: #42A89B;
      text-decoration: none;
    }
    
    .page-break {
      page-break-after: always;
    }
  `,
    pdf_options: {
        format: 'A4',
        margin: {
            top: '25mm',
            bottom: '25mm',
            left: '20mm',
            right: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
      <div style="width: 100%; font-size: 9px; padding: 5px 20px; color: #666; border-bottom: 1px solid #e0e0e0;">
        <span style="float: left; font-weight: bold; color: #004D99;">SMAART Minds</span>
        <span style="float: right;">Technical Documentation</span>
      </div>
    `,
        footerTemplate: `
      <div style="width: 100%; font-size: 9px; padding: 5px 20px; color: #666; text-align: center; border-top: 1px solid #e0e0e0;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span style="float: right;">Confidential</span>
      </div>
    `
    }
};

// Files to convert
const files = [
    { input: '01_TECHNICAL_FUNCTIONALITIES.md', output: '01_TECHNICAL_FUNCTIONALITIES.pdf' },
    { input: '02_SYSTEM_FLOW.md', output: '02_SYSTEM_FLOW.pdf' },
    { input: '03_REPORTS.md', output: '03_REPORTS.pdf' },
    { input: '04_TECH_MANUALS.md', output: '04_TECH_MANUALS.pdf' },
    { input: '05_BUG_FIX.md', output: '05_BUG_FIX.pdf' }
];

async function convertToPdf() {
    console.log('\\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     SMAART Minds - Professional PDF Generator               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\\n');

    for (const file of files) {
        const inputPath = path.join(__dirname, file.input);
        const outputPath = path.join(__dirname, file.output);

        if (!fs.existsSync(inputPath)) {
            console.log(`❌ File not found: ${file.input}`);
            continue;
        }

        console.log(`📄 Converting: ${file.input}...`);

        try {
            const pdf = await mdToPdf({ path: inputPath }, pdfConfig);

            if (pdf) {
                fs.writeFileSync(outputPath, pdf.content);
                console.log(`   ✅ Created: ${file.output}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\\n════════════════════════════════════════════════════════════');
    console.log('✨ PDF Generation Complete!');
    console.log('════════════════════════════════════════════════════════════\\n');
}

convertToPdf().catch(console.error);
