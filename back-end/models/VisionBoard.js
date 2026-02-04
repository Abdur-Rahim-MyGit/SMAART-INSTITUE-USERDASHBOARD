const mongoose = require("mongoose");

const visionBoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Template used for this board
  templateId: {
    type: String,
    default: "custom",
  },
  templateName: {
    type: String,
    default: "Custom",
  },
  // Complete board state - all items with positions, styles, content
  boardData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Thumbnail/preview image of the complete designed board
  thumbnail: {
    url: String,
    public_id: String,
  },
  // Unique collection ID for Cloudinary folder organization
  cloudinaryCollection: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Individual images (for backwards compatibility and image management)
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: "",
      },
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

// Generate unique collection ID before saving
visionBoardSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Generate cloudinaryCollection if it doesn't exist
  if (!this.cloudinaryCollection) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.cloudinaryCollection = `vb_${this.userId}_${timestamp}_${randomStr}`;
  }

  next();
});

module.exports = mongoose.model("VisionBoard", visionBoardSchema);
