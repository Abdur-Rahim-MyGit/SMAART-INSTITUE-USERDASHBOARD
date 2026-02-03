const VisionBoardNew = require("../models/VisionBoardNew");
const {
  uploadBase64Image,
  deleteImage,
  getPublicIdFromUrl,
} = require("../helpers/cloudinaryHelper");

/**
 * Vision Board Controller
 * Handles all CRUD operations for vision boards
 */

// Helper to validate ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Create a new vision board
 * POST /api/vision-board
 */
const createVisionBoard = async (req, res) => {
  try {
    const { title, description, thumbnail, boardData, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Upload thumbnail to Cloudinary if provided
    let thumbnailUrl = "";
    if (thumbnail && thumbnail.startsWith("data:image")) {
      const uploadResult = await uploadBase64Image(
        thumbnail,
        `vision-boards/${userId}`,
        `vb_${Date.now()}`
      );

      if (uploadResult.success) {
        thumbnailUrl = uploadResult.url;
      } else {
        console.error("Failed to upload thumbnail:", uploadResult.error);
      }
    }

    // Create new vision board
    const visionBoard = new VisionBoardNew({
      title: title || "Untitled Vision Board",
      description: description || "",
      thumbnail: thumbnailUrl,
      boardData: boardData || {
        elements: [],
        background: { type: "color", value: "#ffffff" },
        canvasWidth: 1200,
        canvasHeight: 800,
      },
      userId,
    });

    await visionBoard.save();

    res.status(201).json({
      success: true,
      message: "Vision board created successfully",
      data: visionBoard,
    });
  } catch (error) {
    console.error("Error creating vision board:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vision board",
      error: error.message,
    });
  }
};

/**
 * Get all vision boards for a user
 * GET /api/vision-board?userId=xxx
 */
const getAllVisionBoards = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const visionBoards = await VisionBoardNew.find({ userId })
      .sort({ updatedAt: -1 })
      .select("-boardData"); // Exclude boardData for list view

    res.json({
      success: true,
      count: visionBoards.length,
      data: visionBoards,
    });
  } catch (error) {
    console.error("Error fetching vision boards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vision boards",
      error: error.message,
    });
  }
};

/**
 * Get a single vision board by ID
 * GET /api/vision-board/:id
 */
const getVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    const visionBoard = await VisionBoardNew.findById(id);

    if (!visionBoard) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found",
      });
    }

    res.json({
      success: true,
      data: visionBoard,
    });
  } catch (error) {
    console.error("Error fetching vision board:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vision board",
      error: error.message,
    });
  }
};

/**
 * Update a vision board
 * PUT /api/vision-board/:id
 */
const updateVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, boardData } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    // Find existing board
    const existingBoard = await VisionBoardNew.findById(id);
    if (!existingBoard) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found",
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (boardData !== undefined) updateData.boardData = boardData;

    // Handle thumbnail update
    if (thumbnail && thumbnail.startsWith("data:image")) {
      // Delete old thumbnail if exists
      if (existingBoard.thumbnail) {
        const oldPublicId = getPublicIdFromUrl(existingBoard.thumbnail);
        if (oldPublicId) {
          await deleteImage(oldPublicId);
        }
      }

      // Upload new thumbnail
      const uploadResult = await uploadBase64Image(
        thumbnail,
        `vision-boards/${existingBoard.userId}`,
        `vb_${Date.now()}`
      );

      if (uploadResult.success) {
        updateData.thumbnail = uploadResult.url;
      }
    }

    // Update the vision board
    const updatedBoard = await VisionBoardNew.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Vision board updated successfully",
      data: updatedBoard,
    });
  } catch (error) {
    console.error("Error updating vision board:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vision board",
      error: error.message,
    });
  }
};

/**
 * Delete a vision board
 * DELETE /api/vision-board/:id
 */
const deleteVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    // Find the board first
    const visionBoard = await VisionBoardNew.findById(id);
    if (!visionBoard) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found",
      });
    }

    // Delete thumbnail from Cloudinary
    if (visionBoard.thumbnail) {
      const publicId = getPublicIdFromUrl(visionBoard.thumbnail);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    // Delete from database
    await VisionBoardNew.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Vision board deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vision board:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vision board",
      error: error.message,
    });
  }
};

/**
 * Duplicate a vision board
 * POST /api/vision-board/:id/duplicate
 */
const duplicateVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    // Find the original board
    const originalBoard = await VisionBoardNew.findById(id);
    if (!originalBoard) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found",
      });
    }

    // Create a new board with copied data
    const duplicatedBoard = new VisionBoardNew({
      title: `${originalBoard.title} (Copy)`,
      description: originalBoard.description,
      thumbnail: originalBoard.thumbnail, // Keep same thumbnail
      boardData: originalBoard.boardData,
      userId: originalBoard.userId,
    });

    await duplicatedBoard.save();

    res.status(201).json({
      success: true,
      message: "Vision board duplicated successfully",
      data: duplicatedBoard,
    });
  } catch (error) {
    console.error("Error duplicating vision board:", error);
    res.status(500).json({
      success: false,
      message: "Failed to duplicate vision board",
      error: error.message,
    });
  }
};

module.exports = {
  createVisionBoard,
  getAllVisionBoards,
  getVisionBoard,
  updateVisionBoard,
  deleteVisionBoard,
  duplicateVisionBoard,
};
