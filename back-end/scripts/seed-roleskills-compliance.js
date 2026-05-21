/**
 * Seed Script: roleSkills Collection
 * Populates the roleSkills MongoDB collection for:
 *   - Data Protection & Privacy Compliance
 *   - Cybersecurity & Risk
 *   - GRC & Regulatory
 *   - Management Consulting
 *   - Business Analyst
 *
 * Run: node scripts/seed-roleskills-compliance.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

const RoleSkillSchema = new mongoose.Schema({
  jobFamily: { type: String, required: true },
  jobCode:   { type: String, required: true },
  roleTitle: { type: String, required: true, unique: true },
  skills:    [{
    skillCategory:    String,
    skillName:        String,
    certificationName: String,
    platform:         String,
    importance:       String
  }],
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const RoleSkillModel = mongoose.models['RoleSkill'] ||
  mongoose.model('RoleSkill', RoleSkillSchema, 'roleSkills');

// ─── SEED DATA ──────────────────────────────────────────────────────────────

const ROLES = [

  // ══════════════════════════════════════════════════════
  // JOB FAMILY: Data Protection & Privacy Compliance
  // ══════════════════════════════════════════════════════
  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-001',
    roleTitle: 'GRC Analyst',
    skills: [
      // Governance, Risk & Compliance
      { skillCategory: 'Governance & Frameworks', skillName: 'ISO 27001',              certificationName: 'ISO 27001 Lead Implementer', platform: 'BSI / PECB',    importance: 'High'   },
      { skillCategory: 'Governance & Frameworks', skillName: 'NIST Cybersecurity Framework', certificationName: 'NIST CSF Practitioner', platform: 'ISACA',       importance: 'High'   },
      { skillCategory: 'Governance & Frameworks', skillName: 'COBIT 2019',              certificationName: 'COBIT Foundation',          platform: 'ISACA',         importance: 'Medium' },
      { skillCategory: 'Governance & Frameworks', skillName: 'IT Governance',           certificationName: 'CGEIT',                     platform: 'ISACA',         importance: 'Medium' },
      // Risk Management
      { skillCategory: 'Risk Management',         skillName: 'Risk Assessment & Registers', certificationName: null,                   platform: null,            importance: 'High'   },
      { skillCategory: 'Risk Management',         skillName: 'Threat Modelling',         certificationName: null,                      platform: null,            importance: 'High'   },
      { skillCategory: 'Risk Management',         skillName: 'COSO ERM Framework',        certificationName: null,                     platform: null,            importance: 'Medium' },
      { skillCategory: 'Risk Management',         skillName: 'Business Continuity Planning', certificationName: 'CBCP',               platform: 'DRII',          importance: 'Medium' },
      // Compliance & Audit
      { skillCategory: 'Compliance & Audit',      skillName: 'GDPR Compliance',          certificationName: 'CIPP/E',                  platform: 'IAPP',          importance: 'High'   },
      { skillCategory: 'Compliance & Audit',      skillName: 'SOC 2 Auditing',            certificationName: null,                     platform: 'AICPA',         importance: 'High'   },
      { skillCategory: 'Compliance & Audit',      skillName: 'Internal Audit Practices',  certificationName: 'CIA',                    platform: 'IIA',           importance: 'Medium' },
      { skillCategory: 'Compliance & Audit',      skillName: 'HIPAA Compliance',          certificationName: null,                     platform: null,            importance: 'Medium' },
      // Tools
      { skillCategory: 'GRC Tools & Technology',  skillName: 'ServiceNow GRC',           certificationName: 'ServiceNow CSA',          platform: 'ServiceNow',    importance: 'Medium' },
      { skillCategory: 'GRC Tools & Technology',  skillName: 'RSA Archer',               certificationName: null,                     platform: 'RSA',           importance: 'Low'    },
      { skillCategory: 'GRC Tools & Technology',  skillName: 'Microsoft Excel / Power BI', certificationName: null,                   platform: 'Microsoft',     importance: 'High'   },
      // Certifications
      { skillCategory: 'Key Certifications',      skillName: 'CISA',                     certificationName: 'Certified Information Systems Auditor', platform: 'ISACA', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CRISC',                    certificationName: 'Certified in Risk & Information Systems Control', platform: 'ISACA', importance: 'High' },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-002',
    roleTitle: 'Information Security Manager',
    skills: [
      { skillCategory: 'Security Management',     skillName: 'Security Policy Development',  certificationName: null,           platform: null,         importance: 'High'   },
      { skillCategory: 'Security Management',     skillName: 'Security Program Management',  certificationName: 'CISM',         platform: 'ISACA',      importance: 'High'   },
      { skillCategory: 'Security Management',     skillName: 'Vendor Risk Management',       certificationName: null,           platform: null,         importance: 'High'   },
      { skillCategory: 'Security Management',     skillName: 'Security Budget Planning',     certificationName: null,           platform: null,         importance: 'Medium' },
      { skillCategory: 'Technical Security',      skillName: 'Network Security Architecture', certificationName: 'CISSP',       platform: '(ISC)²',     importance: 'High'   },
      { skillCategory: 'Technical Security',      skillName: 'Penetration Testing Concepts', certificationName: 'CEH',          platform: 'EC-Council', importance: 'Medium' },
      { skillCategory: 'Technical Security',      skillName: 'SIEM / SOC Operations',       certificationName: null,           platform: 'Splunk / QRadar', importance: 'High' },
      { skillCategory: 'Technical Security',      skillName: 'Incident Response',           certificationName: 'GCIH',         platform: 'SANS GIAC',  importance: 'High'   },
      { skillCategory: 'Compliance',              skillName: 'ISO 27001 Management',        certificationName: 'ISO 27001 LA', platform: 'PECB',       importance: 'High'   },
      { skillCategory: 'Compliance',              skillName: 'Data Protection Act / PDPA',  certificationName: null,           platform: null,         importance: 'High'   },
      { skillCategory: 'Compliance',              skillName: 'PCI-DSS',                     certificationName: 'QSA',          platform: 'PCI SSC',    importance: 'Medium' },
      { skillCategory: 'Leadership & Reporting',  skillName: 'Board-Level Reporting',       certificationName: null,           platform: null,         importance: 'High'   },
      { skillCategory: 'Leadership & Reporting',  skillName: 'Team Leadership',             certificationName: null,           platform: null,         importance: 'High'   },
      { skillCategory: 'Key Certifications',      skillName: 'CISM',                        certificationName: 'Certified Information Security Manager', platform: 'ISACA', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CISSP',                       certificationName: 'Certified Information Systems Security Professional', platform: '(ISC)²', importance: 'High' },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-003',
    roleTitle: 'RegTech Analyst',
    skills: [
      { skillCategory: 'Regulatory Technology',   skillName: 'Regulatory Reporting Automation', certificationName: null,        platform: 'Axway / Suade',  importance: 'High'   },
      { skillCategory: 'Regulatory Technology',   skillName: 'Financial Compliance Tech Stack',  certificationName: null,       platform: null,             importance: 'High'   },
      { skillCategory: 'Regulatory Technology',   skillName: 'AML / KYC Automation',           certificationName: null,        platform: 'NICE Actimize',  importance: 'High'   },
      { skillCategory: 'Regulatory Technology',   skillName: 'eIDAS & Digital Identity',        certificationName: null,       platform: null,             importance: 'Medium' },
      { skillCategory: 'Data & Analytics',        skillName: 'Python for Regulatory Reporting', certificationName: null,        platform: 'Python.org',    importance: 'High'   },
      { skillCategory: 'Data & Analytics',        skillName: 'SQL for Compliance Queries',      certificationName: null,       platform: null,             importance: 'High'   },
      { skillCategory: 'Data & Analytics',        skillName: 'Power BI / Tableau',              certificationName: null,       platform: 'Microsoft / Salesforce', importance: 'Medium' },
      { skillCategory: 'Financial Regulations',   skillName: 'MiFID II',                        certificationName: null,       platform: null,             importance: 'High'   },
      { skillCategory: 'Financial Regulations',   skillName: 'Basel III / IV',                  certificationName: 'FRM',      platform: 'GARP',           importance: 'Medium' },
      { skillCategory: 'Financial Regulations',   skillName: 'FATCA & CRS Reporting',           certificationName: null,       platform: null,             importance: 'Medium' },
      { skillCategory: 'Privacy & Data',          skillName: 'GDPR',                            certificationName: 'CIPP/E',   platform: 'IAPP',           importance: 'High'   },
      { skillCategory: 'Privacy & Data',          skillName: 'Data Governance',                 certificationName: 'CDMP',     platform: 'DAMA',           importance: 'Medium' },
      { skillCategory: 'Key Certifications',      skillName: 'CIPP/E',                          certificationName: 'Certified Information Privacy Professional (Europe)', platform: 'IAPP', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'FRM',                             certificationName: 'Financial Risk Manager', platform: 'GARP', importance: 'Medium' },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-004',
    roleTitle: 'Digital Assets Compliance Analyst',
    skills: [
      { skillCategory: 'Blockchain & Crypto Compliance', skillName: 'Crypto AML/KYC Compliance', certificationName: 'CAMS',   platform: 'ACAMS',          importance: 'High'   },
      { skillCategory: 'Blockchain & Crypto Compliance', skillName: 'DeFi Risk Assessment',       certificationName: null,    platform: null,             importance: 'High'   },
      { skillCategory: 'Blockchain & Crypto Compliance', skillName: 'Smart Contract Audit Basics', certificationName: null,   platform: 'Ethereum / Solidity', importance: 'Medium' },
      { skillCategory: 'Blockchain & Crypto Compliance', skillName: 'VASP Regulation (FATF)',      certificationName: null,   platform: null,             importance: 'High'   },
      { skillCategory: 'Regulatory Frameworks',   skillName: 'MiCA (Markets in Crypto-Assets)',  certificationName: null,    platform: 'EU',             importance: 'High'   },
      { skillCategory: 'Regulatory Frameworks',   skillName: 'Travel Rule Compliance',           certificationName: null,    platform: 'TRISA / OpenVASP', importance: 'High'  },
      { skillCategory: 'Regulatory Frameworks',   skillName: 'SEC / CFTC Crypto Regulations',   certificationName: null,    platform: null,             importance: 'Medium' },
      { skillCategory: 'Data & Risk Tools',       skillName: 'Chainalysis / Elliptic',          certificationName: null,    platform: 'Chainalysis',    importance: 'High'   },
      { skillCategory: 'Data & Risk Tools',       skillName: 'SQL for Transaction Monitoring',   certificationName: null,   platform: null,             importance: 'High'   },
      { skillCategory: 'Data & Risk Tools',       skillName: 'Excel / Google Sheets - Advanced', certificationName: null,   platform: 'Microsoft',      importance: 'Medium' },
      { skillCategory: 'Privacy & Security',      skillName: 'Data Privacy in Web3',             certificationName: null,   platform: null,             importance: 'Medium' },
      { skillCategory: 'Privacy & Security',      skillName: 'GDPR for Blockchain Data',         certificationName: 'CIPP/E', platform: 'IAPP',         importance: 'High'   },
      { skillCategory: 'Key Certifications',      skillName: 'CAMS',                             certificationName: 'Certified Anti-Money Laundering Specialist', platform: 'ACAMS', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'Crypto Compliance Professional',   certificationName: null,   platform: 'ACFCS',          importance: 'High'   },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-005',
    roleTitle: 'Data Protection Officer',
    skills: [
      { skillCategory: 'Privacy Law & Compliance', skillName: 'GDPR (EU Regulation)',     certificationName: 'CIPP/E',   platform: 'IAPP',           importance: 'High'   },
      { skillCategory: 'Privacy Law & Compliance', skillName: 'UK GDPR / Data Protection Act 2018', certificationName: null, platform: null,          importance: 'High'   },
      { skillCategory: 'Privacy Law & Compliance', skillName: 'CCPA / CPRA (California)', certificationName: 'CIPP/US',  platform: 'IAPP',           importance: 'Medium' },
      { skillCategory: 'Privacy Law & Compliance', skillName: 'PDPA (Singapore/Thailand)', certificationName: null,      platform: null,             importance: 'Medium' },
      { skillCategory: 'Privacy Operations',       skillName: 'Data Subject Access Requests (DSAR)', certificationName: null, platform: null,          importance: 'High'   },
      { skillCategory: 'Privacy Operations',       skillName: 'Privacy Impact Assessment (PIA/DPIA)', certificationName: null, platform: null,         importance: 'High'   },
      { skillCategory: 'Privacy Operations',       skillName: 'Records of Processing Activities (ROPA)', certificationName: null, platform: null,      importance: 'High'   },
      { skillCategory: 'Privacy Operations',       skillName: 'Breach Notification Management', certificationName: null,  platform: null,             importance: 'High'   },
      { skillCategory: 'Technical Privacy',        skillName: 'Privacy by Design',              certificationName: null,  platform: null,             importance: 'High'   },
      { skillCategory: 'Technical Privacy',        skillName: 'Data Anonymisation / Pseudonymisation', certificationName: null, platform: null,        importance: 'High'   },
      { skillCategory: 'Technical Privacy',        skillName: 'OneTrust / TrustArc',            certificationName: null,  platform: 'OneTrust',       importance: 'Medium' },
      { skillCategory: 'Leadership',               skillName: 'Stakeholder Reporting',           certificationName: null,  platform: null,             importance: 'High'   },
      { skillCategory: 'Leadership',               skillName: 'Privacy Training & Awareness',    certificationName: null,  platform: null,             importance: 'Medium' },
      { skillCategory: 'Key Certifications',       skillName: 'CIPP/E',                          certificationName: 'Certified Information Privacy Professional', platform: 'IAPP', importance: 'High' },
      { skillCategory: 'Key Certifications',       skillName: 'CIPM',                            certificationName: 'Certified Information Privacy Manager', platform: 'IAPP', importance: 'High' },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-006',
    roleTitle: 'Compliance Manager',
    skills: [
      { skillCategory: 'Compliance Frameworks',   skillName: 'Corporate Compliance Programs',  certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Compliance Frameworks',   skillName: 'Anti-Bribery & Corruption (ABC)', certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Compliance Frameworks',   skillName: 'Anti-Money Laundering (AML)',    certificationName: 'CAMS',   platform: 'ACAMS',      importance: 'High'   },
      { skillCategory: 'Compliance Frameworks',   skillName: 'Regulatory Change Management',   certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Risk & Audit',            skillName: 'Internal Controls Testing',      certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Risk & Audit',            skillName: 'Compliance Risk Assessments',    certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Risk & Audit',            skillName: 'Third-Party Risk Management',    certificationName: null,     platform: null,         importance: 'Medium' },
      { skillCategory: 'Data & Privacy',          skillName: 'GDPR Compliance Management',     certificationName: 'CIPP/E', platform: 'IAPP',       importance: 'High'   },
      { skillCategory: 'Data & Privacy',          skillName: 'Data Governance Frameworks',     certificationName: null,     platform: null,         importance: 'Medium' },
      { skillCategory: 'Tools & Reporting',       skillName: 'GRC Platforms (ServiceNow / Archer)', certificationName: null, platform: 'ServiceNow', importance: 'Medium' },
      { skillCategory: 'Tools & Reporting',       skillName: 'Policy Management Software',     certificationName: null,     platform: null,         importance: 'Medium' },
      { skillCategory: 'Leadership',              skillName: 'Compliance Training Delivery',   certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Leadership',              skillName: 'Board & Regulatory Reporting',   certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Key Certifications',      skillName: 'CCO',                             certificationName: 'Certified Compliance Officer', platform: 'SCCE', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CAMS',                            certificationName: 'Certified Anti-Money Laundering Specialist', platform: 'ACAMS', importance: 'High' },
    ]
  },

  {
    jobFamily: 'Data Protection & Privacy Compliance',
    jobCode:   'DPPC-007',
    roleTitle: 'Privacy Analyst',
    skills: [
      { skillCategory: 'Privacy Operations',      skillName: 'DSAR / ROPA Management',         certificationName: null,     platform: 'OneTrust',   importance: 'High'   },
      { skillCategory: 'Privacy Operations',      skillName: 'Privacy Impact Assessment',      certificationName: null,     platform: null,         importance: 'High'   },
      { skillCategory: 'Privacy Operations',      skillName: 'Cookie Consent Management',      certificationName: null,     platform: 'Cookiebot / OneTrust', importance: 'High' },
      { skillCategory: 'Regulations',             skillName: 'GDPR Fundamentals',              certificationName: 'CIPP/E', platform: 'IAPP',       importance: 'High'   },
      { skillCategory: 'Regulations',             skillName: 'ePrivacy Directive',             certificationName: null,     platform: null,         importance: 'Medium' },
      { skillCategory: 'Technical Skills',        skillName: 'SQL for Data Mapping',           certificationName: null,     platform: null,         importance: 'Medium' },
      { skillCategory: 'Technical Skills',        skillName: 'Privacy Tech Tools (OneTrust / TrustArc)', certificationName: null, platform: 'OneTrust', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CIPP/E',                          certificationName: 'IAPP CIPP/E',  platform: 'IAPP', importance: 'High'  },
    ]
  },

  // ══════════════════════════════════════════════════════
  // JOB FAMILY: Cybersecurity
  // ══════════════════════════════════════════════════════
  {
    jobFamily: 'Cybersecurity',
    jobCode:   'CYBER-001',
    roleTitle: 'Cybersecurity Analyst',
    skills: [
      { skillCategory: 'Threat & Incident',       skillName: 'SIEM / Log Analysis',            certificationName: 'Splunk Core Certified', platform: 'Splunk',   importance: 'High'   },
      { skillCategory: 'Threat & Incident',       skillName: 'Incident Response',              certificationName: 'GCIH',  platform: 'SANS GIAC',  importance: 'High'   },
      { skillCategory: 'Threat & Incident',       skillName: 'Vulnerability Assessment',       certificationName: null,    platform: 'Tenable / Qualys', importance: 'High' },
      { skillCategory: 'Threat & Incident',       skillName: 'Malware Analysis Basics',        certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Network Security',        skillName: 'Firewalls & IDS/IPS',            certificationName: null,    platform: 'Palo Alto / Cisco', importance: 'High' },
      { skillCategory: 'Network Security',        skillName: 'Network Packet Analysis',        certificationName: null,    platform: 'Wireshark', importance: 'Medium' },
      { skillCategory: 'Cloud Security',          skillName: 'AWS / Azure Security Basics',    certificationName: 'AWS Security Specialty', platform: 'AWS', importance: 'Medium' },
      { skillCategory: 'Compliance',              skillName: 'ISO 27001 / NIST CSF',           certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Key Certifications',      skillName: 'CompTIA Security+',              certificationName: 'CompTIA Security+', platform: 'CompTIA', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CEH',                            certificationName: 'Certified Ethical Hacker', platform: 'EC-Council', importance: 'High' },
    ]
  },

  {
    jobFamily: 'Cybersecurity',
    jobCode:   'CYBER-002',
    roleTitle: 'Penetration Tester',
    skills: [
      { skillCategory: 'Offensive Security',      skillName: 'Web Application Penetration Testing', certificationName: 'OSCP', platform: 'Offensive Security', importance: 'High' },
      { skillCategory: 'Offensive Security',      skillName: 'Network Penetration Testing',    certificationName: 'OSCP',  platform: 'Offensive Security', importance: 'High' },
      { skillCategory: 'Offensive Security',      skillName: 'Social Engineering',             certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Tools',                   skillName: 'Metasploit Framework',           certificationName: null,    platform: 'Rapid7',     importance: 'High'   },
      { skillCategory: 'Tools',                   skillName: 'Burp Suite',                    certificationName: 'Burp Suite Professional', platform: 'PortSwigger', importance: 'High' },
      { skillCategory: 'Tools',                   skillName: 'Nmap / Nessus',                 certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Programming',             skillName: 'Python Scripting',              certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Programming',             skillName: 'Bash / Shell Scripting',        certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Key Certifications',      skillName: 'OSCP',                           certificationName: 'Offensive Security Certified Professional', platform: 'Offensive Security', importance: 'High' },
      { skillCategory: 'Key Certifications',      skillName: 'CEH',                            certificationName: 'Certified Ethical Hacker', platform: 'EC-Council', importance: 'High' },
    ]
  },

  // ══════════════════════════════════════════════════════
  // JOB FAMILY: Management Consulting
  // ══════════════════════════════════════════════════════
  {
    jobFamily: 'Management Consulting',
    jobCode:   'MCON-001',
    roleTitle: 'Management Consultant',
    skills: [
      { skillCategory: 'Strategy & Analysis',     skillName: 'Business Strategy Frameworks',   certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Strategy & Analysis',     skillName: 'Market Research & Analysis',     certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Strategy & Analysis',     skillName: 'Financial Modelling',            certificationName: null,    platform: 'Excel / DCF', importance: 'High'  },
      { skillCategory: 'Strategy & Analysis',     skillName: 'McKinsey / BCG Frameworks',      certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Data & Analytics',        skillName: 'Excel (Advanced)',               certificationName: null,    platform: 'Microsoft',  importance: 'High'   },
      { skillCategory: 'Data & Analytics',        skillName: 'Power BI / Tableau',            certificationName: null,    platform: 'Microsoft / Tableau', importance: 'High' },
      { skillCategory: 'Data & Analytics',        skillName: 'SQL for Data Analysis',         certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Communication',           skillName: 'Executive Presentations (PowerPoint)', certificationName: null, platform: 'Microsoft', importance: 'High' },
      { skillCategory: 'Communication',           skillName: 'Client Stakeholder Management',  certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Key Certifications',      skillName: 'PMP',                            certificationName: 'Project Management Professional', platform: 'PMI', importance: 'Medium' },
      { skillCategory: 'Key Certifications',      skillName: 'Six Sigma Green Belt',           certificationName: null,    platform: 'ASQ',        importance: 'Medium' },
    ]
  },

  {
    jobFamily: 'Management Consulting',
    jobCode:   'MCON-002',
    roleTitle: 'Business Analyst',
    skills: [
      { skillCategory: 'Analysis & Requirements', skillName: 'Requirements Gathering',         certificationName: 'CBAP',  platform: 'IIBA',       importance: 'High'   },
      { skillCategory: 'Analysis & Requirements', skillName: 'Business Process Mapping (BPMN)', certificationName: null,   platform: null,         importance: 'High'   },
      { skillCategory: 'Analysis & Requirements', skillName: 'User Story Writing',             certificationName: null,    platform: 'JIRA',       importance: 'High'   },
      { skillCategory: 'Data',                    skillName: 'SQL Queries',                    certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Data',                    skillName: 'Excel Pivot Tables / VLOOKUP',  certificationName: null,    platform: 'Microsoft',  importance: 'High'   },
      { skillCategory: 'Data',                    skillName: 'Power BI Dashboards',            certificationName: null,    platform: 'Microsoft',  importance: 'Medium' },
      { skillCategory: 'Agile & PM',              skillName: 'Agile / Scrum Methodology',      certificationName: 'CSPO',  platform: 'Scrum Alliance', importance: 'High' },
      { skillCategory: 'Agile & PM',              skillName: 'JIRA / Confluence',              certificationName: null,    platform: 'Atlassian',  importance: 'High'   },
      { skillCategory: 'Stakeholder',             skillName: 'Stakeholder Communication',      certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Key Certifications',      skillName: 'CBAP',                           certificationName: 'Certified Business Analysis Professional', platform: 'IIBA', importance: 'High' },
    ]
  },

  // ══════════════════════════════════════════════════════
  // JOB FAMILY: Entrepreneurship
  // ══════════════════════════════════════════════════════
  {
    jobFamily: 'Entrepreneurship',
    jobCode:   'ENTR-001',
    roleTitle: 'Startup Founder',
    skills: [
      { skillCategory: 'Business Development',    skillName: 'Lean Startup Methodology',       certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Business Development',    skillName: 'Business Model Canvas',          certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Business Development',    skillName: 'Go-To-Market Strategy',          certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Finance',                 skillName: 'Pitch Deck Creation',            certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Finance',                 skillName: 'Financial Modelling & Forecasting', certificationName: null, platform: 'Excel / Google Sheets', importance: 'High' },
      { skillCategory: 'Finance',                 skillName: 'Fundraising / VC Pitch',         certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Technology',              skillName: 'No-Code / Low-Code Tools',       certificationName: null,    platform: 'Webflow / Bubble', importance: 'Medium' },
      { skillCategory: 'Technology',              skillName: 'Product Management Basics',      certificationName: null,    platform: null,         importance: 'High'   },
      { skillCategory: 'Marketing',               skillName: 'Digital Marketing (SEO/SEM)',    certificationName: null,    platform: 'Google / Meta', importance: 'High' },
      { skillCategory: 'Marketing',               skillName: 'Social Media Growth Hacking',    certificationName: null,    platform: null,         importance: 'Medium' },
      { skillCategory: 'Key Certifications',      skillName: 'Google Analytics',               certificationName: 'Google Analytics Certification', platform: 'Google', importance: 'Medium' },
    ]
  },

];

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────────────

async function seedRoleSkills() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    let inserted = 0;
    let skipped  = 0;
    let updated  = 0;

    for (const role of ROLES) {
      const existing = await RoleSkillModel.findOne({ roleTitle: role.roleTitle });
      if (existing) {
        // Update if exists
        await RoleSkillModel.updateOne(
          { roleTitle: role.roleTitle },
          { $set: { ...role, updatedAt: new Date() } }
        );
        console.log(`  🔄 Updated: ${role.roleTitle}`);
        updated++;
      } else {
        await RoleSkillModel.create(role);
        console.log(`  ✅ Inserted: ${role.roleTitle}`);
        inserted++;
      }
    }

    console.log(`\n📊 Seed Summary:`);
    console.log(`   Inserted : ${inserted}`);
    console.log(`   Updated  : ${updated}`);
    console.log(`   Skipped  : ${skipped}`);
    console.log(`   Total    : ${ROLES.length}`);

    const totalCount = await RoleSkillModel.countDocuments();
    console.log(`\n📦 Total roleSkills in DB: ${totalCount}`);

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

seedRoleSkills();
