
// Font Categories for Vision Boards
export const FONT_CATEGORIES = {
  script: {
    name: "Inspirational Script",
    icon: "✨",
    color: "from-rose-400 to-pink-500",
    description: "Elegant, flowing fonts for affirmations",
    fonts: [
      {
        name: "Caveat",
        family: "'Caveat', cursive",
        preview: "Dream Big",
        useCase: "Personal affirmations",
      },
      {
        name: "Dancing Script",
        family: "'Dancing Script', cursive",
        preview: "Believe",
        useCase: "Romantic goals",
      },
      {
        name: "Pacifico",
        family: "'Pacifico', cursive",
        preview: "Create",
        useCase: "Creative goals",
      },
      {
        name: "Great Vibes",
        family: "'Great Vibes', cursive",
        preview: "Manifest",
        useCase: "Personal mantras",
      },
      {
        name: "Sacramento",
        family: "'Sacramento', cursive",
        preview: "Inspire",
        useCase: "Elegant quotes",
      },
      {
        name: "Satisfy",
        family: "'Satisfy', cursive",
        preview: "Grateful",
        useCase: "Gratitude statements",
      },
    ],
  },
  bold: {
    name: "Bold Statement",
    icon: "💪",
    color: "from-slate-700 to-gray-900",
    description: "Powerful fonts for goals and headlines",
    fonts: [
      {
        name: "Montserrat Bold",
        family: "'Montserrat', sans-serif",
        weight: "900",
        preview: "ACHIEVE",
        useCase: "Major goals",
      },
      {
        name: "Oswald",
        family: "'Oswald', sans-serif",
        weight: "700",
        preview: "SUCCESS",
        useCase: "Headlines",
      },
      {
        name: "Anton",
        family: "'Anton', sans-serif",
        preview: "POWER",
        useCase: "Fitness goals",
      },
      {
        name: "Bebas Neue",
        family: "'Bebas Neue', sans-serif",
        preview: "FOCUS",
        useCase: "Sports goals",
      },
      {
        name: "Righteous",
        family: "'Righteous', cursive",
        preview: "SHINE",
        useCase: "Entertainment",
      },
    ],
  },
  minimal: {
    name: "Minimal Modern",
    icon: "◯",
    color: "from-teal-400 to-cyan-500",
    description: "Clean fonts for minimalist boards",
    fonts: [
      {
        name: "Raleway Light",
        family: "'Raleway', sans-serif",
        weight: "200",
        preview: "simplicity",
        useCase: "Wellness",
      },
      {
        name: "Quicksand",
        family: "'Quicksand', sans-serif",
        weight: "300",
        preview: "breathe",
        useCase: "Meditation",
      },
      {
        name: "Poppins",
        family: "'Poppins', sans-serif",
        weight: "300",
        preview: "balance",
        useCase: "Productivity",
      },
      {
        name: "Inter",
        family: "'Inter', sans-serif",
        weight: "300",
        preview: "focus",
        useCase: "Tech goals",
      },
    ],
  },
  cutout: {
    name: "Magazine Cutout",
    icon: "✂️",
    color: "from-amber-400 to-orange-500",
    description: "Playful scrapbook-style fonts",
    fonts: [
      {
        name: "Permanent Marker",
        family: "'Permanent Marker', cursive",
        preview: "DREAM!",
        useCase: "Fun goals",
      },
      {
        name: "Indie Flower",
        family: "'Indie Flower', cursive",
        preview: "adventure",
        useCase: "Travel dreams",
      },
      {
        name: "Amatic SC",
        family: "'Amatic SC', cursive",
        weight: "700",
        preview: "CREATE",
        useCase: "Art projects",
      },
      {
        name: "Special Elite",
        family: "'Special Elite', cursive",
        preview: "stories",
        useCase: "Writing goals",
      },
    ],
  },
  retro: {
    name: "Retro Vintage",
    icon: "🌅",
    color: "from-orange-400 to-rose-500",
    description: "Nostalgic fonts with warm vibes",
    fonts: [
      {
        name: "Lobster",
        family: "'Lobster', cursive",
        preview: "Good Vibes",
        useCase: "Lifestyle",
      },
      {
        name: "Playfair Display",
        family: "'Playfair Display', serif",
        style: "italic",
        preview: "Elegance",
        useCase: "Luxury goals",
      },
      {
        name: "Poiret One",
        family: "'Poiret One', cursive",
        preview: "GOLDEN",
        useCase: "Success visualization",
      },
    ],
  },
};

// Text Effects
export const TEXT_EFFECTS = [
  { id: "none", name: "None", icon: "—" },
  {
    id: "shadow",
    name: "Shadow",
    icon: "◐",
    style: { textShadow: "2px 2px 4px rgba(0,0,0,0.3)" },
  },
  {
    id: "outline",
    name: "Outline",
    icon: "◇",
    style: {
      WebkitTextStroke: "1px currentColor",
      WebkitTextFillColor: "transparent",
    },
  },
  {
    id: "glow",
    name: "Glow",
    icon: "✦",
    style: { textShadow: "0 0 10px currentColor, 0 0 20px currentColor" },
  },
  {
    id: "3d",
    name: "3D",
    icon: "▣",
    style: { textShadow: "1px 1px 0 #888, 2px 2px 0 #777, 3px 3px 0 #666" },
  },
  {
    id: "neon",
    name: "Neon",
    icon: "💡",
    style: {
      textShadow:
        "0 0 5px #fff, 0 0 10px #fff, 0 0 15px currentColor, 0 0 20px currentColor",
    },
  },
];

// Text Colors
export const TEXT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#1F2937",
  "#4B5563",
  "#9CA3AF",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#CA8A04",
  "#65A30D",
  "#16A34A",
  "#0D9488",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#E11D48",
];

export const TEXT_STYLE_PRESETS = [
  {
    id: "title",
    name: "Title",
    text: "Big Vision",
    styles: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: "800",
      fontSize: 44,
      lineHeight: 1,
      letterSpacing: 0,
      opacity: 1,
      backgroundStyle: "none",
      maxWidth: 320,
      align: "center",
      color: "#FFFFFF",
    },
  },
  {
    id: "quote",
    name: "Quote",
    text: "What you imagine, you build.",
    styles: {
      fontFamily: "'Playfair Display', serif",
      fontStyle: "italic",
      fontWeight: "500",
      fontSize: 30,
      lineHeight: 1.25,
      letterSpacing: 0,
      opacity: 0.96,
      backgroundStyle: "soft",
      maxWidth: 420,
      align: "center",
      color: "#FFFFFF",
    },
  },
  {
    id: "caption",
    name: "Caption",
    text: "Small daily steps matter.",
    styles: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: "500",
      fontSize: 18,
      lineHeight: 1.35,
      letterSpacing: 0.4,
      opacity: 0.88,
      backgroundStyle: "none",
      maxWidth: 280,
      align: "left",
      color: "#F8FAFC",
    },
  },
  {
    id: "goal-tag",
    name: "Goal Tag",
    text: "2026 Focus",
    styles: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: "700",
      fontSize: 16,
      lineHeight: 1,
      letterSpacing: 1.2,
      opacity: 1,
      backgroundStyle: "pill",
      maxWidth: 220,
      align: "center",
      color: "#0F172A",
      backgroundColor: "rgba(255,255,255,0.94)",
    },
  },
];

const buildSvgDataUri = (svg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;

const buildAsset = ({ id, name, category, width, height, svg }) => ({
  id,
  name,
  category,
  width,
  height,
  src: buildSvgDataUri(svg),
});

export const ASSET_LIBRARY_PACKS = [
  buildAsset({
    id: "shape-blob-blue",
    name: "Soft Blob",
    category: "Shapes",
    width: 180,
    height: 140,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="140" viewBox="0 0 180 140" fill="none">
        <path d="M34 31.5C52.3 8.6 92.8 3.8 120.2 13.6C147.6 23.5 161.8 47.9 156.5 73.6C151.1 99.3 126.2 126.1 96.6 131.1C67 136.2 32.7 119.5 20.5 92.2C8.3 64.8 18.6 54.4 34 31.5Z" fill="#DCEAFE"/>
        <path d="M48 44C64.7 26.2 99.6 20.9 122.8 28.8C146 36.6 157.6 57.8 153.2 80.4C148.9 103 128.6 126.8 101.4 130.6C74.1 134.4 39.9 118.1 28.8 93.7C17.8 69.2 31.4 61.8 48 44Z" fill="#93C5FD"/>
      </svg>`,
  }),
  buildAsset({
    id: "shape-ring",
    name: "Focus Ring",
    category: "Shapes",
    width: 160,
    height: 160,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
        <circle cx="80" cy="80" r="56" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="14"/>
        <circle cx="80" cy="80" r="28" fill="#DBEAFE"/>
      </svg>`,
  }),
  buildAsset({
    id: "shape-panel",
    name: "Glass Panel",
    category: "Shapes",
    width: 200,
    height: 120,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120" fill="none">
        <rect x="10" y="10" width="180" height="100" rx="26" fill="white" fill-opacity="0.82"/>
        <rect x="10" y="10" width="180" height="100" rx="26" stroke="#BFDBFE" stroke-width="2"/>
        <path d="M32 42H120" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
        <path d="M32 64H168" stroke="#DBEAFE" stroke-width="8" stroke-linecap="round"/>
        <path d="M32 86H98" stroke="#DBEAFE" stroke-width="8" stroke-linecap="round"/>
      </svg>`,
  }),
  buildAsset({
    id: "badge-focus",
    name: "Focus Badge",
    category: "Badges",
    width: 180,
    height: 72,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="72" viewBox="0 0 180 72" fill="none">
        <rect width="180" height="72" rx="36" fill="#0F172A"/>
        <circle cx="38" cy="36" r="14" fill="#22C55E"/>
        <text x="62" y="42" fill="white" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">FOCUS</text>
      </svg>`,
  }),
  buildAsset({
    id: "badge-2026",
    name: "2026 Chip",
    category: "Badges",
    width: 152,
    height: 60,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="152" height="60" viewBox="0 0 152 60" fill="none">
        <rect x="2" y="2" width="148" height="56" rx="28" fill="#FFFFFF"/>
        <rect x="2" y="2" width="148" height="56" rx="28" stroke="#CBD5E1" stroke-width="2"/>
        <text x="76" y="38" text-anchor="middle" fill="#1E293B" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">2026</text>
      </svg>`,
  }),
  buildAsset({
    id: "badge-dream",
    name: "Dream Ticket",
    category: "Badges",
    width: 200,
    height: 86,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="86" viewBox="0 0 200 86" fill="none">
        <rect width="200" height="86" rx="24" fill="#FEF3C7"/>
        <path d="M52 0V86" stroke="#F59E0B" stroke-width="4" stroke-dasharray="8 10"/>
        <text x="72" y="38" fill="#92400E" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700">Dream</text>
        <text x="72" y="58" fill="#B45309" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="500">Ticket</text>
      </svg>`,
  }),
  buildAsset({
    id: "decor-starburst",
    name: "Starburst",
    category: "Decor",
    width: 160,
    height: 160,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
        <path d="M80 10L91 53L129 31L107 68L150 80L107 92L129 129L91 107L80 150L69 107L31 129L53 92L10 80L53 68L31 31L69 53L80 10Z" fill="#FDE68A"/>
        <circle cx="80" cy="80" r="26" fill="#F59E0B"/>
      </svg>`,
  }),
  buildAsset({
    id: "decor-confetti",
    name: "Confetti",
    category: "Decor",
    width: 170,
    height: 120,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="170" height="120" viewBox="0 0 170 120" fill="none">
        <circle cx="24" cy="28" r="12" fill="#60A5FA"/>
        <circle cx="64" cy="54" r="10" fill="#34D399"/>
        <circle cx="116" cy="24" r="11" fill="#F472B6"/>
        <circle cx="142" cy="72" r="12" fill="#FBBF24"/>
        <rect x="14" y="78" width="42" height="10" rx="5" fill="#BFDBFE"/>
        <rect x="78" y="76" width="52" height="10" rx="5" fill="#FECACA"/>
        <rect x="94" y="48" width="46" height="10" rx="5" fill="#A7F3D0"/>
      </svg>`,
  }),
  buildAsset({
    id: "decor-arrow",
    name: "Momentum Arrow",
    category: "Decor",
    width: 220,
    height: 96,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="96" viewBox="0 0 220 96" fill="none">
        <path d="M12 70C58 72 76 22 120 22C151 22 169 38 196 38" stroke="#1D4ED8" stroke-width="10" stroke-linecap="round"/>
        <path d="M178 18L208 38L178 58" stroke="#1D4ED8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
  }),
];

export const IMAGE_FILTER_PRESETS = [
  {
    id: "clean",
    name: "Clean",
    values: { brightness: 100, contrast: 100, blur: 0, tint: "rgba(0,0,0,0)" },
  },
  {
    id: "soft",
    name: "Soft",
    values: { brightness: 106, contrast: 94, blur: 0.3, tint: "rgba(255,255,255,0.08)" },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    values: { brightness: 92, contrast: 112, blur: 0, tint: "rgba(15,23,42,0.12)" },
  },
  {
    id: "dream",
    name: "Dream",
    values: { brightness: 108, contrast: 92, blur: 1.2, tint: "rgba(168,85,247,0.12)" },
  },
];
