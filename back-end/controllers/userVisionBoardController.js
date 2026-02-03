const UserVisionBoard = require("../models/UserVisionBoard");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to get userId
const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.body?.userId || req.query?.userId;
};

/**
 * Generate optimized image URLs from Cloudinary
 * Multi-tier storage with different formats for different devices
 */
const generateOptimizedUrls = (publicId) => {
  const baseUrl = `https://res.cloudinary.com/${
    process.env.CLOUDINARY_CLOUD_NAME || "dzsqtuvti"
  }/image/upload`;

  return {
    // Web: WebP format, auto quality, max 1200px
    web: `${baseUrl}/f_webp,q_auto,w_1200/${publicId}`,

    // Mobile: WebP format, lower quality, max 600px
    mobile: `${baseUrl}/f_webp,q_auto:low,w_600/${publicId}`,

    // Thumbnail: Small preview, 300px
    thumbnail: `${baseUrl}/f_webp,q_auto:eco,w_300,h_300,c_fill/${publicId}`,
  };
};

/**
 * Upload image to Cloudinary with optimizations
 */
const uploadImage = async (base64Image, userId) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `vision-boards/users/${userId}`,
      resource_type: "image",
      transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
      // Enable eager transformations for faster delivery
      eager: [
        { width: 1200, format: "webp", quality: "auto" },
        { width: 600, format: "webp", quality: "auto:low" },
        {
          width: 300,
          height: 300,
          crop: "fill",
          format: "webp",
          quality: "auto:eco",
        },
      ],
      eager_async: true,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      optimized: generateOptimizedUrls(result.public_id),
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete image from Cloudinary
 */
const deleteImageFromCloud = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's vision board gallery
 */
exports.getGallery = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    let gallery = await UserVisionBoard.findOne({ userId });

    // Create gallery if doesn't exist
    if (!gallery) {
      gallery = new UserVisionBoard({ userId, images: [] });
      await gallery.save();
    }

    res.status(200).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error("Get gallery error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
      error: error.message,
    });
  }
};

/**
 * Upload a new image (max 3 per user)
 */
exports.uploadImage = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const { image, title, description } = req.body;

    if (!image || !image.startsWith("data:image")) {
      return res.status(400).json({
        success: false,
        message: "Valid image data is required",
      });
    }

    // Get or create gallery
    let gallery = await UserVisionBoard.findOne({ userId });
    if (!gallery) {
      gallery = new UserVisionBoard({ userId, images: [] });
    }

    // Check max 3 images
    if (gallery.images.length >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 images allowed. Please delete an image first.",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(image, userId);
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: uploadResult.error,
      });
    }

    // Add image to gallery
    const newImage = {
      original: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.size,
      },
      optimized: uploadResult.optimized,
      title: title || "",
      description: description || "",
      order: gallery.images.length + 1,
      uploadedAt: new Date(),
    };

    gallery.images.push(newImage);
    await gallery.save();

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        image: newImage,
        totalImages: gallery.images.length,
        remainingSlots: 3 - gallery.images.length,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

/**
 * Update image metadata (title, description)
 */
exports.updateImage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { imageId } = req.params;
    const { title, description, order } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const gallery = await UserVisionBoard.findOne({ userId });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    const image = gallery.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Update fields
    if (title !== undefined) image.title = title;
    if (description !== undefined) image.description = description;
    if (order !== undefined && order >= 1 && order <= 3) image.order = order;

    await gallery.save();

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: image,
    });
  } catch (error) {
    console.error("Update image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update image",
      error: error.message,
    });
  }
};

/**
 * Delete an image
 */
exports.deleteImage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { imageId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const gallery = await UserVisionBoard.findOne({ userId });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    const image = gallery.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete from Cloudinary
    if (image.original?.publicId) {
      await deleteImageFromCloud(image.original.publicId);
    }

    // Remove from gallery
    gallery.images.pull(imageId);

    // Reorder remaining images
    gallery.images.forEach((img, index) => {
      img.order = index + 1;
    });

    await gallery.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: {
        remainingImages: gallery.images.length,
        remainingSlots: 3 - gallery.images.length,
      },
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    });
  }
};

/**
 * Reorder images
 */
exports.reorderImages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { imageIds } = req.body; // Array of image IDs in new order

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: "imageIds must be an array",
      });
    }

    const gallery = await UserVisionBoard.findOne({ userId });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    // Reorder images
    imageIds.forEach((id, index) => {
      const image = gallery.images.id(id);
      if (image) {
        image.order = index + 1;
      }
    });

    await gallery.save();

    res.status(200).json({
      success: true,
      message: "Images reordered successfully",
      data: gallery.images,
    });
  } catch (error) {
    console.error("Reorder images error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder images",
      error: error.message,
    });
  }
};

/**
 * Update gallery settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { backgroundColor, layout, showTitles } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const gallery = await UserVisionBoard.findOne({ userId });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    // Update settings
    if (backgroundColor) gallery.settings.backgroundColor = backgroundColor;
    if (layout) gallery.settings.layout = layout;
    if (showTitles !== undefined) gallery.settings.showTitles = showTitles;

    await gallery.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: gallery.settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};
