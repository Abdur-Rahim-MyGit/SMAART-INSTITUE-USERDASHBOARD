/**
 * Grid Templates Configuration
 * PicsArt-style grid layouts for vision boards
 */

export const GRID_TEMPLATES = {
  // Empty canvas - no image slots, just text overlays
  "empty-canvas": {
    id: "empty-canvas",
    name: "Empty Canvas",
    description: "Blank canvas for text-only boards",
    icon: "○",
    slots: [],
  },

  // Freeform layout (Pinterest style)
  "freeform": {
    id: "freeform",
    name: "Freeform Collage",
    description: "Drag and drop anywhere, Pinterest-style",
    icon: "❈",
    slots: [],
    isFreeform: true,
  },

  // Single image
  single: {
    id: "single",
    name: "Single",
    description: "Full canvas single image",
    icon: "□",
    slots: [{ id: 0, x: 0, y: 0, width: 100, height: 100 }],
  },

  // 2 images side by side
  "split-horizontal": {
    id: "split-horizontal",
    name: "Split Horizontal",
    description: "Two images side by side",
    icon: "▯▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 50, height: 100 },
      { id: 1, x: 50, y: 0, width: 50, height: 100 },
    ],
  },

  // 2 images stacked
  "split-vertical": {
    id: "split-vertical",
    name: "Split Vertical",
    description: "Two images stacked",
    icon: "▭\n▭",
    slots: [
      { id: 0, x: 0, y: 0, width: 100, height: 50 },
      { id: 1, x: 0, y: 50, width: 100, height: 50 },
    ],
  },

  // 2x2 grid
  "grid-2x2": {
    id: "grid-2x2",
    name: "Grid 2×2",
    description: "Four equal squares",
    icon: "▢▢\n▢▢",
    slots: [
      { id: 0, x: 0, y: 0, width: 50, height: 50 },
      { id: 1, x: 50, y: 0, width: 50, height: 50 },
      { id: 2, x: 0, y: 50, width: 50, height: 50 },
      { id: 3, x: 50, y: 50, width: 50, height: 50 },
    ],
  },

  // 3x3 grid
  "grid-3x3": {
    id: "grid-3x3",
    name: "Grid 3×3",
    description: "Nine equal squares",
    icon: "▢▢▢\n▢▢▢\n▢▢▢",
    slots: [
      { id: 0, x: 0, y: 0, width: 33.333, height: 33.333 },
      { id: 1, x: 33.333, y: 0, width: 33.333, height: 33.333 },
      { id: 2, x: 66.666, y: 0, width: 33.333, height: 33.333 },
      { id: 3, x: 0, y: 33.333, width: 33.333, height: 33.333 },
      { id: 4, x: 33.333, y: 33.333, width: 33.333, height: 33.333 },
      { id: 5, x: 66.666, y: 33.333, width: 33.333, height: 33.333 },
      { id: 6, x: 0, y: 66.666, width: 33.333, height: 33.333 },
      { id: 7, x: 33.333, y: 66.666, width: 33.333, height: 33.333 },
      { id: 8, x: 66.666, y: 66.666, width: 33.333, height: 33.333 },
    ],
  },

  // 1 big + 2 small (right)
  "big-left-2": {
    id: "big-left-2",
    name: "Big + 2 Side",
    description: "One large, two small on right",
    icon: "█▯\n█▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 66.666, height: 100 },
      { id: 1, x: 66.666, y: 0, width: 33.333, height: 50 },
      { id: 2, x: 66.666, y: 50, width: 33.333, height: 50 },
    ],
  },

  // 1 big + 3 small
  "big-left-3": {
    id: "big-left-3",
    name: "Big + 3 Side",
    description: "One large, three small on right",
    icon: "█▯\n█▯\n█▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 66.666, height: 100 },
      { id: 1, x: 66.666, y: 0, width: 33.333, height: 33.333 },
      { id: 2, x: 66.666, y: 33.333, width: 33.333, height: 33.333 },
      { id: 3, x: 66.666, y: 66.666, width: 33.333, height: 33.333 },
    ],
  },

  // 1 big top + 4 small bottom
  "big-top-4": {
    id: "big-top-4",
    name: "Big Top + 4",
    description: "Large top, four small bottom",
    icon: "████\n▢▢▢▢",
    slots: [
      { id: 0, x: 0, y: 0, width: 100, height: 60 },
      { id: 1, x: 0, y: 60, width: 25, height: 40 },
      { id: 2, x: 25, y: 60, width: 25, height: 40 },
      { id: 3, x: 50, y: 60, width: 25, height: 40 },
      { id: 4, x: 75, y: 60, width: 25, height: 40 },
    ],
  },

  // 1 big + 4 small (PicsArt style)
  "featured-4": {
    id: "featured-4",
    name: "Featured + 4",
    description: "Large featured with 4 thumbnails",
    icon: "██▯\n██▯\n▯▯▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 66.666, height: 66.666 },
      { id: 1, x: 66.666, y: 0, width: 33.333, height: 33.333 },
      { id: 2, x: 66.666, y: 33.333, width: 33.333, height: 33.333 },
      { id: 3, x: 0, y: 66.666, width: 33.333, height: 33.333 },
      { id: 4, x: 33.333, y: 66.666, width: 33.333, height: 33.333 },
    ],
  },

  // 2x3 grid
  "grid-2x3": {
    id: "grid-2x3",
    name: "Grid 2×3",
    description: "Six rectangles in 2 rows",
    icon: "▯▯▯\n▯▯▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 33.333, height: 50 },
      { id: 1, x: 33.333, y: 0, width: 33.333, height: 50 },
      { id: 2, x: 66.666, y: 0, width: 33.333, height: 50 },
      { id: 3, x: 0, y: 50, width: 33.333, height: 50 },
      { id: 4, x: 33.333, y: 50, width: 33.333, height: 50 },
      { id: 5, x: 66.666, y: 50, width: 33.333, height: 50 },
    ],
  },

  // 3 columns
  "columns-3": {
    id: "columns-3",
    name: "3 Columns",
    description: "Three vertical strips",
    icon: "▯▯▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 33.333, height: 100 },
      { id: 1, x: 33.333, y: 0, width: 33.333, height: 100 },
      { id: 2, x: 66.666, y: 0, width: 33.333, height: 100 },
    ],
  },

  // Center focus
  "center-focus": {
    id: "center-focus",
    name: "Center Focus",
    description: "Large center with 4 corners",
    icon: "▢█▢\n███\n▢█▢",
    slots: [
      { id: 0, x: 25, y: 25, width: 50, height: 50 }, // Center
      { id: 1, x: 0, y: 0, width: 25, height: 50 }, // Left
      { id: 2, x: 75, y: 0, width: 25, height: 50 }, // Right
      { id: 3, x: 0, y: 50, width: 50, height: 50 }, // Bottom left
      { id: 4, x: 50, y: 50, width: 50, height: 50 }, // Bottom right
    ],
  },

  // Mosaic style
  mosaic: {
    id: "mosaic",
    name: "Mosaic",
    description: "Mixed size artistic layout",
    icon: "▯██\n▯▯▯\n██▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 40, height: 60 },
      { id: 1, x: 40, y: 0, width: 60, height: 40 },
      { id: 2, x: 40, y: 40, width: 30, height: 30 },
      { id: 3, x: 70, y: 40, width: 30, height: 60 },
      { id: 4, x: 0, y: 60, width: 40, height: 40 },
      { id: 5, x: 40, y: 70, width: 30, height: 30 },
    ],
  },

  // Story format (9:16)
  story: {
    id: "story",
    name: "Story Stack",
    description: "Vertical stack for stories",
    icon: "▭\n▭\n▭",
    slots: [
      { id: 0, x: 0, y: 0, width: 100, height: 33.333 },
      { id: 1, x: 0, y: 33.333, width: 100, height: 33.333 },
      { id: 2, x: 0, y: 66.666, width: 100, height: 33.333 },
    ],
  },

  // Pinterest style
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    description: "Masonry-style layout",
    icon: "▯▯\n▯█\n▯▯",
    slots: [
      { id: 0, x: 0, y: 0, width: 50, height: 40 },
      { id: 1, x: 50, y: 0, width: 50, height: 60 },
      { id: 2, x: 0, y: 40, width: 50, height: 60 },
      { id: 3, x: 50, y: 60, width: 50, height: 40 },
    ],
  },
};

// Aspect ratio presets
export const ASPECT_RATIOS = {
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
  "4:5": { width: 1080, height: 1350, label: "Portrait (4:5)" },
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
  "9:16": { width: 1080, height: 1920, label: "Story (9:16)" },
  "4:3": { width: 1440, height: 1080, label: "Standard (4:3)" },
  "3:4": { width: 1080, height: 1440, label: "Portrait (3:4)" },
};

// Export resolution presets
export const EXPORT_RESOLUTIONS = {
  hd: { width: 1080, height: 1080, label: "HD (1080×1080)" },
  "full-hd": { width: 1920, height: 1080, label: "Full HD (1920×1080)" },
  "2k": { width: 2048, height: 2048, label: "2K (2048×2048)" },
  "4k": { width: 3840, height: 2160, label: "4K (3840×2160)" },
  instagram: { width: 1080, height: 1080, label: "Instagram (1080×1080)" },
  story: { width: 1080, height: 1920, label: "Story (1080×1920)" },
  pinterest: { width: 1000, height: 1500, label: "Pinterest (1000×1500)" },
};

// Background color presets
export const BACKGROUND_COLORS = [
  "#FFFFFF", // White
  "#FDFBF7", // Warm White
  "#F2E8DF", // Oatmeal
  "#E8EAE6", // Sage Grey
  "#F5E6E8", // Soft Blush
  "#E5E7EB", // Cool Grey
  "#D1D5DB", // Slate
  "#0F172A", // Dark Slate
  "#18181B", // Zinc
  "#1C1917", // Stone
  "#FCD34D", // Pastel Yellow
  "#FDBA74", // Soft Orange
  "#FCA5A5", // Soft Red
  "#F9A8D4", // Pastel Pink
  "#C084FC", // Soft Purple
  "#818CF8", // Pastel Blue
  "#67E8F9", // Cyan
  "#5EEAD4", // Mint
  "#86EFAC", // Pastel Green
  "#0D9488", // Deep Teal
  "#2563EB", // Royal Blue
  "#9D174D", // Deep Rose
];

// Gradient presets
export const BACKGROUND_GRADIENTS = [
  "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", // Cloudy Apple
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Cherry Blossom
  "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)", // Winter Sky
  "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)", // Fresh Turf
  "linear-gradient(120deg, #f6d365 0%, #fda085 100%)", // Peach
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Plum Plate
  "linear-gradient(135deg, #BBD2C5 0%, #536976 100%)", // Green Beach
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", // Deep Space
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Mint
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Sunset
];

// Texture presets (SVG data URIs or image URLs)
export const BACKGROUND_TEXTURES = [
  // Grid Pattern
  "url('data:image/svg+xml;utf8,<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"%23e2e8f0\" stroke-width=\"1\"/></svg>')",
  // Dot Pattern
  "url('data:image/svg+xml;utf8,<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"2\" cy=\"2\" r=\"1.5\" fill=\"%23cbd5e1\"/></svg>')",
  // Diagonal Lines
  "url('data:image/svg+xml;utf8,<svg width=\"10\" height=\"10\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2\" stroke=\"%23e2e8f0\" stroke-width=\"1\"/></svg>')",
  // Wavy Pattern
  "url('data:image/svg+xml;utf8,<svg width=\"40\" height=\"10\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0,5 Q10,10 20,5 T40,5\" fill=\"none\" stroke=\"%23e2e8f0\" stroke-width=\"1\"/></svg>')",
];

// Border radius presets
export const BORDER_RADIUS_PRESETS = [
  { value: 0, label: "None" },
  { value: 8, label: "Small" },
  { value: 16, label: "Medium" },
  { value: 24, label: "Large" },
  { value: 32, label: "Extra Large" },
  { value: 9999, label: "Circular" },
];

// Gap presets
export const GAP_PRESETS = [
  { value: 0, label: "None" },
  { value: 2, label: "Minimal" },
  { value: 4, label: "Small" },
  { value: 8, label: "Medium" },
  { value: 12, label: "Large" },
  { value: 16, label: "Extra Large" },
  { value: 24, label: "Huge" },
];

export default GRID_TEMPLATES;
