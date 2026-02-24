const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', 'front-end', 'AI DATASET EXCEL DATAS');
const output = [];

// Get unique sectors from Job Families Master
const wb = XLSX.readFile(path.join(dir, 'SMAART_Job_Families_Master.xlsx'));
const roles = XLSX.utils.sheet_to_json(wb.Sheets['Existing_Roles_One_Per_Row']);
const sectors = [...new Set(roles.map(r => r['Sector Name']).filter(Boolean))];
output.push('=== UNIQUE SECTORS ===');
sectors.forEach(s => output.push(s));

output.push('\n=== CAREER LEVELS ===');
const levels = [...new Set(roles.map(r => r['Career Level']).filter(Boolean))];
levels.forEach(l => output.push(l));

output.push('\n=== SECTORS IN AI SKILLS FILE ===');
const wb2 = XLSX.readFile(path.join(dir, 'ABC_AI_Skills_Tools_Reference_Database_v1.xlsx'));
const aiTools = XLSX.utils.sheet_to_json(wb2.Sheets['AI_Tools']);
const aiSectors = [...new Set(aiTools.map(r => r['Sector']).filter(Boolean))];
aiSectors.forEach(s => output.push(s));

output.push('\n=== UNIQUE ROLES (first 50) IN AI SKILLS ===');
const aiRoles = [...new Set(aiTools.map(r => r['Role']).filter(Boolean))];
aiRoles.slice(0, 50).forEach(r => output.push(r));

output.push('\n=== SECTORS IN DEEP INTELLIGENCE ===');
const wb3 = XLSX.readFile(path.join(dir, 'SMAART_Job_Family_Deep_Intelligence_Complete.xlsx'));
const techSkills = XLSX.utils.sheet_to_json(wb3.Sheets['Technical_Skills']);
const deepSectors = [...new Set(techSkills.map(r => r['Sector']).filter(Boolean))];
deepSectors.forEach(s => output.push(s));

output.push('\n=== JOB FAMILIES ===');
const jfNames = [...new Set(techSkills.map(r => r['Job Family Name']).filter(Boolean))];
jfNames.forEach(j => output.push(j));

output.push('\n=== DOMAINS IN CERTIFICATIONS ===');
const wb4 = XLSX.readFile(path.join(dir, 'ABC_Technical_Skills_Directory_v1.xlsx'));
const certs = XLSX.utils.sheet_to_json(wb4.Sheets['All_Certifications']);
const domains = [...new Set(certs.map(r => r['Domain Name']).filter(Boolean))];
domains.forEach(d => output.push(d));

fs.writeFileSync(path.join(__dirname, 'excel_sectors.txt'), output.join('\n'));
console.log('Done! Check excel_sectors.txt');
