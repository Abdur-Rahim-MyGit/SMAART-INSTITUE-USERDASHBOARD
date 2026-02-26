/**
 * Career Mapping Data (Excel-like Structured Database)
 * ====================================================
 * This acts as the structured verified database layer.
 * In production, this would be loaded from Excel files via xlsx/exceljs.
 * For now, it's a comprehensive JSON dataset.
 *
 * Part of SMAART Toolkit - Career Data Fetcher
 */

// Skill-to-Job Mapping
const skillToJobMapping = {
    Technology: {
        skills: ['Programming', 'Data Structures', 'Cloud Computing', 'DevOps', 'Web Development', 'Mobile Development', 'Cybersecurity', 'Blockchain'],
        jobs: ['Software Engineer', 'Full Stack Developer', 'Cloud Architect', 'DevOps Engineer', 'Mobile App Developer', 'Cybersecurity Analyst', 'Blockchain Developer', 'QA Engineer'],
        avgSalary: '6-25 LPA',
        growth: 'High',
    },
    Business: {
        skills: ['Strategic Planning', 'Market Analysis', 'Financial Modeling', 'Project Management', 'Sales Strategy', 'Supply Chain', 'Business Analytics'],
        jobs: ['Business Analyst', 'Management Consultant', 'Product Manager', 'Marketing Manager', 'Operations Manager', 'Strategy Analyst', 'Account Manager'],
        avgSalary: '5-20 LPA',
        growth: 'Medium',
    },
    Healthcare: {
        skills: ['Clinical Research', 'Medical Coding', 'Biostatistics', 'Public Health', 'Health Informatics', 'Regulatory Affairs'],
        jobs: ['Clinical Research Associate', 'Healthcare Data Analyst', 'Medical Coder', 'Public Health Specialist', 'Health Informatics Specialist', 'Regulatory Affairs Officer'],
        avgSalary: '4-18 LPA',
        growth: 'Growing',
    },
    Finance: {
        skills: ['Financial Analysis', 'Risk Management', 'Investment Banking', 'Accounting', 'Taxation', 'FinTech', 'Quantitative Analysis'],
        jobs: ['Financial Analyst', 'Risk Analyst', 'Investment Banker', 'Chartered Accountant', 'Tax Consultant', 'FinTech Developer', 'Quantitative Analyst'],
        avgSalary: '5-30 LPA',
        growth: 'High',
    },
    Creative: {
        skills: ['UI/UX Design', 'Graphic Design', 'Content Writing', 'Video Production', 'Brand Strategy', 'Animation', 'Photography'],
        jobs: ['UI/UX Designer', 'Graphic Designer', 'Content Strategist', 'Video Editor', 'Brand Manager', 'Motion Graphics Artist', 'Creative Director'],
        avgSalary: '3-15 LPA',
        growth: 'Growing',
    },
    'Core Engineering': {
        skills: ['Mechanical Design', 'Civil Engineering', 'Electrical Systems', 'Manufacturing', 'Automotive Engineering', 'Structural Analysis'],
        jobs: ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Manufacturing Engineer', 'Automotive Engineer', 'Structural Engineer', 'Site Engineer'],
        avgSalary: '4-15 LPA',
        growth: 'Stable',
    },
    Education: {
        skills: ['Curriculum Design', 'Instructional Design', 'EdTech', 'Assessment Design', 'Training & Development', 'Educational Psychology'],
        jobs: ['Instructional Designer', 'EdTech Specialist', 'Corporate Trainer', 'Education Consultant', 'Learning Experience Designer', 'Academic Coordinator'],
        avgSalary: '3-12 LPA',
        growth: 'Growing',
    },
    Government: {
        skills: ['Public Administration', 'Policy Analysis', 'Governance', 'Legal Knowledge', 'Statistical Analysis', 'Communication'],
        jobs: ['Civil Services Officer', 'Policy Analyst', 'Government IT Officer', 'Defense Services', 'Bank PO/Clerk', 'PSU Engineer', 'Tax Officer'],
        avgSalary: '4-15 LPA',
        growth: 'Stable',
    },
};

// Emerging Jobs Database
const emergingJobsDatabase = {
    Technology: [
        { title: 'AI/ML Engineer', growth: '35% YoY', description: 'Build and deploy machine learning models and AI systems', aiLevel: 'Core AI Role' },
        { title: 'Prompt Engineer', growth: '50% YoY', description: 'Design and optimize prompts for generative AI systems', aiLevel: 'AI-Integrated' },
        { title: 'Data Engineer', growth: '28% YoY', description: 'Design data pipelines and infrastructure at scale', aiLevel: 'AI-Enhanced' },
        { title: 'Cloud Security Specialist', growth: '25% YoY', description: 'Secure cloud infrastructure and applications', aiLevel: 'AI-Assisted' },
        { title: 'AR/VR Developer', growth: '30% YoY', description: 'Build immersive experiences for enterprise and consumer', aiLevel: 'AI-Enhanced' },
    ],
    Business: [
        { title: 'AI Strategy Consultant', growth: '40% YoY', description: 'Guide organizations in AI adoption strategy', aiLevel: 'AI-Integrated' },
        { title: 'Growth Hacker', growth: '22% YoY', description: 'Use data-driven strategies for rapid business growth', aiLevel: 'AI-Assisted' },
        { title: 'Sustainability Manager', growth: '20% YoY', description: 'Lead ESG and sustainability initiatives', aiLevel: 'AI-Assisted' },
        { title: 'Digital Transformation Lead', growth: '30% YoY', description: 'Drive digital modernization across organizations', aiLevel: 'AI-Integrated' },
    ],
    Healthcare: [
        { title: 'AI-Driven Diagnostics Specialist', growth: '45% YoY', description: 'Use AI for medical imaging and diagnostics', aiLevel: 'Core AI Role' },
        { title: 'Telemedicine Coordinator', growth: '25% YoY', description: 'Manage remote healthcare delivery systems', aiLevel: 'AI-Assisted' },
        { title: 'Bioinformatics Analyst', growth: '28% YoY', description: 'Analyze biological data using computational tools', aiLevel: 'AI-Enhanced' },
    ],
    Finance: [
        { title: 'Algorithmic Trading Analyst', growth: '30% YoY', description: 'Design automated trading systems using AI', aiLevel: 'Core AI Role' },
        { title: 'Crypto/DeFi Analyst', growth: '35% YoY', description: 'Analyze decentralized finance protocols and crypto markets', aiLevel: 'AI-Enhanced' },
        { title: 'RegTech Specialist', growth: '22% YoY', description: 'Use technology for regulatory compliance automation', aiLevel: 'AI-Integrated' },
    ],
    Creative: [
        { title: 'AI Art Director', growth: '40% YoY', description: 'Direct creative production using AI-generated content', aiLevel: 'Core AI Role' },
        { title: 'UX Researcher (AI Products)', growth: '28% YoY', description: 'Research user experience for AI-powered products', aiLevel: 'AI-Integrated' },
        { title: 'Conversational Designer', growth: '35% YoY', description: 'Design chatbot and voice assistant experiences', aiLevel: 'Core AI Role' },
    ],
    'Core Engineering': [
        { title: 'Robotics Engineer', growth: '30% YoY', description: 'Design and program autonomous robotic systems', aiLevel: 'AI-Integrated' },
        { title: 'IoT Solutions Architect', growth: '25% YoY', description: 'Build connected device ecosystems', aiLevel: 'AI-Enhanced' },
        { title: 'Additive Manufacturing Engineer', growth: '20% YoY', description: 'Expert in 3D printing for manufacturing', aiLevel: 'AI-Assisted' },
    ],
    Education: [
        { title: 'AI Learning Designer', growth: '35% YoY', description: 'Design AI-powered adaptive learning systems', aiLevel: 'Core AI Role' },
        { title: 'EdTech Product Manager', growth: '25% YoY', description: 'Lead product development for educational technology', aiLevel: 'AI-Integrated' },
    ],
    Government: [
        { title: 'GovTech Specialist', growth: '20% YoY', description: 'Implement technology solutions for government services', aiLevel: 'AI-Assisted' },
        { title: 'Smart City Planner', growth: '18% YoY', description: 'Use technology and data to design smarter urban infrastructure', aiLevel: 'AI-Enhanced' },
    ],
};

// SMAART Internal Course Skill Matrix (15+ Human Intelligence Skills)
const humanIntelligenceSkills = [
    { name: 'Communication', category: 'Core', description: 'Articulate ideas clearly in verbal and written forms' },
    { name: 'Strategic Thinking', category: 'Leadership', description: 'Plan and execute long-term vision with clarity' },
    { name: 'Problem Solving', category: 'Core', description: 'Analyze challenges and develop effective solutions' },
    { name: 'Leadership', category: 'Leadership', description: 'Inspire and guide teams toward shared objectives' },
    { name: 'Emotional Intelligence', category: 'Interpersonal', description: 'Understand and manage emotions in professional settings' },
    { name: 'Negotiation', category: 'Business', description: 'Navigate discussions to achieve mutually beneficial outcomes' },
    { name: 'Adaptability', category: 'Core', description: 'Thrive in changing environments and embrace uncertainty' },
    { name: 'Decision Making', category: 'Leadership', description: 'Make informed choices under pressure and ambiguity' },
    { name: 'Critical Thinking', category: 'Core', description: 'Evaluate information objectively and make reasoned judgments' },
    { name: 'Time Management', category: 'Productivity', description: 'Prioritize tasks and manage time effectively' },
    { name: 'Creativity & Innovation', category: 'Creative', description: 'Generate novel ideas and approach challenges innovatively' },
    { name: 'Teamwork & Collaboration', category: 'Interpersonal', description: 'Work effectively with diverse teams and stakeholders' },
    { name: 'Conflict Resolution', category: 'Interpersonal', description: 'Mediate disputes and find constructive solutions' },
    { name: 'Networking & Relationship Building', category: 'Business', description: 'Build meaningful professional connections' },
    { name: 'Presentation Skills', category: 'Communication', description: 'Deliver compelling presentations to any audience' },
    { name: 'Work Ethics & Integrity', category: 'Core', description: 'Demonstrate reliability, honesty, and professional standards' },
    { name: 'Self-Awareness', category: 'Personal Growth', description: 'Understand strengths, weaknesses, and behavioral patterns' },
    { name: 'Cultural Intelligence', category: 'Interpersonal', description: 'Navigate diverse cultural contexts effectively' },
    { name: 'Resilience & Stress Management', category: 'Personal Growth', description: 'Maintain performance and well-being under pressure' },
    { name: 'Analytical Thinking', category: 'Core', description: 'Break down complex problems into manageable components' },
];

// Salary Insights by Sector & Experience
const salaryInsights = {
    IT: { entry: '4-8 LPA', mid: '10-20 LPA', senior: '20-40 LPA', growth: '12-18% annually' },
    'Core Engineering': { entry: '3-6 LPA', mid: '8-15 LPA', senior: '15-30 LPA', growth: '8-12% annually' },
    Startup: { entry: '3-7 LPA', mid: '10-25 LPA', senior: '25-50 LPA + equity', growth: '15-25% annually' },
    MNC: { entry: '5-10 LPA', mid: '12-25 LPA', senior: '25-50 LPA', growth: '10-15% annually' },
    Government: { entry: '3-6 LPA', mid: '6-12 LPA', senior: '12-20 LPA + perks', growth: '5-8% annually' },
    Freelance: { entry: '2-5 LPA', mid: '6-15 LPA', senior: '15-40 LPA', growth: 'Variable' },
    Research: { entry: '3-6 LPA', mid: '8-15 LPA', senior: '15-25 LPA', growth: '6-10% annually' },
};

// SMAART Internal Course Modules
const smaartCourseModules = {
    humanIntelligence: [
        'SMAART Communication Mastery',
        'Strategic Leadership Program',
        'Emotional Intelligence at Work',
        'Professional Negotiation Skills',
        'Problem Solving & Critical Thinking',
        'Decision Making Under Pressure',
        'Time Management & Productivity',
        'Team Collaboration Dynamics',
        'Conflict Resolution Masterclass',
        'Presentation & Public Speaking',
        'Networking & Personal Branding',
        'Cultural Intelligence Program',
        'Resilience Building Workshop',
        'Work Ethics & Professional Standards',
        'Self-Awareness Journey',
    ],
    aiSkills: [
        'AI Literacy Fundamentals',
        'Prompt Engineering Masterclass',
        'AI Automation Tools Workshop',
        'Data Literacy & Analytics',
        'AI in Your Domain',
        'Generative AI for Professionals',
        'ChatGPT Productivity Hacks',
        'AI Ethics & Responsible AI',
    ],
    technical: [
        'Python for Career Professionals',
        'Data Science Foundations',
        'Web Development Bootcamp',
        'Cloud Computing Essentials',
        'Digital Marketing Analytics',
        'Cybersecurity Awareness',
        'Project Management (Agile/Scrum)',
        'Excel & Power BI for Analysts',
    ],
};

// Career relevance mapping for human skills
const careerToHumanSkillsMapping = {
    Technology: ['Problem Solving', 'Critical Thinking', 'Analytical Thinking', 'Teamwork & Collaboration', 'Communication', 'Adaptability', 'Time Management', 'Creativity & Innovation', 'Self-Awareness', 'Decision Making', 'Leadership', 'Strategic Thinking', 'Work Ethics & Integrity', 'Presentation Skills', 'Networking & Relationship Building'],
    Business: ['Strategic Thinking', 'Negotiation', 'Leadership', 'Communication', 'Decision Making', 'Networking & Relationship Building', 'Presentation Skills', 'Creativity & Innovation', 'Adaptability', 'Teamwork & Collaboration', 'Time Management', 'Critical Thinking', 'Conflict Resolution', 'Emotional Intelligence', 'Work Ethics & Integrity'],
    Healthcare: ['Emotional Intelligence', 'Communication', 'Problem Solving', 'Teamwork & Collaboration', 'Decision Making', 'Resilience & Stress Management', 'Cultural Intelligence', 'Adaptability', 'Critical Thinking', 'Work Ethics & Integrity', 'Leadership', 'Self-Awareness', 'Conflict Resolution', 'Time Management', 'Analytical Thinking'],
    Finance: ['Analytical Thinking', 'Decision Making', 'Critical Thinking', 'Strategic Thinking', 'Communication', 'Work Ethics & Integrity', 'Time Management', 'Problem Solving', 'Negotiation', 'Adaptability', 'Teamwork & Collaboration', 'Presentation Skills', 'Leadership', 'Networking & Relationship Building', 'Self-Awareness'],
    Creative: ['Creativity & Innovation', 'Communication', 'Presentation Skills', 'Adaptability', 'Teamwork & Collaboration', 'Critical Thinking', 'Self-Awareness', 'Time Management', 'Problem Solving', 'Cultural Intelligence', 'Emotional Intelligence', 'Networking & Relationship Building', 'Strategic Thinking', 'Resilience & Stress Management', 'Leadership'],
    'Core Engineering': ['Problem Solving', 'Analytical Thinking', 'Teamwork & Collaboration', 'Communication', 'Decision Making', 'Critical Thinking', 'Time Management', 'Adaptability', 'Leadership', 'Work Ethics & Integrity', 'Strategic Thinking', 'Creativity & Innovation', 'Self-Awareness', 'Negotiation', 'Presentation Skills'],
    Education: ['Communication', 'Presentation Skills', 'Emotional Intelligence', 'Adaptability', 'Creativity & Innovation', 'Leadership', 'Cultural Intelligence', 'Problem Solving', 'Critical Thinking', 'Teamwork & Collaboration', 'Decision Making', 'Self-Awareness', 'Resilience & Stress Management', 'Time Management', 'Work Ethics & Integrity'],
    Government: ['Communication', 'Leadership', 'Decision Making', 'Strategic Thinking', 'Work Ethics & Integrity', 'Critical Thinking', 'Problem Solving', 'Negotiation', 'Adaptability', 'Cultural Intelligence', 'Conflict Resolution', 'Time Management', 'Teamwork & Collaboration', 'Analytical Thinking', 'Presentation Skills'],
};

module.exports = {
    skillToJobMapping,
    emergingJobsDatabase,
    humanIntelligenceSkills,
    salaryInsights,
    smaartCourseModules,
    careerToHumanSkillsMapping,
};
