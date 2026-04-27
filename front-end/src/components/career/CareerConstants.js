import {
    Database, Brain, Target, GraduationCap, Briefcase, MapPin, DollarSign,
    ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles, TrendingUp,
    BookOpen, Shield, Zap, Users, Award, BarChart3, Download, ChevronDown,
    ChevronUp, RefreshCw, Clock, Star, Lightbulb, Rocket, FileText, Plus,
    Code, Cpu, Heart, Globe, Layers, PieChart, Activity, AlertTriangle, Lock, Table,
    LayoutDashboard, Milestone, CircuitBoard, Gauge, Radio, Compass
} from 'lucide-react';

export const DEGREE_GROUPS = ['BTech', 'BSc', 'BA', 'BVoc', 'BCom', 'BBA / BMS', 'BCA', 'BDes / BFA', 'LLB', 'BPharm', 'BJM / BMM', 'BHM', 'BSc Nursing', 'BPT', 'BEd', 'BSW', 'BArch', 'Diploma', 'Other'];

export const SPECIALISATIONS = {
    'BTech': ['CS / IT', 'Mechanical', 'Civil', 'Electrical', 'ECE', 'Chemical', 'Aerospace', 'Biotech', 'Industrial', 'Environmental', 'Biomedical'],
    'BSc': ['CS / IT / Math / Stats', 'Physics', 'Chemistry', 'Zoology', 'Botany', 'Microbiology', 'Genetics', 'Biochemistry', 'Bioinformatics', 'Nutrition'],
    'BA': ['Economics', 'English', 'History', 'Political Science', 'Sociology', 'Psychology', 'Philosophy', 'Geography'],
    'BVoc': ['Renewable Energy', 'IT', 'Retail', 'Healthcare', 'Tourism', 'Media'],
    'BCom': ['General', 'Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Computer Applications'],
    'BCA': ['General', 'Data Science', 'Cloud Computing', 'Cybersecurity'],
    'BDes / BFA': ['Fashion Design', 'Graphic Design', 'Product Design', 'Interior Design', 'Animation', 'Fine Arts'],
    'LLB': ['Corporate Law', 'Criminal Law', 'Constitutional Law', 'IPR', 'Cyber Law'],
    'BPharm': ['Industrial Pharmacy', 'Pharmacology', 'Clinical Research', 'Drug Regulatory Affairs'],
    'BJM / BMM': ['Journalism', 'Advertising', 'Public Relations', 'Digital Media', 'Broadcast Media'],
    'BArch': ['Urban Design', 'Landscape Architecture', 'Interior Architecture'],
};

export const FOUR_YEAR_DEGREES = ['BTech', 'BArch', 'BPharm', 'BSc Nursing', 'MBBS'];

export const SECTOR_OPTIONS = [
    'IT & Software', 'BFSI', 'Consulting', 'E-Commerce & Retail', 'Manufacturing',
    'Healthcare & Pharma', 'Education & EdTech', 'Media & Entertainment', 'Government',
    'Telecom', 'FMCG', 'Hospitality & Tourism', 'Logistics', 'Aerospace & Defence',
    'Real Estate', 'Renewable Energy', 'Oil Gas & Energy', 'Agriculture & AgriTech',
    'Sports & Fitness', 'Maritime & Shipping', 'Open to Any'
];

export const COMPANY_TYPES = ['STARTUP', 'TRADITIONAL', 'OPEN'];

export const INTEREST_OPTIONS = [
    { name: 'Technology', icon: '💻' },
    { name: 'Data & Numbers', icon: '📊' },
    { name: 'People & Communication', icon: '🤝' },
    { name: 'Creativity & Design', icon: '🎨' },
    { name: 'Business & Strategy', icon: '💼' },
    { name: 'Healthcare & Wellbeing', icon: '🏥' },
    { name: 'Law & Policy', icon: '⚖️' },
    { name: 'Science & Research', icon: '🔬' },
    { name: 'Teaching & Education', icon: '🎓' },
    { name: 'Money & Finance', icon: '💰' },
];

export const PLACEMENT_TIMELINES = ['Within 6 months', '6 – 12 months', '12 – 24 months', 'Not sure'];

export const SUGGESTED_SKILLS = {
    default: ['Communication', 'Problem Solving', 'Critical Thinking', 'Teamwork', 'Time Management', 'Leadership', 'Adaptability', 'Microsoft Office'],
    'BTech': ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'Git', 'Linux', 'React', 'Node.js', 'Machine Learning', 'AWS / Cloud', 'Figma', 'REST APIs'],
    'BSc': ['Python', 'R', 'Statistics', 'MATLAB', 'Data Analysis', 'Research Methodology', 'Excel', 'SPSS', 'Tableau'],
    'BA': ['Research Writing', 'Content Writing', 'Public Speaking', 'Social Media', 'MS Office', 'Data Interpretation', 'SPSS'],
    'BCA': ['Python', 'Java', 'Web Development', 'SQL', 'PHP', 'JavaScript', 'React', 'MySQL', 'Networking'],
    'BCom': ['Tally', 'Excel', 'GST & Taxation', 'Financial Accounting', 'MS Office', 'QuickBooks', 'SAP Basics'],
    'BBA / BMS': ['Business Analysis', 'Marketing', 'Excel', 'PowerPoint', 'CRM Tools', 'Digital Marketing', 'Sales Strategy'],
    'BDes / BFA': ['Figma', 'Adobe Illustrator', 'Photoshop', 'Canva', 'InDesign', 'Sketch', 'UI/UX Design'],
    'BJM / BMM': ['Content Writing', 'Video Editing', 'Premiere Pro', 'Social Media', 'Copywriting', 'SEO', 'Photography'],
    'BPharm': ['Pharmacology', 'Clinical Research', 'Lab Techniques', 'GMP / GLP', 'Medical Writing'],
    'LLB': ['Legal Research', 'Contract Drafting', 'Case Analysis', 'Court Procedures', 'Negotiation'],
};

export const DOMAINS = [
    'Web Development', 'Data Science & AI', 'Cybersecurity', 'Cloud Computing & DevOps',
    'Mobile App Development', 'Business Analytics', 'Digital Marketing', 'Software Engineering',
    'IT Support & Networking', 'UI/UX Design', 'Blockchain Technology', 'Internet of Things (IoT)',
    'Embedded Systems', 'Product Management', 'Quality Assurance (Testing)', 'Others'
];

export const REPORT_TABS = [
    { id: 'OVERVIEW', label: 'STRATEGIC OVERVIEW', icon: LayoutDashboard, color: 'indigo', description: 'Mission profile & alignment' },
    { id: 'SKILLS', label: 'INTELLIGENCE CORE', icon: Cpu, color: 'purple', description: 'Technical & AI capabilities' },
    { id: 'ROADMAP', label: 'EXECUTION PATH', icon: Milestone, color: 'emerald', description: 'Phased deployment plan' },
    { id: 'MARKET', label: 'MARKET PULSE', icon: Activity, color: 'amber', description: 'Global demand telemetry' },
    { id: 'RESOURCES', label: 'KNOWLEDGE BASE', icon: Zap, color: 'cyan', description: 'Resource & asset mapping' },
];

export const FORM_STEPS = [
    { id: 'degree', title: 'Degree', icon: GraduationCap, description: 'Select your degree group' },
    { id: 'year', title: 'Year', icon: Clock, description: 'Year of study' },
    { id: 'roles', title: 'Job Roles', icon: Briefcase, description: 'Your preferred job roles' },
    { id: 'sector', title: 'Sector', icon: Layers, description: 'Preferred industries (optional)' },
    { id: 'goals', title: 'Career Goals', icon: Target, description: 'Your career aspirations' },
    { id: 'interests', title: 'Interests', icon: Sparkles, description: 'What excites you most' },
    { id: 'timeline', title: 'Timeline', icon: Compass, description: 'Placement timeline' },
    { id: 'skills', title: 'Skills', icon: Brain, description: 'Your current skills' },
    { id: 'domain', title: 'Gen Domain', icon: Database, description: 'Confirm generation target' },
];
