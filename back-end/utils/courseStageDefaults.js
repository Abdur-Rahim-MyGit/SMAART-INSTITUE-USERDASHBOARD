const TEMP_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

const COURSE_STAGE_TITLES = [
  'Why',
  'Story',
  'Framework',
  'Practice',
  'Apply',
  'Reflect',
  'Notes'
];

const CURRENT_COURSE_CATALOG = [
  { id: 'S01', title: 'Self-Awareness Foundations', subtitle: 'Understanding your strengths and areas for growth', category: 'Capacity' },
  { id: 'S02', title: 'Emotional Intelligence Basics', subtitle: 'Managing emotions for better decision making', category: 'Capacity' },
  { id: 'S03', title: 'Time Management Mastery', subtitle: 'Optimizing your productivity and focus', category: 'Capacity' },
  { id: 'S04', title: 'Critical Thinking Fundamentals', subtitle: 'Analyzing information objectively', category: 'Capacity' },
  { id: 'S05', title: 'Problem Solving Frameworks', subtitle: 'Structured approaches to complex challenges', category: 'Capacity' },
  { id: 'S06', title: 'Learning How to Learn', subtitle: 'Meta-cognition and effective study techniques', category: 'Capacity' },
  { id: 'S07', title: 'Stress Management', subtitle: 'Building resilience under pressure', category: 'Capacity' },
  { id: 'S08', title: 'Goal Setting & Planning', subtitle: 'Creating actionable personal development plans', category: 'Capacity' },
  { id: 'S09', title: 'Communication Basics', subtitle: 'Foundational verbal and written skills', category: 'Capacity' },
  { id: 'S10', title: 'Digital Literacy', subtitle: 'Essential technology skills for the modern world', category: 'Capacity' },
  { id: 'S11', title: 'Team Collaboration', subtitle: 'Working effectively in diverse teams', category: 'Capability' },
  { id: 'S12', title: 'Advanced Communication', subtitle: 'Persuasion, negotiation and influence', category: 'Capability' },
  { id: 'S13', title: 'Conflict Resolution', subtitle: 'Managing disagreements constructively', category: 'Capability' },
  { id: 'S14', title: 'Project Management Basics', subtitle: 'Planning and executing projects successfully', category: 'Capability' },
  { id: 'S15', title: 'AI Fundamentals', subtitle: 'Understanding artificial intelligence capabilities', category: 'Capability' },
  { id: 'S16', title: 'Data Literacy', subtitle: 'Interpreting and using data effectively', category: 'Capability' },
  { id: 'S17', title: 'Creative Thinking', subtitle: 'Generating innovative solutions', category: 'Capability' },
  { id: 'S18', title: 'Decision Making Under Uncertainty', subtitle: 'Making choices with incomplete information', category: 'Capability' },
  { id: 'S19', title: 'Networking & Relationship Building', subtitle: 'Creating professional connections', category: 'Capability' },
  { id: 'S20', title: 'Leadership Fundamentals', subtitle: 'Core principles of effective leadership', category: 'Leadership' },
  { id: 'S21', title: 'Strategic Thinking', subtitle: 'Long-term planning and vision', category: 'Leadership' },
  { id: 'S22', title: 'Change Management', subtitle: 'Leading through organizational change', category: 'Leadership' },
  { id: 'S23', title: 'Ethical Leadership', subtitle: 'Making principled decisions', category: 'Leadership' },
  { id: 'S24', title: 'Mentoring & Coaching', subtitle: 'Developing others', category: 'Leadership' },
  { id: 'S25', title: 'Executive Presence', subtitle: 'Projecting confidence and authority', category: 'Leadership' },
  { id: 'PIQ01', title: 'Growth Mindset', subtitle: 'Embracing challenges and learning from failure', category: 'PIQ' },
  { id: 'PIQ02', title: 'Confidence Building', subtitle: 'Developing self-assurance and presence', category: 'PIQ' },
  { id: 'PIQ03', title: 'Motivation Mastery', subtitle: 'Understanding and driving personal motivation', category: 'PIQ' },
  { id: 'PIQ04', title: 'Adaptability', subtitle: 'Thriving in changing environments', category: 'PIQ' },
  { id: 'PIQ05', title: 'Personal Branding', subtitle: 'Defining and communicating your value', category: 'PIQ' },
  { id: 'AIQ01', title: 'AI Tools & Applications', subtitle: 'Practical AI tools for everyday work', category: 'AIQ' },
  { id: 'AIQ02', title: 'Prompt Engineering', subtitle: 'Communicating effectively with AI systems', category: 'AIQ' },
  { id: 'AIQ03', title: 'AI Ethics & Safety', subtitle: 'Responsible AI usage guidelines', category: 'AIQ' },
  { id: 'AIQ04', title: 'AI-Powered Creativity', subtitle: 'Using AI for creative problem solving', category: 'AIQ' },
  { id: 'AIQ05', title: 'Future of Work with AI', subtitle: 'Preparing for AI-integrated workplaces', category: 'AIQ' },
  { id: 'SQ01', title: 'Sustainability Fundamentals', subtitle: 'Understanding environmental and social impact', category: 'SQ' },
  { id: 'SQ02', title: 'Ethical Decision Making', subtitle: 'Framework for principled choices', category: 'SQ' },
  { id: 'SQ03', title: 'Social Responsibility', subtitle: 'Individual and collective impact', category: 'SQ' },
  { id: 'SQ04', title: 'Sustainable Innovation', subtitle: 'Creating solutions that last', category: 'SQ' },
  { id: 'SQ05', title: 'Global Citizenship', subtitle: 'Thinking beyond borders and generations', category: 'SQ' }
];

const getVideoUrl = (day) =>
  day?.videoContent?.videoUrl ||
  day?.video_url ||
  day?.videoUrl ||
  day?.VideoContent?.[0]?.videoUrl ||
  TEMP_VIDEO_URL;

const buildDefaultDay = (course, index, incomingDay = {}) => {
  const title = COURSE_STAGE_TITLES[index];
  const existingVideoUrl = getVideoUrl(incomingDay);

  return {
    ...incomingDay,
    dayNumber: index + 1,
    dayType: 'course',
    moduleDetails: {
      title: incomingDay.moduleDetails?.title || incomingDay.title || title,
      description: incomingDay.moduleDetails?.description || incomingDay.description || `${title} stage for ${course.title}.`
    },
    videoContent: {
      title: incomingDay.videoContent?.title || `${course.title} - ${title}`,
      description: incomingDay.videoContent?.description || incomingDay.description || course.description,
      videoUrl: existingVideoUrl,
      duration: incomingDay.videoContent?.duration || 5,
      transcription: incomingDay.videoContent?.transcription || incomingDay.transcription || ''
    },
    steps: Array.isArray(incomingDay.steps) && incomingDay.steps.length > 0
      ? incomingDay.steps
      : [{
        stepNumber: index + 1,
        title,
        type: index === 6 ? 'text' : 'video',
        content: {
          title,
          body: incomingDay.description || `${title} learning activity for ${course.title}.`,
          videoUrl: existingVideoUrl
        },
        isRequired: true
      }],
    status: incomingDay.status || 'active'
  };
};

const normalizeCourseStages = (courseInput = {}, existingCourse = null) => {
  const course = { ...courseInput };
  const firstModule = course.modules?.[0] || {};
  const existingModule = existingCourse?.modules?.[0] || {};
  const incomingDays = Array.isArray(firstModule.days) ? firstModule.days : [];
  const existingDays = Array.isArray(existingModule.days) ? existingModule.days : [];

  const normalizedDays = COURSE_STAGE_TITLES.map((_, index) => {
    const incomingDay = incomingDays[index] || {};
    const existingDay = existingDays[index] || {};
    const hasIncomingSteps =
      Array.isArray(incomingDay.steps) && incomingDay.steps.length > 0;
    const hasExistingSteps =
      Array.isArray(existingDay.steps) && existingDay.steps.length > 0;

    return buildDefaultDay(course, index, {
      ...existingDay,
      ...incomingDay,
      steps: hasIncomingSteps
        ? incomingDay.steps
        : hasExistingSteps
          ? existingDay.steps
          : undefined,
    });
  });

  const preservedMicroAssessments =
    Array.isArray(firstModule.microAssessments) && firstModule.microAssessments.length > 0
      ? firstModule.microAssessments
      : existingModule.microAssessments;

  course.duration = course.duration || 7;
  course.modules = [{
    ...existingModule,
    ...firstModule,
    title: firstModule.title || existingModule.title || 'Seven Stage Learning Flow',
    description:
      firstModule.description ||
      existingModule.description ||
      `Dynamic seven-stage flow for ${course.title}.`,
    duration: 7,
    sequence: firstModule.sequence || existingModule.sequence || 1,
    status: firstModule.status || existingModule.status || 'active',
    days: normalizedDays,
    ...(preservedMicroAssessments?.length
      ? { microAssessments: preservedMicroAssessments }
      : {}),
  }];

  return course;
};

const buildCatalogCoursePayload = (catalogCourse, createdBy) => normalizeCourseStages({
  courseCode: catalogCourse.id,
  title: catalogCourse.title,
  description: catalogCourse.subtitle,
  duration: 7,
  category: catalogCourse.category,
  tags: [catalogCourse.id, catalogCourse.category],
  status: 'active',
  createdBy
});

module.exports = {
  COURSE_STAGE_TITLES,
  CURRENT_COURSE_CATALOG,
  TEMP_VIDEO_URL,
  normalizeCourseStages,
  buildCatalogCoursePayload
};
