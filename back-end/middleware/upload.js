const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary using individual environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage (local disk storage) - SECURITY: Secure randomness
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // SECURITY: Generate cryptographically secure unique filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Default Cloudinary storage configuration for general uploads
const defaultStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vision-boards-general",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// Dynamic Cloudinary storage - SECURITY: Lockdown folder to user ID
const dynamicStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // SECURITY: Strictly derive folder from authenticated user ID to prevent injection
    const userId = req.user?._id?.toString() || 'anonymous';
    const folder = `user-uploads/${userId}`;

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      public_id: `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    };
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/jpg', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF are allowed.'), false);
  }
};

// Create multer instance (local storage)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create multer instance with default Cloudinary storage
const uploadCloudinary = multer({
  storage: defaultStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create multer instance with dynamic Cloudinary storage
const uploadDynamic = multer({
  storage: dynamicStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Registration-specific Cloudinary storage - for profile photos and documents
const registrationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Use email from request body to organize files by user
    const email = (req.body.email || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const folder = `registrations/${email}`;

    // Determine resource type based on file mimetype
    const isDocument = file.mimetype === 'application/pdf';

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp", "pdf"],
      resource_type: isDocument ? "raw" : "image",
      public_id: `${file.fieldname}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      // Only apply transformation for images, not PDFs
      ...(isDocument ? {} : { transformation: [{ width: 1000, height: 1000, crop: "limit" }] }),
    };
  },
});

// File filter for registration (includes PDFs)
const registrationFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/jpg', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF are allowed.'), false);
  }
};

// Create multer instance for registration uploads to Cloudinary
const uploadRegistration = multer({
  storage: registrationStorage,
  fileFilter: registrationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});


// Helper function to upload a single image to a specific folder
const uploadToFolder = async (fileBuffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    // SECURITY: Ensure folder is sanitized or server-controlled
    const safeFolder = folder.replace(/[^\w\s\-/]/gi, '');
    const safeFilename = filename || `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: safeFolder,
        public_id: safeFilename,
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper function to delete an entire Cloudinary folder
const deleteFolder = async (folderPath) => {
  try {
    // SECURITY: Limit deletions to specific prefix if possible
    // First, delete all resources in the folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    // Then delete the empty folder
    await cloudinary.api.delete_folder(folderPath);
    return true;
  } catch (error) {
    console.error("Error deleting Cloudinary folder:", error);
    return false;
  }
};

// Helper function to move/copy image to a new folder
const moveToFolder = async (publicId, newFolder) => {
  try {
    const result = await cloudinary.uploader.rename(
      publicId,
      `${newFolder}/${publicId.split("/").pop()}`
    );
    return result;
  } catch (error) {
    console.error("Error moving image:", error);
    throw error;
  }
};

// Helper function to get all images in a folder
const getImagesInFolder = async (folderPath) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 500,
    });
    return result.resources;
  } catch (error) {
    console.error("Error fetching folder images:", error);
    return [];
  }
};

// Community posts Cloudinary storage
const communityStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const userId = req.user?._id?.toString() || 'anonymous';
    const folder = `community/posts/${userId}`;

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp", "mp4", "mov", "avi", "mkv"],
      resource_type: "auto", // Automatically detect if it's an image or video
      transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      public_id: `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    };
  },
});

const uploadCommunity = multer({
  storage: communityStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
module.exports.uploadCloudinary = uploadCloudinary;
module.exports.uploadDynamic = uploadDynamic;
module.exports.uploadRegistration = uploadRegistration;
module.exports.uploadCommunity = uploadCommunity;
module.exports.uploadToFolder = uploadToFolder;
module.exports.deleteFolder = deleteFolder;
module.exports.moveToFolder = moveToFolder;
module.exports.getImagesInFolder = getImagesInFolder;
module.exports.cloudinary = cloudinary;

