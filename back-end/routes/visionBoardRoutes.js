const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Apply protection to all routes
router.use(protect);
const {
  createVisionBoard,
  getAllVisionBoards,
  getVisionBoard,
  updateVisionBoard,
  deleteVisionBoard,
  duplicateVisionBoard,
} = require("../controllers/visionBoardController");

/**
 * Vision Board Routes
 * Base path: /api/vision-board
 */

// POST /api/vision-board - Create new vision board
router.post("/", createVisionBoard);

// GET /api/vision-board - Get all vision boards for a user
router.get("/", getAllVisionBoards);

// GET /api/vision-board/:id - Get single vision board
router.get("/:id", getVisionBoard);

// PUT /api/vision-board/:id - Update vision board
router.put("/:id", updateVisionBoard);

// DELETE /api/vision-board/:id - Delete vision board
router.delete("/:id", deleteVisionBoard);

// POST /api/vision-board/:id/duplicate - Duplicate vision board
router.post("/:id/duplicate", duplicateVisionBoard);

module.exports = router;
