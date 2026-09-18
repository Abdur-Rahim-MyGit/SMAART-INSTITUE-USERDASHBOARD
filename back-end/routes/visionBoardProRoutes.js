const express = require("express");
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
router.use(generalLimiter);

const controller = require("../controllers/visionBoardProController");

// Public read-only view of a shared board. Registered BEFORE `protect` on
// purpose: the unguessable token is the only credential a viewer has.
router.get("/shared/:token", controller.getSharedBoard);

// SECURITY: require a valid JWT for every other Vision Board Pro route. The
// frontend (visionBoardProApi.js) already sends the token via the apiCall
// helper, so this does not change the client contract — it only closes the
// unauthenticated IDOR where any caller could read/modify another user's
// boards via ?userId=.
router.use(protect);

/**
 * Vision Board Pro Routes
 * Stores ONE merged collage image per vision board (not individual images)
 * Maximum 3 vision boards per user
 */

// Create a new vision board (with merged collage)
router.post("/", controller.createVisionBoard);

// Get all vision boards for a user
router.get("/", controller.getAllVisionBoards);

// Get user's vision board count and limit status
router.get("/count", controller.getBoardCount);

// Active vision board routes (for dashboard display)
// IMPORTANT: These must come BEFORE /:id routes to prevent "active" from being matched as an ID
router.get("/active", controller.getActiveVision);
router.put("/active/:id", controller.setActiveVision);
router.delete("/active", controller.clearActiveVision);

// Get a single vision board
router.get("/:id", controller.getVisionBoard);

// Update a vision board (with merged collage)
router.put("/:id", controller.updateVisionBoard);

// Delete a vision board
router.delete("/:id", controller.deleteVisionBoard);

// Duplicate a vision board
router.post("/:id/duplicate", controller.duplicateVisionBoard);

// Public share link on / off
router.post("/:id/share", controller.enableShare);
router.delete("/:id/share", controller.disableShare);

module.exports = router;
