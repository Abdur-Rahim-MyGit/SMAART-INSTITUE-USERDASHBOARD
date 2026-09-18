import { classifyDomain, DOMAINS } from "@/data/wordOfTheDay";

// A starter is a pre-filled board: title, goals, grid layout and a headline
// already on the canvas, so a first-timer never faces a blank square.
// `domains` lists the career domains (see wordOfTheDay DOMAINS) it suits.

const headline = (text, color, y = 8) => ({
  text,
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 44,
  fontWeight: "800",
  color,
  effect: "none",
  position: { x: 50, y },
  align: "center",
  rotation: 0,
  lineHeight: 1.1,
  letterSpacing: -0.5,
  opacity: 1,
  maxWidth: 520,
  backgroundStyle: "none",
});

const affirmation = (text, color, y = 92) => ({
  text,
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 22,
  fontWeight: "600",
  color,
  effect: "none",
  position: { x: 50, y },
  align: "center",
  rotation: 0,
  lineHeight: 1.2,
  letterSpacing: 0.5,
  opacity: 0.9,
  maxWidth: 560,
  backgroundStyle: "none",
});

export const STARTER_BOARDS = [
  {
    id: "placement-2026",
    name: "Placement 2026",
    tagline: "Resume, aptitude, interviews — the whole campus-placement run.",
    swatch: ["#045C9A", "#A6D7E8"],
    domains: ["software", "data", "cloud", "security", "business", "engineering", "hr", "general"],
    templateId: "grid-2x2",
    aspectRatio: "1:1",
    backgroundColor: "#EAF7FD",
    title: "Placement 2026",
    description: "Everything I need to walk into placement season prepared, confident and ready to sign.",
    shortTermGoals: [
      "Finish my resume and get it ATS-checked in Resume Builder",
      "Solve 50 aptitude questions this month",
      "Apply to 10 companies through Placement",
    ],
    longTermGoals: ["Land a full-time offer before my final semester", "Start at a package I am proud of"],
    texts: [headline("Placement 2026", "#072036"), affirmation("Prepared. Confident. Placed.", "#045C9A")],
  },
  {
    id: "higher-studies",
    name: "Higher Studies",
    tagline: "Entrance tests, applications and the university you are aiming for.",
    swatch: ["#4f46e5", "#c7d2fe"],
    domains: ["software", "data", "engineering", "business", "general"],
    templateId: "big-left-2",
    aspectRatio: "4:5",
    backgroundColor: "#EEF2FF",
    title: "Higher Studies",
    description: "My route to a master's programme — the tests, the applications and the campus I picture myself on.",
    shortTermGoals: [
      "Shortlist 5 universities and note their deadlines",
      "Book my GRE / GATE / IELTS test date",
      "Ask two professors for recommendation letters",
    ],
    longTermGoals: ["Get admitted to a top programme in my field", "Publish one research paper"],
    texts: [headline("Higher Studies", "#1e1b4b", 6), affirmation("One application at a time.", "#4f46e5", 94)],
  },
  {
    id: "skills-growth",
    name: "Skills Growth",
    tagline: "Courses, certificates and projects that make me job-ready.",
    swatch: ["#0e7c86", "#99f6e4"],
    domains: ["software", "data", "cloud", "security", "engineering", "general"],
    templateId: "grid-3x3",
    aspectRatio: "1:1",
    backgroundColor: "#F0FDFA",
    title: "Skills Growth",
    description: "The skills I am building this year, one course, one certificate and one project at a time.",
    shortTermGoals: [
      "Complete one SMAART course every month",
      "Earn 3 certificates into my Skills Passport",
      "Build one project and publish it on GitHub",
    ],
    longTermGoals: ["Become job-ready in my chosen career path", "Mentor a junior in my college"],
    texts: [headline("Skills Growth", "#134e4a"), affirmation("Learn. Build. Repeat.", "#0e7c86")],
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    tagline: "Case studies, a personal brand and the work that gets me hired.",
    swatch: ["#8a4fae", "#e9d5ff"],
    domains: ["design", "marketing", "general"],
    templateId: "split-horizontal",
    aspectRatio: "4:5",
    backgroundColor: "#FAF5FF",
    title: "Creative Portfolio",
    description: "The portfolio I am building: real case studies, honest feedback and work I am proud to share.",
    shortTermGoals: [
      "Design 3 case studies for my portfolio",
      "Share one piece of work online every week",
      "Get feedback from a working designer",
    ],
    longTermGoals: ["Land a design or marketing internship", "Build a personal brand people recognise"],
    texts: [headline("Creative Portfolio", "#3b0764", 6), affirmation("Make things worth sharing.", "#8a4fae", 94)],
  },
  {
    id: "startup-dream",
    name: "Startup Dream",
    tagline: "Validate the idea, find the first users, build the team.",
    swatch: ["#b8860b", "#fde68a"],
    domains: ["business", "marketing", "software", "general"],
    templateId: "single",
    aspectRatio: "16:9",
    backgroundColor: "#FFFBEB",
    title: "Startup Dream",
    description: "From idea to first customers — the milestones that turn my startup into something real.",
    shortTermGoals: [
      "Validate my idea with 20 customer interviews",
      "Launch a landing page and get 100 sign-ups",
      "Enter one startup competition",
    ],
    longTermGoals: ["Launch a product that earns its first ₹1 lakh", "Build a team of five"],
    texts: [headline("Startup Dream", "#451a03", 10), affirmation("Build what people need.", "#b8860b", 90)],
  },
  {
    id: "balanced-life",
    name: "Balanced Life",
    tagline: "Health, habits and the people who keep me grounded.",
    swatch: ["#1f6d4a", "#bbf7d0"],
    domains: ["general"],
    templateId: "grid-2x2",
    aspectRatio: "1:1",
    backgroundColor: "#F0FDF4",
    title: "Balanced Life",
    description: "A year where my health, my studies and my relationships all get the time they deserve.",
    shortTermGoals: ["Exercise three times a week", "Read one book a month", "Sleep seven hours every night"],
    longTermGoals: ["Graduate with a routine I actually keep", "Travel to three new places"],
    texts: [headline("Balanced Life", "#052e16"), affirmation("Small habits, big year.", "#1f6d4a")],
  },
];

export const getStarterBoard = (id) => STARTER_BOARDS.find((s) => s.id === id) || null;

// Goals that fit each career domain. The suggestion picks the domain from the
// student's locked primary role and pairs it with the best-fitting starter.
const CAREER_GOALS = {
  software: {
    short: ["Solve three coding problems a day", "Ship one full-stack project to GitHub", "Finish the SMAART web development track"],
    long: ["Join a product company as a Software Engineer", "Contribute to an open-source project"],
    starter: "skills-growth",
  },
  data: {
    short: ["Complete one end-to-end data project with a real dataset", "Learn SQL well enough to answer any question", "Publish a notebook on Kaggle"],
    long: ["Work as a Data Scientist or ML Engineer", "Build a model that ships to real users"],
    starter: "skills-growth",
  },
  cloud: {
    short: ["Earn one cloud fundamentals certification", "Deploy a project with CI/CD and monitoring", "Learn Docker and Kubernetes basics"],
    long: ["Become a Cloud or DevOps Engineer", "Design infrastructure for a production system"],
    starter: "skills-growth",
  },
  security: {
    short: ["Complete 10 rooms on a hands-on security lab", "Earn a security fundamentals certificate", "Write up one vulnerability I found and fixed"],
    long: ["Work as a Security Analyst or Penetration Tester", "Earn a recognised security certification"],
    starter: "skills-growth",
  },
  design: {
    short: ["Design three case studies for my portfolio", "Redesign one real app and document the process", "Get feedback from a working designer"],
    long: ["Land a UX / product design role", "Build a personal brand people recognise"],
    starter: "creative-portfolio",
  },
  marketing: {
    short: ["Run one small campaign and measure it", "Grow a channel by 500 followers", "Earn a digital marketing certificate"],
    long: ["Lead marketing for a brand I believe in", "Build an audience of my own"],
    starter: "creative-portfolio",
  },
  business: {
    short: ["Master Excel and one analytics tool", "Complete a case-study competition", "Read one business book a month"],
    long: ["Work as an Analyst or Consultant at a top firm", "Start something of my own"],
    starter: "placement-2026",
  },
  engineering: {
    short: ["Finish one hands-on project with real hardware or CAD", "Earn a core-domain certification", "Secure an industrial internship"],
    long: ["Work as a core engineer in my domain", "Lead a project from design to delivery"],
    starter: "placement-2026",
  },
  hr: {
    short: ["Complete an HR analytics or recruitment course", "Lead one campus event end to end", "Build a network of 50 professionals on LinkedIn"],
    long: ["Work in HR or People Operations at a company I admire", "Become someone people want to work with"],
    starter: "placement-2026",
  },
  general: {
    short: ["Finish my resume and get it ATS-checked", "Complete one SMAART course every month", "Apply to 10 opportunities through Placement"],
    long: ["Land a role I am proud of", "Keep growing every single year"],
    starter: "placement-2026",
  },
};

export const buildCareerSuggestion = (pathway) => {
  const role = String(pathway?.primary_role || "").trim();
  if (!pathway?.found || !role) return null;
  const domain = classifyDomain(role);
  const goals = CAREER_GOALS[domain] || CAREER_GOALS.general;
  return {
    role,
    domain,
    domainLabel: DOMAINS[domain]?.label || DOMAINS.general.label,
    isLocked: Boolean(pathway.is_locked),
    starterId: goals.starter,
    title: `${role} Roadmap`,
    description: `My path to becoming a ${role} — the skills, projects and milestones that get me there.`,
    shortTermGoals: goals.short,
    longTermGoals: goals.long,
  };
};
