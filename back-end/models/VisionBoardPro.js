const mongoose = require("mongoose");

/**
 * Vision Board Pro Schema
 * PicsArt-style vision board - stores merged collage image AND editable data
 */

// Sub-schema for text overlay (without auto _id)
const textOverlaySchema = new mongoose.Schema({
  text: String,
  fontFamily: String,
  fontSize: Number,
  fontWeight: String,
  fontStyle: String,
  color: String,
  effect: String,
  align: String,
  rotation: { type: Number, default: 0 },
  position: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
  },
}, { _id: false });

// Sub-schema for slot image (without auto _id)
const slotImageSchema = new mongoose.Schema({
  url: String,
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  scale: { type: Number, default: 1 },
  rotation: { type: Number, default: 0 },
}, { _id: false });

const visionBoardProSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: "Untitled Vision Board",
  },

  description: {
    type: String,
    trim: true,
    default: "",
  },

  shortTermGoals: [{
    type: String,
    trim: true,
  }],

  longTermGoals: [{
    type: String,
    trim: true,
  }],

  // Template configuration
  templateId: {
    type: String,
    default: "grid-2x2",
  },

  // Canvas settings
  canvasSettings: {
    aspectRatio: {
      type: String,
      enum: ["1:1", "4:5", "16:9", "9:16", "4:3", "3:4"],
      default: "1:1",
    },
    width: {
      type: Number,
      default: 1080,
    },
    height: {
      type: Number,
      default: 1080,
    },
    backgroundColor: {
      type: String,
      default: "#ffffff",
    },
    backgroundImage: {
      type: String,
      default: null,
    },
    borderRadius: {
      type: Number,
      default: 8,
    },
    gap: {
      type: Number,
      default: 8,
    },
  },

  // THE MERGED COLLAGE IMAGE (for display in gallery/dashboard)
  collageImage: {
    type: String,
    default: "",
  },

  collageImagePublicId: {
    type: String,
    default: "",
  },

  // Individual slot images (for editing)
  slotImages: {
    type: Map,
    of: slotImageSchema,
    default: new Map(),
  },

  // Text overlays (for editing)
  textOverlays: {
    type: Map,
    of: textOverlaySchema,
    default: new Map(),
  },

  // User reference
  userId: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed to handle both String and ObjectId without forced casting
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps
visionBoardProSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

visionBoardProSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Indexes for faster queries
visionBoardProSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("VisionBoardPro", visionBoardProSchema);
