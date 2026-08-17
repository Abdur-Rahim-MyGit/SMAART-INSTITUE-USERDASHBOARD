export const STAGE_1_COURSES = [
  { id: 'S01', title: 'Self-Awareness Foundations', subtitle: 'Understanding your strengths and areas for growth' },
  { id: 'S02', title: 'Emotional Intelligence Basics', subtitle: 'Managing emotions for better decision making' },
  { id: 'S03', title: 'Time Management Mastery', subtitle: 'Optimizing your productivity and focus' },
  { id: 'S04', title: 'Critical Thinking Fundamentals', subtitle: 'Analyzing information objectively' },
  { id: 'S05', title: 'Problem Solving Frameworks', subtitle: 'Structured approaches to complex challenges' },
  { id: 'S06', title: 'Learning How to Learn', subtitle: 'Meta-cognition and effective study techniques' },
  { id: 'S07', title: 'Stress Management', subtitle: 'Building resilience under pressure' },
  { id: 'S08', title: 'Goal Setting & Planning', subtitle: 'Creating actionable personal development plans' },
  { id: 'S09', title: 'Communication Basics', subtitle: 'Foundational verbal and written skills' },
  { id: 'S10', title: 'Digital Literacy', subtitle: 'Essential technology skills for the modern world' },
];

export const STAGE_2_COURSES = [
  { id: 'S11', title: 'Team Collaboration', subtitle: 'Working effectively in diverse teams' },
  { id: 'S12', title: 'Advanced Communication', subtitle: 'Persuasion, negotiation and influence' },
  { id: 'S13', title: 'Conflict Resolution', subtitle: 'Managing disagreements constructively' },
  { id: 'S14', title: 'Project Management Basics', subtitle: 'Planning and executing projects successfully' },
  { id: 'S15', title: 'AI Fundamentals', subtitle: 'Understanding artificial intelligence capabilities' },
  { id: 'S16', title: 'Data Literacy', subtitle: 'Interpreting and using data effectively' },
  { id: 'S17', title: 'Creative Thinking', subtitle: 'Generating innovative solutions' },
  { id: 'S18', title: 'Decision Making Under Uncertainty', subtitle: 'Making choices with incomplete information' },
  { id: 'S19', title: 'Networking & Relationship Building', subtitle: 'Creating professional connections' },
];

export const STAGE_3_COURSES = [
  { id: 'S20', title: 'Leadership Fundamentals', subtitle: 'Core principles of effective leadership' },
  { id: 'S21', title: 'Strategic Thinking', subtitle: 'Long-term planning and vision' },
  { id: 'S22', title: 'Change Management', subtitle: 'Leading through organizational change' },
  { id: 'S23', title: 'Ethical Leadership', subtitle: 'Making principled decisions' },
  { id: 'S24', title: 'Mentoring & Coaching', subtitle: 'Developing others' },
  { id: 'S25', title: 'Executive Presence', subtitle: 'Projecting confidence and authority' },
];

export const PIQ_TRACK = [
  { id: 'PIQ01', title: 'Growth Mindset', subtitle: 'Embracing challenges and learning from failure' },
  { id: 'PIQ02', title: 'Confidence Building', subtitle: 'Developing self-assurance and presence' },
  { id: 'PIQ03', title: 'Motivation Mastery', subtitle: 'Understanding and driving personal motivation' },
  { id: 'PIQ04', title: 'Adaptability', subtitle: 'Thriving in changing environments' },
  { id: 'PIQ05', title: 'Personal Branding', subtitle: 'Defining and communicating your value' },
];

export const AIQ_TRACK = [
  { id: 'AIQ01', title: 'AI Tools & Applications', subtitle: 'Practical AI tools for everyday work' },
  { id: 'AIQ02', title: 'Prompt Engineering', subtitle: 'Communicating effectively with AI systems' },
  { id: 'AIQ03', title: 'AI Ethics & Safety', subtitle: 'Responsible AI usage guidelines' },
  { id: 'AIQ04', title: 'AI-Powered Creativity', subtitle: 'Using AI for creative problem solving' },
  { id: 'AIQ05', title: 'Future of Work with AI', subtitle: 'Preparing for AI-integrated workplaces' },
];

export const SQ_TRACK = [
  { id: 'SQ01', title: 'Sustainability Fundamentals', subtitle: 'Understanding environmental and social impact' },
  { id: 'SQ02', title: 'Ethical Decision Making', subtitle: 'Framework for principled choices' },
  { id: 'SQ03', title: 'Social Responsibility', subtitle: 'Individual and collective impact' },
  { id: 'SQ04', title: 'Sustainable Innovation', subtitle: 'Creating solutions that last' },
  { id: 'SQ05', title: 'Global Citizenship', subtitle: 'Thinking beyond borders and generations' },
];

export const STAGES = [
  {
    id: 1,
    name: 'Capacity',
    subtitle: 'Stage 1: Foundations',
    description: 'Build the foundational skills and resources to perform at your best in any environment.',
    courses: STAGE_1_COURSES,
    totalCourses: 10,
    unlockAfter: null,
    assessmentGate: 'T2',
  },
  {
    id: 2,
    name: 'Capability',
    subtitle: 'Stage 2: Intermediate',
    description: 'Develop core competencies and technical expertise to excel in your chosen field.',
    courses: STAGE_2_COURSES,
    totalCourses: 9,
    unlockAfter: 'S10',
    assessmentGate: 'T3',
  },
  {
    id: 3,
    name: 'Leadership',
    subtitle: 'Stage 3: Advanced',
    description: 'Cultivate the mindset and vision to lead teams and drive meaningful change.',
    courses: STAGE_3_COURSES,
    totalCourses: 6,
    unlockAfter: 'S19',
    assessmentGate: 'T4',
  },
];

export const TRACKS = [
  {
    id: 'PIQ',
    name: 'Personal Intelligence Quotient',
    shortName: 'PIQ',
    description: 'Develop mindset, confidence, and personal effectiveness',
    color: '#8B5CF6',
    courses: PIQ_TRACK,
    totalCourses: 5,
    unlockAfter: 'S05',
    icon: '🧍',
  },
  {
    id: 'AIQ',
    name: 'AI Readiness Quotient',
    shortName: 'AIQ',
    description: 'Master AI tools and work effectively with artificial intelligence',
    color: '#3B82F6',
    courses: AIQ_TRACK,
    totalCourses: 5,
    unlockAfter: 'S15',
    icon: '🤖',
  },
  {
    id: 'SQ',
    name: 'Sustainability Quotient',
    shortName: 'SQ',
    description: 'Build ethical thinking and sustainability awareness',
    color: '#10B981',
    courses: SQ_TRACK,
    totalCourses: 5,
    unlockAfter: 'S21',
    icon: '🌱',
  },
];
