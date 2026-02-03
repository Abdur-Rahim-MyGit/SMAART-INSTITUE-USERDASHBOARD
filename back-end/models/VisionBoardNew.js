const mongoose = require("mongoose");

/**
 * Vision Board Schema
 * Stores vision board data with merged thumbnail image
 */
const visionBoardNewSchema = new mongoose.Schema({
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
  // Single merged PNG thumbnail from html2canvas
  thumbnail: {
    type: String,
    default: "",
  },
  // Complete board layout data (positions, rotations, text, etc.)
  boardData: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      elements: [],
      background: {
        type: "color",
        value: "#ffffff",
      },
      canvasWidth: 1200,
      canvasHeight: 800,
    },
  },
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
visionBoardNewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt timestamp before updating
visionBoardNewSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model("VisionBoardNew", visionBoardNewSchema);
