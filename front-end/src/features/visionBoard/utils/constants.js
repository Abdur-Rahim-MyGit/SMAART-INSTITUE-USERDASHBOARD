
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
