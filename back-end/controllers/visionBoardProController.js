const VisionBoardPro = require("../models/VisionBoardPro");
const User = require("../models/User");
const Student = require("../models/Student");
const {
  uploadBase64Image,
  deleteImage,
} = require("../helpers/cloudinaryHelper");
const mongoose = require("mongoose");

/**
 * Vision Board Pro Controller
 * Stores only ONE merged collage image per vision board
 * No individual images are stored - only the final composite
 */

// Maximum 3 vision boards per user
const MAX_VISION_BOARDS_PER_USER = 3;

// Helper to get userId — ONLY from the verified JWT (set by the protect
// middleware). We deliberately no longer fall back to req.body.userId /
// req.query.userId: trusting a client-supplied id was the IDOR that let anyone
// read or destroy another user's boards by passing ?userId=<victim>.
const getUserId = (req) => {
  if (req.user?.id) return req.user.id;
  if (req.user?._id) return req.user._id;
  return null;
};

// Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Build user query that handles both string and ObjectId formats
const buildUserQuery = (userId) => {
  const queries = [{ userId: userId }]; // String match
  
  if (isValidObjectId(userId)) {
    queries.push({ userId: new mongoose.Types.ObjectId(userId) }); // ObjectId match
  }
  
  return { $or: queries };
};

const buildOwnedBoardQuery = (boardId, userId) => ({
  _id: boardId,
  ...buildUserQuery(userId),
});

const clonePlain = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
};

/**
 * Create a new vision board
 * Stores merged collage image AND individual editable data
 */
exports.createVisionBoard = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Use helper function to build query that matches both string and ObjectId
    const userQuery = buildUserQuery(userId);

    // Check if user has reached the maximum limit
    const existingBoardsCount = await VisionBoardPro.countDocuments(userQuery);
    if (existingBoardsCount >= MAX_VISION_BOARDS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `You can only save up to ${MAX_VISION_BOARDS_PER_USER} vision boards. Please delete an existing board to create a new one.`,
        maxReached: true,
        currentCount: existingBoardsCount,
        maxAllowed: MAX_VISION_BOARDS_PER_USER,
      });
    }

    const {
      title,
      description,
      templateId,
      canvasSettings,
      collageImage,
      slotImages,
      textOverlays,
      assetOverlays,
      userUploads,
      shortTermGoals,
      longTermGoals,
    } = req.body;

    // Upload the merged collage image to Cloudinary
    let collageUrl = "";
    let collagePublicId = "";

    if (collageImage && collageImage.startsWith("data:image")) {
      const uploadResult = await uploadBase64Image(
        collageImage,
        "vision-boards-pro/collages"
      );
      if (uploadResult.success) {
        collageUrl = uploadResult.url;
        collagePublicId = uploadResult.publicId;
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to upload collage image",
        });
      }
    }

    const visionBoard = new VisionBoardPro({
      title: title || "Untitled Vision Board",
      description: description || "",
      templateId: templateId || "grid-2x2",
      canvasSettings: {
        aspectRatio: canvasSettings?.aspectRatio || "1:1",
        width: canvasSettings?.width || 1080,
        height: canvasSettings?.height || 1080,
        backgroundColor: canvasSettings?.backgroundColor || "#ffffff",
        backgroundImage: canvasSettings?.backgroundImage || null,
        borderRadius: canvasSettings?.borderRadius || 8,
        gap: canvasSettings?.gap || 8,
      },
      collageImage: collageUrl,
      collageImagePublicId: collagePublicId,
      slotImages: slotImages || {},
      textOverlays: textOverlays || {},
      assetOverlays: assetOverlays || {},
      userUploads: userUploads || [],
      shortTermGoals: shortTermGoals || [],
      longTermGoals: longTermGoals || [],
      // Store userId as ObjectId for consistency
      userId: isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId,
    });

    await visionBoard.save();

    res.status(201).json({
      success: true,
      message: "Vision board created successfully",
      data: visionBoard,
    });
  } catch (error) {
    console.error("Create vision board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vision board",
      error: error.message,
    });
  }
};

/**
 * Get all vision boards for a user
 */
exports.getAllVisionBoards = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Use helper function to build query that matches both string and ObjectId
    const userQuery = buildUserQuery(userId);

    const boards = await VisionBoardPro.find(userQuery)
      .sort({ createdAt: -1 })
      .lean();


    res.status(200).json({
      success: true,
      count: boards.length,
      maxAllowed: MAX_VISION_BOARDS_PER_USER,
      canCreateMore: boards.length < MAX_VISION_BOARDS_PER_USER,
      data: boards,
    });
  } catch (error) {
    console.error("Get all vision boards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vision boards",
      error: error.message,
    });
  }
};

/**
 * Get user's vision board count and limit status
 */
exports.getBoardCount = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Use helper function to build query that matches both string and ObjectId
    const userQuery = buildUserQuery(userId);

    const count = await VisionBoardPro.countDocuments(userQuery);

    res.status(200).json({
      success: true,
      count,
      maxAllowed: MAX_VISION_BOARDS_PER_USER,
      canCreateMore: count < MAX_VISION_BOARDS_PER_USER,
      remaining: MAX_VISION_BOARDS_PER_USER - count,
    });
  } catch (error) {
    console.error("Get board count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get board count",
      error: error.message,
    });
  }
};

/**
 * Get a single vision board by ID
 */
exports.getVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    const board = await VisionBoardPro.findOne(buildOwnedBoardQuery(id, userId));

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found or does not belong to you",
      });
    }

    res.status(200).json({
      success: true,
      data: board,
    });
  } catch (error) {
    console.error("Get vision board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vision board",
      error: error.message,
    });
  }
};

/**
 * Update a vision board
 * Updates merged collage image AND individual editable data
 */
exports.updateVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    const board = await VisionBoardPro.findOne(buildOwnedBoardQuery(id, userId));
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found or does not belong to you",
      });
    }

    const {
      title,
      templateId,
      description,
      canvasSettings,
      collageImage,
      slotImages,
      textOverlays,
      assetOverlays,
      userUploads,
      shortTermGoals,
      longTermGoals,
    } = req.body;

    // Handle collage image update
    if (collageImage && collageImage.startsWith("data:image")) {
      // Delete old collage image if exists
      if (board.collageImagePublicId) {
        await deleteImage(board.collageImagePublicId);
      }

      const uploadResult = await uploadBase64Image(
        collageImage,
        "vision-boards-pro/collages"
      );
      if (uploadResult.success) {
        board.collageImage = uploadResult.url;
        board.collageImagePublicId = uploadResult.publicId;
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to upload collage image",
        });
      }
    }

    // Update fields
    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (templateId !== undefined) board.templateId = templateId;
    if (canvasSettings !== undefined) {
      board.canvasSettings = {
        ...board.canvasSettings,
        ...canvasSettings,
      };
    }
    if (slotImages !== undefined) board.slotImages = slotImages;
    if (textOverlays !== undefined) board.textOverlays = textOverlays;
    if (assetOverlays !== undefined) board.assetOverlays = assetOverlays;
    if (userUploads !== undefined) board.userUploads = userUploads;
    if (shortTermGoals !== undefined) board.shortTermGoals = shortTermGoals;
    if (longTermGoals !== undefined) board.longTermGoals = longTermGoals;

    await board.save();

    res.status(200).json({
      success: true,
      message: "Vision board updated successfully",
      data: board,
    });
  } catch (error) {
    console.error("Update vision board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vision board",
      error: error.message,
    });
  }
};

/**
 * Delete a vision board
 */
exports.deleteVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    const board = await VisionBoardPro.findOne(buildOwnedBoardQuery(id, userId));
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found or does not belong to you",
      });
    }

    // Delete collage image from Cloudinary
    if (board.collageImagePublicId) {
      await deleteImage(board.collageImagePublicId);
    }

    await VisionBoardPro.deleteOne(buildOwnedBoardQuery(id, userId));

    res.status(200).json({
      success: true,
      message: "Vision board deleted successfully",
    });
  } catch (error) {
    console.error("Delete vision board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vision board",
      error: error.message,
    });
  }
};

/**
 * Duplicate a vision board
 * Note: The collage image URL is copied (not re-uploaded) to save storage
 */
exports.duplicateVisionBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    // Check if user has reached the maximum limit
    // Use helper function to build query that matches both string and ObjectId
    const userQuery = buildUserQuery(userId);
    const existingBoardsCount = await VisionBoardPro.countDocuments(userQuery);
    if (existingBoardsCount >= MAX_VISION_BOARDS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `You can only save up to ${MAX_VISION_BOARDS_PER_USER} vision boards. Please delete an existing board to duplicate.`,
        maxReached: true,
        currentCount: existingBoardsCount,
        maxAllowed: MAX_VISION_BOARDS_PER_USER,
      });
    }

    const original = await VisionBoardPro.findOne(buildOwnedBoardQuery(id, userId));
    if (!original) {
      return res.status(404).json({
        success: false,
        message: "Vision board not found or does not belong to you",
      });
    }

    const duplicate = new VisionBoardPro({
      title: `${original.title} (Copy)`,
      description: original.description,
      templateId: original.templateId,
      canvasSettings: clonePlain(original.canvasSettings, {}),
      collageImage: original.collageImage,
      slotImages: clonePlain(original.slotImages, {}),
      textOverlays: clonePlain(original.textOverlays, {}),
      assetOverlays: clonePlain(original.assetOverlays, {}),
      userUploads: clonePlain(original.userUploads, []),
      shortTermGoals: clonePlain(original.shortTermGoals, []),
      longTermGoals: clonePlain(original.longTermGoals, []),
      // Note: We share the same image URL, no publicId to avoid accidental deletion
      userId: isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId,
    });

    await duplicate.save();

    res.status(201).json({
      success: true,
      message: "Vision board duplicated successfully",
      data: duplicate,
    });
  } catch (error) {
    console.error("Duplicate vision board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to duplicate vision board",
      error: error.message,
    });
  }
};

/**
 * Set a vision board as the active vision for dashboard display
 * PUT /api/vision-board-pro/active/:id
 */
exports.setActiveVision = async (req, res) => {
  try {
    console.log('=== setActiveVision called ===');
    console.log('req.body:', req.body);
    console.log('req.query:', req.query);
    console.log('req.params:', req.params);

    const userId = getUserId(req);
    const { id } = req.params;

    console.log('Extracted userId:', userId);
    console.log('Board ID to set active:', id);

    if (!userId) {
      console.log('Missing userId - returning 400');
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!isValidObjectId(id)) {
      console.log('Invalid board ID - returning 400');
      return res.status(400).json({
        success: false,
        message: "Invalid vision board ID",
      });
    }

    // Verify the vision board exists and belongs to the user
    // Only convert to ObjectId if it's a valid hex string, otherwise use as is
    let userQueryId = userId;
    try {
      if (typeof userId === 'string' && isValidObjectId(userId)) {
        userQueryId = new mongoose.Types.ObjectId(userId);
      }
    } catch (e) {
      console.log('userId is not a valid ObjectId hex string, using as raw string');
    }

    console.log('Looking for board with _id:', id, 'and userId:', userQueryId);

    // First, let's see what boards exist for debugging
    const allUserBoards = await VisionBoardPro.find({ userId: userQueryId });
    console.log('All boards for this user:', allUserBoards.length);
    allUserBoards.forEach(b => {
      console.log(`  - Board: ${b._id} | Title: ${b.title} | UserId: ${b.userId}`);
    });

    const board = await VisionBoardPro.findOne({ _id: id, userId: userQueryId });
    console.log('Board found:', board ? 'Yes' : 'No');
    if (board) {
      console.log('Board title:', board.title);
      console.log('Board collageImage:', board.collageImage);
    }

    if (!board) {
      // Try finding without userId to check if board exists
      const boardExists = await VisionBoardPro.findById(id);
      console.log('Board exists (without userId check):', boardExists ? 'Yes' : 'No');
      if (boardExists) {
        console.log('Board userId:', boardExists.userId);
        console.log('Requested userId:', userQueryId);
        console.log('UserId match:', boardExists.userId?.toString() === userQueryId?.toString());
      }

      return res.status(404).json({
        success: false,
        message: "Vision board not found or does not belong to you",
      });
    }

    // Update user's activeVisionBoardId - try Student first, then User
    console.log('Updating activeVisionBoardId...');

    // Try updating Student first (most common case for logged-in students)
    let updateResult = await Student.findByIdAndUpdate(
      userId,
      { activeVisionBoardId: id },
      { new: true }
    );

    if (updateResult) {
      console.log('Student update successful');
    } else {
      // Fall back to User collection
      console.log('Student not found, trying User collection...');
      updateResult = await User.findByIdAndUpdate(
        userId,
        { activeVisionBoardId: id },
        { new: true }
      );
      console.log('User update result:', updateResult ? 'Success' : 'Failed');
      if (updateResult) {
        console.log('Updated User activeVisionBoardId:', updateResult.activeVisionBoardId);
      }
    }

    if (!updateResult) {
      console.log('ERROR: Could not find User or Student to update!');
      return res.status(404).json({
        success: false,
        message: "User account not found. Please log in again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vision board set as active",
      data: {
        id: board._id,
        title: board.title,
        image: board.collageImage,
      },
    });
  } catch (error) {
    console.error("Set active vision error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set active vision",
      error: error.message,
    });
  }
};

/**
 * Get the currently active vision board for a user
 * GET /api/vision-board-pro/active
 */
exports.getActiveVision = async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('userId:', userId);

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('Missing or invalid userId');
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate userId is a valid ObjectId before querying
    if (!isValidObjectId(userId)) {
      console.log('Invalid ObjectId format:', userId);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Get user's active vision board ID - try Student first, then User
    let activeVisionBoardId = null;
    let accountType = null;

    // Try Student collection first (most common for logged-in students)
    const student = await Student.findById(userId).select("activeVisionBoardId");

    if (student) {
      activeVisionBoardId = student.activeVisionBoardId;
      accountType = 'Student';
    } else {
      // Fall back to User collection
      const user = await User.findById(userId).select("activeVisionBoardId");
      console.log('User found:', user ? 'Yes' : 'No');
      if (user) {
        activeVisionBoardId = user.activeVisionBoardId;
        accountType = 'User';
        console.log('User activeVisionBoardId:', user.activeVisionBoardId);
      }
    }

    if (!activeVisionBoardId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active vision board set",
      });
    }

    // Get the vision board data
    const board = await VisionBoardPro.findById(activeVisionBoardId);

    if (!board) {
      // Vision board was deleted, clear the reference
      if (student) {
        await Student.findByIdAndUpdate(userId, { activeVisionBoardId: null });
      } else {
        await User.findByIdAndUpdate(userId, { activeVisionBoardId: null });
      }
      return res.status(200).json({
        success: true,
        data: null,
        message: "Active vision board no longer exists",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: board._id,
        title: board.title,
        image: board.collageImage,
        description: board.description,
        shortTermGoals: board.shortTermGoals,
        longTermGoals: board.longTermGoals,
      },
    });
  } catch (error) {
    console.error("Get active vision error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active vision",
      error: error.message,
    });
  }
};

/**
 * Clear the active vision board
 * DELETE /api/vision-board-pro/active
 */
exports.clearActiveVision = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Clear activeVisionBoardId - try Student first, then User
    const studentResult = await Student.findByIdAndUpdate(userId, { activeVisionBoardId: null });

    if (!studentResult) {
      // Fall back to User collection
      await User.findByIdAndUpdate(userId, { activeVisionBoardId: null });
    }

    res.status(200).json({
      success: true,
      message: "Active vision cleared",
    });
  } catch (error) {
    console.error("Clear active vision error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear active vision",
      error: error.message,
    });
  }
};
