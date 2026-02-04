const cloudinary = require("cloudinary").v2;

// Configure Cloudinary using individual environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Cloudinary folder path
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadBase64Image = async (
  base64Image,
  folder = "vision-boards",
  publicId = null
) => {
  try {
    // Validate base64 string
    if (!base64Image) {
      throw new Error("No image data provided");
    }

    // Ensure the base64 string has the proper prefix
    let imageData = base64Image;
    if (!imageData.startsWith("data:image")) {
      imageData = `data:image/png;base64,${imageData}`;
    }

    // Upload options
    const uploadOptions = {
      folder: folder,
      resource_type: "image",
      transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
    };

    // Add public ID if provided
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("No public ID provided");
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Extract the public ID from the URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

module.exports = {
  uploadBase64Image,
  deleteImage,
  getPublicIdFromUrl,
  cloudinary,
};
