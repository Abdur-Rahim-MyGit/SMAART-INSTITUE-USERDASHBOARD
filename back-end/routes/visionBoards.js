const express = require("express");
const VisionBoard = require("../models/VisionBoard");
const uploadMiddleware = require("../middleware/upload");
const multer = require("multer");
const { protect } = require("../middleware/auth");

// Get cloudinary from the upload middleware
const cloudinary = uploadMiddleware.cloudinary;

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Apply protection to all vision board routes
router.use(protect);

// Temporary memory storage for processing before uploading to Cloudinary
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPEG, PNG, GIF are allowed."),
        false
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to upload buffer to Cloudinary with specific folder
const uploadToCloudinaryFolder = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper to validate ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// SECURITY (audit HIGH): vision boards are per-user. Enforce object ownership on
// every :id route so an authenticated user cannot read/update/delete another
// user's board. Admins are exempt.
const currentUserId = (req) => String(req.user?._id || req.user?.id || "");
const isAdmin = (req) =>
  req.user?.role === "admin" ||
  (Array.isArray(req.user?.roles) && req.user.roles.includes("admin"));
const canAccessBoard = (board, req) =>
  isAdmin(req) || String(board.userId) === currentUserId(req);

// Get all vision boards for a user
router.get("/", async (req, res) => {
  try {
    // SECURITY: never trust a client-supplied userId. Non-admins may only list
    // their own boards; an admin may optionally scope to a specific userId.
    const userId =
      isAdmin(req) && req.query.userId ? req.query.userId : currentUserId(req);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate userId format
    if (!isValidObjectId(userId)) {
      return res.json([]); // Return empty array for invalid userId
    }

    const visionBoards = await VisionBoard.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(visionBoards);
  } catch (error) {
    console.error("Error fetching vision boards:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single vision board
router.get("/:id", async (req, res) => {
  try {
    const visionBoard = await VisionBoard.findById(req.params.id);
    if (!visionBoard) {
      return res.status(404).json({ message: "Vision board not found" });
    }
    if (!canAccessBoard(visionBoard, req)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(visionBoard);
  } catch (error) {
    console.error("Error fetching vision board:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all images in a vision board's Cloudinary collection
router.get("/:id/collection", async (req, res) => {
  try {
    const visionBoard = await VisionBoard.findById(req.params.id);
    if (!visionBoard) {
      return res.status(404).json({ message: "Vision board not found" });
    }
    if (!canAccessBoard(visionBoard, req)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!visionBoard.cloudinaryCollection) {
      return res.json({ images: visionBoard.images, collection: null });
    }

    // Get all images from the Cloudinary folder
    const folderPath = `vision-boards/${visionBoard.cloudinaryCollection}`;
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 100,
    });

    res.json({
      collection: visionBoard.cloudinaryCollection,
      folderPath: folderPath,
      images: visionBoard.images,
      cloudinaryImages: result.resources,
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new vision board with consolidated Cloudinary collection
router.post(
  "/",
  memoryUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        templateId,
        templateName,
        boardData,
      } = req.body;

      // SECURITY: derive ownership from the authenticated session, never from
      // the request body — otherwise a user can create boards under another id.
      const userId = currentUserId(req);

      if (!title || !userId) {
        return res
          .status(400)
          .json({ message: "Title is required" });
      }

      // Generate unique collection ID for this vision board
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const collectionId = `vb_${userId}_${timestamp}_${randomStr}`;
      const folderPath = `vision-boards/${collectionId}`;

      // Upload thumbnail first
      let thumbnail = null;
      if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
        try {
          const thumbFile = req.files.thumbnail[0];
          const result = await uploadToCloudinaryFolder(
            thumbFile.buffer,
            folderPath,
            "thumbnail"
          );
          thumbnail = {
            url: result.secure_url,
            public_id: result.public_id,
          };
        } catch (uploadError) {
          console.error("Error uploading thumbnail:", uploadError);
        }
      }

      // Upload all images to the same Cloudinary folder
      const images = [];
      if (req.files && req.files.images && req.files.images.length > 0) {
        for (let i = 0; i < req.files.images.length; i++) {
          const file = req.files.images[i];
          const filename = `img_${i + 1}_${Date.now()}`;

          try {
            const result = await uploadToCloudinaryFolder(
              file.buffer,
              folderPath,
              filename
            );
            images.push({
              url: result.secure_url,
              public_id: result.public_id,
              alt: "",
            });
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
          }
        }
      }

      // Parse boardData if provided
      let parsedBoardData = null;
      if (boardData) {
        try {
          parsedBoardData = JSON.parse(boardData);
          // Update image URLs in boardData to use Cloudinary URLs
          if (parsedBoardData.items && images.length > 0) {
            let imageIndex = 0;
            parsedBoardData.items = parsedBoardData.items.map((item) => {
              if (
                item.type === "image" &&
                item.src &&
                item.src.startsWith("data:")
              ) {
                if (imageIndex < images.length) {
                  item.src = images[imageIndex].url;
                  imageIndex++;
                }
              }
              return item;
            });
          }
        } catch (e) {
          console.error("Error parsing boardData:", e);
        }
      }

      const visionBoard = new VisionBoard({
        title,
        description,
        images,
        userId,
        templateId: templateId || "custom",
        templateName: templateName || "Custom",
        boardData: parsedBoardData,
        thumbnail,
        cloudinaryCollection: collectionId,
      });

      await visionBoard.save();

      res.status(201).json({
        ...visionBoard.toObject(),
        collectionInfo: {
          id: collectionId,
          folderPath: folderPath,
          imageCount: images.length,
        },
      });
    } catch (error) {
      console.error("Error creating vision board:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update vision board - consolidate all images in the same collection
router.put("/:id", memoryUpload.array("images", 10), async (req, res) => {
  try {
    const { title, description, existingImages, removedImages } = req.body;

    // Find the existing vision board
    const existingBoard = await VisionBoard.findById(req.params.id);
    if (!existingBoard) {
      return res.status(404).json({ message: "Vision board not found" });
    }
    if (!canAccessBoard(existingBoard, req)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Ensure we have a collection ID
    let collectionId = existingBoard.cloudinaryCollection;
    if (!collectionId) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      collectionId = `vb_${existingBoard.userId}_${timestamp}_${randomStr}`;
    }
    const folderPath = `vision-boards/${collectionId}`;

    // Parse existing images to keep
    let images = [];
    if (existingImages) {
      try {
        images = JSON.parse(existingImages);
      } catch (e) {
        images = [];
      }
    }

    // Handle removed images - delete from Cloudinary
    if (removedImages) {
      try {
        const toRemove = JSON.parse(removedImages);
        for (const img of toRemove) {
          if (img.public_id) {
            try {
              await cloudinary.uploader.destroy(img.public_id);
            } catch (deleteError) {
              console.error("Error deleting image:", deleteError);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing removedImages:", e);
      }
    }

    // Upload new images to the same collection folder
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filename = `img_${images.length + i + 1}_${Date.now()}`;

        try {
          const result = await uploadToCloudinaryFolder(
            file.buffer,
            folderPath,
            filename
          );
          images.push({
            url: result.secure_url,
            public_id: result.public_id,
            alt: "",
          });
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      }
    }

    // Update the vision board
    const visionBoard = await VisionBoard.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        images,
        cloudinaryCollection: collectionId,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.json({
      ...visionBoard.toObject(),
      collectionInfo: {
        id: collectionId,
        folderPath: folderPath,
        imageCount: images.length,
      },
    });
  } catch (error) {
    console.error("Error updating vision board:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete vision board and its entire Cloudinary collection
router.delete("/:id", async (req, res) => {
  try {
    const visionBoard = await VisionBoard.findById(req.params.id);
    if (!visionBoard) {
      return res.status(404).json({ message: "Vision board not found" });
    }
    if (!canAccessBoard(visionBoard, req)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete the entire Cloudinary folder if collection exists
    if (visionBoard.cloudinaryCollection) {
      const folderPath = `vision-boards/${visionBoard.cloudinaryCollection}`;
      try {
        // Delete all resources in the folder
        await cloudinary.api.delete_resources_by_prefix(folderPath);
        // Try to delete the empty folder (may fail if folder doesn't exist)
        try {
          await cloudinary.api.delete_folder(folderPath);
        } catch (folderError) {
          console.log("Folder may not exist or already deleted");
        }
      } catch (deleteError) {
        console.error("Error deleting Cloudinary collection:", deleteError);
      }
    } else {
      // Fallback: Delete individual images if no collection
      for (const image of visionBoard.images) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
        }
      }
    }

    await VisionBoard.findByIdAndDelete(req.params.id);
    res.json({
      message: "Vision board deleted successfully",
      deletedCollection: visionBoard.cloudinaryCollection || null,
    });
  } catch (error) {
    console.error("Error deleting vision board:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Migrate existing vision board images to a consolidated collection
router.post("/:id/consolidate", async (req, res) => {
  try {
    const visionBoard = await VisionBoard.findById(req.params.id);
    if (!visionBoard) {
      return res.status(404).json({ message: "Vision board not found" });
    }
    if (!canAccessBoard(visionBoard, req)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Generate new collection ID if doesn't exist
    let collectionId = visionBoard.cloudinaryCollection;
    if (!collectionId) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      collectionId = `vb_${visionBoard.userId}_${timestamp}_${randomStr}`;
    }
    const folderPath = `vision-boards/${collectionId}`;

    // Move each existing image to the new folder
    const consolidatedImages = [];
    for (let i = 0; i < visionBoard.images.length; i++) {
      const image = visionBoard.images[i];
      const oldPublicId = image.public_id;
      const newFilename = `img_${i + 1}_${Date.now()}`;

      try {
        // Rename/move the image to the new folder
        const newPublicId = `${folderPath}/${newFilename}`;
        const result = await cloudinary.uploader.rename(
          oldPublicId,
          newPublicId
        );

        consolidatedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          alt: image.alt || "",
        });
      } catch (moveError) {
        console.error("Error moving image:", moveError);
        // Keep original if move fails
        consolidatedImages.push(image);
      }
    }

    // Update the vision board with consolidated images
    visionBoard.images = consolidatedImages;
    visionBoard.cloudinaryCollection = collectionId;
    await visionBoard.save();

    res.json({
      message: "Vision board images consolidated successfully",
      ...visionBoard.toObject(),
      collectionInfo: {
        id: collectionId,
        folderPath: folderPath,
        imageCount: consolidatedImages.length,
      },
    });
  } catch (error) {
    console.error("Error consolidating vision board:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
